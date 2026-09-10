-- 1. Update purchase_orders constraints and fields
ALTER TABLE public.purchase_orders DROP CONSTRAINT purchase_orders_status_check;
ALTER TABLE public.purchase_orders ADD CONSTRAINT purchase_orders_status_check CHECK (status IN ('DRAFT', 'APPROVED', 'CANCELLED', 'PARTIALLY_RECEIVED', 'RECEIVED'));
ALTER TABLE public.purchase_orders ADD COLUMN received_at timestamptz;

-- 2. Update purchase_order_items
ALTER TABLE public.purchase_order_items ADD COLUMN received_quantity integer NOT NULL DEFAULT 0;
ALTER TABLE public.purchase_order_items ADD CONSTRAINT purchase_order_items_received_quantity_check CHECK (received_quantity >= 0 AND received_quantity <= quantity);

-- 3. Create Receipt Audit Tables
CREATE TABLE public.purchase_order_receipts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    purchase_order_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    received_by uuid NOT NULL REFERENCES auth.users(id),
    received_at timestamptz NOT NULL DEFAULT now(),
    note text,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_po_receipts_po_id ON public.purchase_order_receipts(purchase_order_id);

CREATE TABLE public.purchase_order_receipt_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    receipt_id uuid NOT NULL REFERENCES public.purchase_order_receipts(id) ON DELETE CASCADE,
    purchase_order_item_id uuid NOT NULL REFERENCES public.purchase_order_items(id) ON DELETE CASCADE,
    book_id bigint NOT NULL REFERENCES public.books(id),
    quantity_received integer NOT NULL CHECK (quantity_received > 0),
    previous_stock integer NOT NULL CHECK (previous_stock >= 0),
    new_stock integer NOT NULL CHECK (new_stock >= 0),
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_po_receipt_items_receipt_id ON public.purchase_order_receipt_items(receipt_id);

-- RLS for receipts
ALTER TABLE public.purchase_order_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_receipt_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view purchase order receipts"
ON public.purchase_order_receipts FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.staff_profiles
        WHERE staff_profiles.id = auth.uid()
        AND staff_profiles.is_active = true
        AND staff_profiles.role IN ('admin', 'inventory_manager')
    )
);

CREATE POLICY "Staff can view purchase order receipt items"
ON public.purchase_order_receipt_items FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.staff_profiles
        WHERE staff_profiles.id = auth.uid()
        AND staff_profiles.is_active = true
        AND staff_profiles.role IN ('admin', 'inventory_manager')
    )
);

