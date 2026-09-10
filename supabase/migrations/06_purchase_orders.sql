-- 1. Create Sequence for PO Number
CREATE SEQUENCE public.purchase_order_seq START 1;

-- 2. Create Purchase Orders Table
CREATE TABLE public.purchase_orders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    po_number text UNIQUE NOT NULL,
    supplier_id bigint NOT NULL REFERENCES public.suppliers(id),
    status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'APPROVED', 'CANCELLED')),
    expected_date date,
    supplier_reference text,
    notes text,
    total_amount numeric(12, 2) NOT NULL DEFAULT 0.00,
    created_by uuid NOT NULL REFERENCES auth.users(id),
    approved_by uuid REFERENCES auth.users(id),
    approved_at timestamptz,
    cancelled_by uuid REFERENCES auth.users(id),
    cancelled_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indices for performance
CREATE INDEX idx_po_number ON public.purchase_orders(po_number);
CREATE INDEX idx_po_supplier_id ON public.purchase_orders(supplier_id);
CREATE INDEX idx_po_status ON public.purchase_orders(status);
CREATE INDEX idx_po_created_at ON public.purchase_orders(created_at DESC);

-- 3. Create Purchase Order Items Table
CREATE TABLE public.purchase_order_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    purchase_order_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    book_id bigint NOT NULL REFERENCES public.books(id),
    quantity integer NOT NULL CHECK (quantity >= 1),
    unit_cost numeric(12, 2) NOT NULL CHECK (unit_cost > 0),
    line_total numeric(12, 2) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(purchase_order_id, book_id)
);

-- Indices for PO Items
CREATE INDEX idx_po_items_po_id ON public.purchase_order_items(purchase_order_id);

-- 4. Trigger: Generate PO Number (PO-YYYY-0001)
CREATE OR REPLACE FUNCTION public.generate_po_number()
RETURNS trigger AS $$
BEGIN
    IF NEW.po_number IS NULL OR NEW.po_number = '' THEN
        NEW.po_number := 'PO-' || to_char(now(), 'YYYY') || '-' || LPAD(nextval('public.purchase_order_seq')::text, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_po_number
BEFORE INSERT ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.generate_po_number();

-- 5. Trigger: Auto-update updated_at for POs
CREATE OR REPLACE FUNCTION public.update_po_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_po_updated_at
BEFORE UPDATE ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_po_updated_at();

-- Trigger: Auto-update updated_at for PO Items
CREATE OR REPLACE FUNCTION public.update_po_item_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_po_item_updated_at
BEFORE UPDATE ON public.purchase_order_items
FOR EACH ROW
EXECUTE FUNCTION public.update_po_item_updated_at();

-- 6. Trigger: Calculate Line Total and Update PO Total
CREATE OR REPLACE FUNCTION public.calculate_po_totals()
RETURNS trigger AS $$
DECLARE
    v_po_id uuid;
    v_new_total numeric(12, 2);
BEGIN
    -- Calculate line total for the item being inserted/updated
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        NEW.line_total := NEW.quantity * NEW.unit_cost;
        v_po_id := NEW.purchase_order_id;
    ELSE
        v_po_id := OLD.purchase_order_id;
    END IF;

    -- Update the parent PO total_amount (Deferred/After)
    -- This part can be done in an AFTER trigger safely.
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_po_item_calculate_line_total
BEFORE INSERT OR UPDATE ON public.purchase_order_items
FOR EACH ROW
EXECUTE FUNCTION public.calculate_po_totals();

CREATE OR REPLACE FUNCTION public.update_parent_po_total()
RETURNS trigger AS $$
DECLARE
    v_po_id uuid;
    v_new_total numeric(12, 2);
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_po_id := OLD.purchase_order_id;
    ELSE
        v_po_id := NEW.purchase_order_id;
    END IF;

    SELECT COALESCE(SUM(line_total), 0) INTO v_new_total
    FROM public.purchase_order_items
    WHERE purchase_order_id = v_po_id;

    UPDATE public.purchase_orders
    SET total_amount = v_new_total
    WHERE id = v_po_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_po_item_update_parent_total
AFTER INSERT OR UPDATE OR DELETE ON public.purchase_order_items
FOR EACH ROW
EXECUTE FUNCTION public.update_parent_po_total();


-- 7. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies: purchase_orders
-- SELECT: admin & inventory_manager
CREATE POLICY "Staff can view purchase orders"
ON public.purchase_orders
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.staff_profiles
        WHERE staff_profiles.id = auth.uid()
        AND staff_profiles.is_active = true
        AND staff_profiles.role IN ('admin', 'inventory_manager')
    )
);

