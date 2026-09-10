-- 1. Update constraints on orders table
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
CHECK (status IN ('PENDING', 'CONFIRMED', 'READY_FOR_COLLECTION', 'COMPLETED', 'CANCELLED'));

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_check 
CHECK (payment_status IN ('PENDING', 'PAID', 'PAID_DEMO'));

-- 2. Create order_status_history table
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID NOT NULL REFERENCES auth.users(id),
    change_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by order
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history(order_id);

-- Enable RLS
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- Customer Policies for order_status_history
CREATE POLICY "Customers can view own order history"
ON public.order_status_history FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.orders
        WHERE id = order_status_history.order_id AND customer_id = auth.uid()
    )
);

-- Staff/Admin Policies for order_status_history
CREATE POLICY "Staff can view all order history"
ON public.order_status_history FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.staff_profiles
        WHERE id = auth.uid() AND is_active = true
    )
);

-- 3. update_order_status RPC
CREATE OR REPLACE FUNCTION update_order_status(
    p_order_id UUID,
    p_new_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_is_staff BOOLEAN;
    v_order RECORD;
BEGIN
    -- 1. Validate session & permissions
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    SELECT EXISTS(
        SELECT 1 FROM public.staff_profiles 
        WHERE id = v_user_id AND is_active = true
    ) INTO v_is_staff;
    
    IF NOT v_is_staff THEN
        RAISE EXCEPTION 'Only active staff/admin can update order status';
    END IF;

    -- 2. Lock and load order
    SELECT * INTO v_order 
    FROM public.orders 
    WHERE id = p_order_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    -- 3. Validate transitions
    IF v_order.status = 'CANCELLED' THEN
        RAISE EXCEPTION 'Cannot update a cancelled order';
    END IF;

    IF v_order.status = 'COMPLETED' THEN
        RAISE EXCEPTION 'Cannot update a completed order';
    END IF;

    -- PENDING -> CONFIRMED
    IF p_new_status = 'CONFIRMED' AND v_order.status != 'PENDING' THEN
        RAISE EXCEPTION 'Order can only be CONFIRMED from PENDING state';
    END IF;

    -- CONFIRMED -> READY_FOR_COLLECTION
    IF p_new_status = 'READY_FOR_COLLECTION' AND v_order.status != 'CONFIRMED' THEN
        RAISE EXCEPTION 'Order can only be READY_FOR_COLLECTION from CONFIRMED state';
    END IF;

    -- READY_FOR_COLLECTION -> COMPLETED
    IF p_new_status = 'COMPLETED' THEN
        IF v_order.status != 'READY_FOR_COLLECTION' THEN
            RAISE EXCEPTION 'Order can only be COMPLETED from READY_FOR_COLLECTION state';
        END IF;

        IF v_order.payment_status = 'PENDING' THEN
            RAISE EXCEPTION 'Payment must be confirmed before completing this order.';
        END IF;
    END IF;

    IF p_new_status NOT IN ('CONFIRMED', 'READY_FOR_COLLECTION', 'COMPLETED') THEN
         RAISE EXCEPTION 'Invalid status jump to %', p_new_status;
    END IF;

    -- 4. Execute update
    UPDATE public.orders 
    SET status = p_new_status 
    WHERE id = p_order_id;

    -- 5. Record history
    INSERT INTO public.order_status_history (
        order_id, old_status, new_status, changed_by, change_reason
    ) VALUES (
        p_order_id, v_order.status, p_new_status, v_user_id, 'Staff updated status'
    );

    RETURN jsonb_build_object('success', true);
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '%', SQLERRM;
END;
$$;

-- 4. confirm_pay_at_shop_payment RPC
CREATE OR REPLACE FUNCTION confirm_pay_at_shop_payment(
    p_order_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_is_staff BOOLEAN;
    v_order RECORD;
BEGIN
    -- 1. Validate session & permissions
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    SELECT EXISTS(
        SELECT 1 FROM public.staff_profiles 
        WHERE id = v_user_id AND is_active = true
    ) INTO v_is_staff;
    
    IF NOT v_is_staff THEN
        RAISE EXCEPTION 'Only active staff/admin can confirm payment';
    END IF;

    -- 2. Lock and load order
    SELECT * INTO v_order 
    FROM public.orders 
    WHERE id = p_order_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    IF v_order.status = 'CANCELLED' THEN
        RAISE EXCEPTION 'Cannot confirm payment for a cancelled order';
    END IF;

    IF v_order.payment_method != 'PAY_AT_SHOP' THEN
        RAISE EXCEPTION 'Can only confirm payment for PAY_AT_SHOP orders';
    END IF;

    IF v_order.payment_status != 'PENDING' THEN
        RAISE EXCEPTION 'Payment is already confirmed or in invalid state';
    END IF;

    -- 3. Execute update
    UPDATE public.orders 
    SET payment_status = 'PAID' 
    WHERE id = p_order_id;

    RETURN jsonb_build_object('success', true);
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '%', SQLERRM;
END;
$$;

-- 5. cancel_customer_order RPC
CREATE OR REPLACE FUNCTION cancel_customer_order(
    p_order_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_order RECORD;
    v_item RECORD;
    v_book RECORD;
BEGIN
    -- 1. Validate session
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 2. Lock and load order
    SELECT * INTO v_order 
    FROM public.orders 
    WHERE id = p_order_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    IF v_order.customer_id != v_user_id THEN
        RAISE EXCEPTION 'You do not have permission to cancel this order';
    END IF;

    IF v_order.status != 'PENDING' THEN
        RAISE EXCEPTION 'You can only cancel PENDING orders';
    END IF;

    -- 3. Restore Stock
    FOR v_item IN SELECT * FROM public.order_items WHERE order_id = p_order_id
    LOOP
        -- Lock book
        SELECT * INTO v_book 
        FROM public.books 
        WHERE id = v_item.book_id 
        FOR UPDATE;

        IF NOT FOUND THEN
             -- Book deleted? Still continue to next or handle? We should just skip or maybe add a zombie inventory transaction? No, wait. 
             -- If book is missing, we just ignore the stock restore. But since book_id is FK, book must exist unless soft-deleted (is_active). It still exists.
             CONTINUE;
        END IF;

        -- Update stock
        UPDATE public.books 
        SET stock = stock + v_item.quantity 
        WHERE id = v_book.id;

        -- Insert inventory transaction
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
            v_book.id,
            'ORDER_CANCEL_RESTORE',
            v_item.quantity,
            v_book.stock,
            v_book.stock + v_item.quantity,
            'Customer cancellation ' || v_order.order_number,
            'ORDER',
            v_order.id::TEXT,
            v_user_id
        );
    END LOOP;

    -- 4. Update order status
    UPDATE public.orders 
    SET status = 'CANCELLED' 
    WHERE id = p_order_id;

    -- 5. Record history
    INSERT INTO public.order_status_history (
        order_id, old_status, new_status, changed_by, change_reason
    ) VALUES (
        p_order_id, v_order.status, 'CANCELLED', v_user_id, 'Cancelled by customer'
    );

    RETURN jsonb_build_object('success', true);
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '%', SQLERRM;
END;
$$;