-- 4. Secure RPC for receiving
CREATE OR REPLACE FUNCTION public.receive_purchase_order(
    p_po_id uuid,
    p_items jsonb, -- array of { "item_id": "uuid", "qty": int }
    p_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_role text;
    v_user_active boolean;
    v_po_status text;
    v_receipt_id uuid;
    v_item record;
    v_parsed_item record;
    v_qty_to_receive integer;
    v_current_stock integer;
    v_new_stock integer;
    v_all_received boolean := true;
    v_some_received boolean := false;
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
        RAISE EXCEPTION 'Unauthorized: Only active Admins and Inventory Managers can receive Purchase Orders.';
    END IF;

    -- 3. PO Status Check (Must lock the PO row first to prevent concurrent receives)
    SELECT status INTO v_po_status
    FROM public.purchase_orders
    WHERE id = p_po_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Purchase Order not found.';
    END IF;

    IF v_po_status NOT IN ('APPROVED', 'PARTIALLY_RECEIVED') THEN
        RAISE EXCEPTION 'Purchase Order cannot be received. Current status: %', v_po_status;
    END IF;

    -- 4. Create the parent receipt
    INSERT INTO public.purchase_order_receipts (purchase_order_id, received_by, note)
    VALUES (p_po_id, auth.uid(), p_note)
    RETURNING id INTO v_receipt_id;

    -- 5. Loop through provided items
    FOR v_parsed_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(item_id uuid, qty int) LOOP
        v_qty_to_receive := v_parsed_item.qty;

        -- Validate input quantity
        IF v_qty_to_receive IS NULL OR v_qty_to_receive <= 0 THEN
            CONTINUE; -- Skip zeros
        END IF;

        -- Lock and read the PO item
        SELECT * INTO v_item
        FROM public.purchase_order_items
        WHERE id = v_parsed_item.item_id AND purchase_order_id = p_po_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Purchase Order Item % not found or does not belong to this PO.', v_parsed_item.item_id;
        END IF;

        -- Validate we are not over-receiving
        IF v_item.received_quantity + v_qty_to_receive > v_item.quantity THEN
            RAISE EXCEPTION 'Cannot receive more than ordered for item %. Ordered: %, Already Received: %, Attempted: %', 
                v_parsed_item.item_id, v_item.quantity, v_item.received_quantity, v_qty_to_receive;
        END IF;

        -- Lock and read book stock
        SELECT stock INTO v_current_stock
        FROM public.books
        WHERE id = v_item.book_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Book % not found.', v_item.book_id;
        END IF;

        v_new_stock := v_current_stock + v_qty_to_receive;

        -- Update book stock
        UPDATE public.books
        SET stock = v_new_stock
        WHERE id = v_item.book_id;

        -- Insert into inventory_transactions (Crucial requirement)
        INSERT INTO public.inventory_transactions (
            book_id,
            transaction_type,
            quantity_change,
            previous_stock,
            new_stock,
            reason,
            reference_type,
            reference_id,
            created_by
        ) VALUES (
            v_item.book_id,
            'PURCHASE_RECEIPT',
            v_qty_to_receive,
            v_current_stock,
            v_new_stock,
            'Purchase Order Received',
            'PO',
            p_po_id::text,
            auth.uid()
        );

        -- Insert into purchase_order_receipt_items
        INSERT INTO public.purchase_order_receipt_items (
            receipt_id,
            purchase_order_item_id,
            book_id,
            quantity_received,
            previous_stock,
            new_stock
        ) VALUES (
            v_receipt_id,
            v_item.id,
            v_item.book_id,
            v_qty_to_receive,
            v_current_stock,
            v_new_stock
        );

        -- Update PO item received quantity
        UPDATE public.purchase_order_items
        SET received_quantity = received_quantity + v_qty_to_receive
        WHERE id = v_item.id;
        
        v_some_received := true;

    END LOOP;

    IF NOT v_some_received THEN
        RAISE EXCEPTION 'No valid quantities provided to receive.';
    END IF;

    -- 6. Recalculate overall PO status
    FOR v_item IN SELECT * FROM public.purchase_order_items WHERE purchase_order_id = p_po_id LOOP
        IF v_item.received_quantity < v_item.quantity THEN
            v_all_received := false;
        END IF;
    END LOOP;

    -- Update PO status safely bypassing the protection trigger
    ALTER TABLE public.purchase_orders DISABLE TRIGGER trg_protect_po_status;
    
    IF v_all_received THEN
        UPDATE public.purchase_orders
        SET status = 'RECEIVED',
            received_at = now()
        WHERE id = p_po_id;
    ELSE
        UPDATE public.purchase_orders
        SET status = 'PARTIALLY_RECEIVED'
        WHERE id = p_po_id;
    END IF;

    ALTER TABLE public.purchase_orders ENABLE TRIGGER trg_protect_po_status;

END;
$$;


-- 5. Update cancel_purchase_order to enforce cancellation rules
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

    IF v_po_status IN ('PARTIALLY_RECEIVED', 'RECEIVED') THEN
        RAISE EXCEPTION 'Cannot cancel a Purchase Order that has already been partially or fully received.';
    END IF;

    -- Inventory Managers can only cancel DRAFT
    IF v_role = 'inventory_manager' AND v_po_status <> 'DRAFT' THEN
        RAISE EXCEPTION 'Inventory Managers can only cancel DRAFT Purchase Orders.';
    END IF;

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