-- INSERT: admin & inventory_manager (Only DRAFT)
CREATE POLICY "Staff can insert purchase orders"
ON public.purchase_orders
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.staff_profiles
        WHERE staff_profiles.id = auth.uid()
        AND staff_profiles.is_active = true
        AND staff_profiles.role IN ('admin', 'inventory_manager')
    )
    AND status = 'DRAFT'
);

-- UPDATE: admin & inventory_manager (Only if DRAFT)
CREATE POLICY "Staff can update draft purchase orders"
ON public.purchase_orders
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.staff_profiles
        WHERE staff_profiles.id = auth.uid()
        AND staff_profiles.is_active = true
        AND staff_profiles.role IN ('admin', 'inventory_manager')
    )
    AND status = 'DRAFT'
);

-- 9. RLS Policies: purchase_order_items
-- SELECT
CREATE POLICY "Staff can view purchase order items"
ON public.purchase_order_items
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.staff_profiles
        WHERE staff_profiles.id = auth.uid()
        AND staff_profiles.is_active = true
        AND staff_profiles.role IN ('admin', 'inventory_manager')
    )
);

-- INSERT, UPDATE, DELETE items only if parent PO is DRAFT
CREATE POLICY "Staff can modify items of draft POs"
ON public.purchase_order_items
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.staff_profiles
        WHERE staff_profiles.id = auth.uid()
        AND staff_profiles.is_active = true
        AND staff_profiles.role IN ('admin', 'inventory_manager')
    )
    AND EXISTS (
        SELECT 1 FROM public.purchase_orders
        WHERE purchase_orders.id = purchase_order_id
        AND purchase_orders.status = 'DRAFT'
    )
);

-- 10. PROTECT STATUS MODIFICATIONS
-- Prevent non-admins from making status changes via direct UPDATE (other than our allowed RPCs)
CREATE OR REPLACE FUNCTION public.protect_po_status()
RETURNS trigger AS $$
BEGIN
    -- If status is changing, enforce rules
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- Only Admin RPCs or secure flows should modify status. 
        -- In our case, status changes are handled strictly via SECURITY DEFINER RPCs which run as Postgres superuser.
        -- We will verify the role inside the RPC, but here we can block standard SQL updates to status if not using RPC.
        -- Note: If we run as SECURITY DEFINER, the trigger might still fire. 
        -- To allow the RPC to do its job, we'll let the RPC logic handle the role validation safely.
        -- BUT if we want to block direct UI updates to status, we check if they are trying to change it.
        
        -- To be safe without breaking the RPC: The RPC can be trusted. 
        -- We will simply rely on the RLS policies which already prevent UPDATE if the OLD status is NOT 'DRAFT'.
        -- And we prevent setting NEW status to anything but 'DRAFT' during normal UPDATEs.
        IF NEW.status <> 'DRAFT' THEN
             RAISE EXCEPTION 'Cannot update status directly to %. Use appropriate functions (Approve/Cancel).', NEW.status;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_protect_po_status
BEFORE UPDATE ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.protect_po_status();


-- 11. RPC: approve_purchase_order
CREATE OR REPLACE FUNCTION public.approve_purchase_order(p_po_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_role text;
    v_user_active boolean;
    v_po_status text;
    v_supplier_active boolean;
    v_item_count int;
BEGIN
    -- 1. Authentication Check
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 2. Role Check (Admin only)
    SELECT role, is_active INTO v_role, v_user_active
    FROM public.staff_profiles
    WHERE id = auth.uid();

    IF NOT FOUND OR NOT v_user_active OR v_role <> 'admin' THEN
        RAISE EXCEPTION 'Unauthorized: Only active Admins can approve Purchase Orders.';
    END IF;

    -- 3. PO Check (Must be DRAFT)
    SELECT status INTO v_po_status
    FROM public.purchase_orders
    WHERE id = p_po_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Purchase Order not found.';
    END IF;

    IF v_po_status <> 'DRAFT' THEN
        RAISE EXCEPTION 'Purchase Order is not in DRAFT status.';
    END IF;

    -- 4. Supplier Active Check
    SELECT s.is_active INTO v_supplier_active
    FROM public.purchase_orders po
    JOIN public.suppliers s ON po.supplier_id = s.id
    WHERE po.id = p_po_id;

    IF NOT v_supplier_active THEN
        RAISE EXCEPTION 'Supplier is inactive. Cannot approve PO.';
    END IF;

    -- 5. Items Check
    SELECT count(*) INTO v_item_count
    FROM public.purchase_order_items
    WHERE purchase_order_id = p_po_id;

    IF v_item_count = 0 THEN
        RAISE EXCEPTION 'Cannot approve an empty Purchase Order.';
    END IF;

    -- 6. Execute Approval (Temporarily disable trg_protect_po_status for this session or bypass it)
    -- We can bypass the trigger by temporarily dropping it or altering it, but easier way:
    -- Just drop the trigger check if we run as security definer, wait, trg_protect_po_status blocks ANY change to NOT DRAFT.
    -- Let's change trg_protect_po_status to allow session variable override.
    -- Better yet, we can drop the BEFORE UPDATE trigger `trg_protect_po_status` and enforce it in RLS + RPC entirely.
    -- Since RLS already blocks updates where OLD.status <> 'DRAFT', and we only want to allow DRAFT->APPROVED inside RPC.
    
    -- Actually, to bypass our own trigger:
    ALTER TABLE public.purchase_orders DISABLE TRIGGER trg_protect_po_status;
    
    UPDATE public.purchase_orders
    SET status = 'APPROVED',
        approved_by = auth.uid(),
        approved_at = now()
    WHERE id = p_po_id;

    ALTER TABLE public.purchase_orders ENABLE TRIGGER trg_protect_po_status;
    
    -- NOTE: Inventory is explicitly NOT changed here per requirements.
END;
$$;


-- 12. RPC: cancel_purchase_order
CREATE OR REPLACE FUNCTION public.cancel_purchase_order(p_po_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_role text;
    v_user_active boolean;
    v_po_status text;
BEGIN
    -- 1. Authentication Check
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 2. Role Check
    SELECT role, is_active INTO v_role, v_user_active
    FROM public.staff_profiles
    WHERE id = auth.uid();

    IF NOT FOUND OR NOT v_user_active OR v_role NOT IN ('admin', 'inventory_manager') THEN
        RAISE EXCEPTION 'Unauthorized: Insufficient permissions.';
    END IF;

    -- 3. PO Status Check
    SELECT status INTO v_po_status
    FROM public.purchase_orders
    WHERE id = p_po_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Purchase Order not found.';
    END IF;

    IF v_po_status = 'CANCELLED' THEN
        RAISE EXCEPTION 'Purchase Order is already CANCELLED.';
    END IF;

    -- Inventory Managers can only cancel DRAFT
    IF v_role = 'inventory_manager' AND v_po_status <> 'DRAFT' THEN
        RAISE EXCEPTION 'Inventory Managers can only cancel DRAFT Purchase Orders.';
    END IF;

    -- Admins can cancel DRAFT or APPROVED (but not after receiving, which isn't implemented yet anyway)

    -- 4. Execute Cancel
    ALTER TABLE public.purchase_orders DISABLE TRIGGER trg_protect_po_status;
    
    UPDATE public.purchase_orders
    SET status = 'CANCELLED',
        cancelled_by = auth.uid(),
        cancelled_at = now()
    WHERE id = p_po_id;

    ALTER TABLE public.purchase_orders ENABLE TRIGGER trg_protect_po_status;
END;
$$;
