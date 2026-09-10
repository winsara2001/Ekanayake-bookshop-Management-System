-- 1. Update orders table with loyalty fields
ALTER TABLE public.orders 
ADD COLUMN loyalty_points_redeemed integer NOT NULL DEFAULT 0,
ADD COLUMN loyalty_discount_amount numeric NOT NULL DEFAULT 0,
ADD COLUMN loyalty_points_earned integer NOT NULL DEFAULT 0;

-- 2. Create loyalty tables
CREATE TABLE public.loyalty_settings (
    id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Ensure only one row
    earn_amount_per_point numeric NOT NULL DEFAULT 100.00 CHECK (earn_amount_per_point > 0),
    redemption_value_per_point numeric NOT NULL DEFAULT 1.00 CHECK (redemption_value_per_point > 0),
    is_active boolean NOT NULL DEFAULT true,
    updated_by uuid REFERENCES auth.users(id),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.loyalty_accounts (
    customer_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    points_balance integer NOT NULL DEFAULT 0 CHECK (points_balance >= 0),
    lifetime_points_earned integer NOT NULL DEFAULT 0,
    lifetime_points_redeemed integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.loyalty_transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_type text NOT NULL CHECK (transaction_type IN ('EARN', 'REDEEM', 'REDEEM_RESTORE')),
    points integer NOT NULL,
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
    description text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance and duplicate protection
CREATE INDEX idx_loyalty_transactions_customer ON public.loyalty_transactions(customer_id);
CREATE INDEX idx_loyalty_transactions_order ON public.loyalty_transactions(order_id);

-- Prevent duplicate EARN or REDEEM_RESTORE for the same order
CREATE UNIQUE INDEX idx_loyalty_tx_earn ON public.loyalty_transactions(order_id, transaction_type) WHERE transaction_type = 'EARN';
CREATE UNIQUE INDEX idx_loyalty_tx_restore ON public.loyalty_transactions(order_id, transaction_type) WHERE transaction_type = 'REDEEM_RESTORE';

-- 3. Insert default settings safely
INSERT INTO public.loyalty_settings (id, earn_amount_per_point, redemption_value_per_point, is_active)
VALUES (1, 100.00, 1.00, true)
ON CONFLICT (id) DO NOTHING;

-- 4. Enable RLS
ALTER TABLE public.loyalty_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- loyalty_settings policies
CREATE POLICY "Anyone can read loyalty settings" 
ON public.loyalty_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin can update loyalty settings" 
ON public.loyalty_settings FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.staff_profiles WHERE id = auth.uid() AND is_active = true AND role = 'admin')
);

-- loyalty_accounts policies
CREATE POLICY "Customers can view own loyalty account" 
ON public.loyalty_accounts FOR SELECT TO authenticated USING (customer_id = auth.uid());

CREATE POLICY "Admin can view all loyalty accounts" 
ON public.loyalty_accounts FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.staff_profiles WHERE id = auth.uid() AND is_active = true AND role = 'admin')
);

-- loyalty_transactions policies
CREATE POLICY "Customers can view own loyalty transactions" 
ON public.loyalty_transactions FOR SELECT TO authenticated USING (customer_id = auth.uid());

CREATE POLICY "Admin can view all loyalty transactions" 
ON public.loyalty_transactions FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.staff_profiles WHERE id = auth.uid() AND is_active = true AND role = 'admin')
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_loyalty_mod_time()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_loyalty_settings_mod_time
BEFORE UPDATE ON public.loyalty_settings FOR EACH ROW EXECUTE FUNCTION update_loyalty_mod_time();

CREATE TRIGGER update_loyalty_accounts_mod_time
BEFORE UPDATE ON public.loyalty_accounts FOR EACH ROW EXECUTE FUNCTION update_loyalty_mod_time();


-- 5. RPC: place_customer_order (Overwritten for Loyalty)
CREATE OR REPLACE FUNCTION place_customer_order(
    p_payment_method TEXT,
    p_notes TEXT,
    p_items JSONB,
    p_loyalty_points_to_redeem INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_customer_id UUID;
    v_is_staff BOOLEAN;
    v_order_number TEXT;
    v_order_id UUID;
    v_subtotal NUMERIC := 0;
    v_total_amount NUMERIC := 0;
    v_loyalty_discount NUMERIC := 0;
    v_payment_status TEXT;
    
    v_item RECORD;
    v_book_record RECORD;
    v_quantity INTEGER;
    v_book_id BIGINT;
    v_line_total NUMERIC;
    v_item_count INTEGER := 0;

    v_loyalty_settings RECORD;
    v_loyalty_account RECORD;
BEGIN
    -- 1. Validate customer session
    v_customer_id := auth.uid();
    IF v_customer_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    -- Reject active staff/admin
    SELECT EXISTS(
        SELECT 1 FROM public.staff_profiles 
        WHERE id = v_customer_id AND is_active = true
    ) INTO v_is_staff;
    
    IF v_is_staff THEN
        RAISE EXCEPTION 'Staff cannot place customer orders using this endpoint';
    END IF;
    
    -- Determine payment status
    IF p_payment_method = 'PAY_AT_SHOP' THEN
        v_payment_status := 'PENDING';
    ELSIF p_payment_method = 'MOCK_CARD' THEN
        v_payment_status := 'PAID_DEMO';
    ELSE
        RAISE EXCEPTION 'Invalid payment method';
    END IF;

    -- Loyalty Validation
    IF p_loyalty_points_to_redeem < 0 THEN
        RAISE EXCEPTION 'Cannot redeem negative points';
    END IF;

    IF p_loyalty_points_to_redeem > 0 THEN
        -- Get active settings
        SELECT * INTO v_loyalty_settings FROM public.loyalty_settings WHERE id = 1;
        IF NOT FOUND OR NOT v_loyalty_settings.is_active THEN
            RAISE EXCEPTION 'Loyalty program is currently inactive. Cannot redeem points.';
        END IF;

        -- Create or lock loyalty account
        INSERT INTO public.loyalty_accounts (customer_id, points_balance)
        VALUES (v_customer_id, 0)
        ON CONFLICT (customer_id) DO NOTHING;

        SELECT * INTO v_loyalty_account 
        FROM public.loyalty_accounts 
        WHERE customer_id = v_customer_id 
        FOR UPDATE;

        IF v_loyalty_account.points_balance < p_loyalty_points_to_redeem THEN
            RAISE EXCEPTION 'Insufficient loyalty points. Requested: %, Available: %', p_loyalty_points_to_redeem, v_loyalty_account.points_balance;
        END IF;

        v_loyalty_discount := p_loyalty_points_to_redeem * v_loyalty_settings.redemption_value_per_point;
    END IF;
    
    -- Create the order record first to get ID
    v_order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    INSERT INTO public.orders (
        customer_id, 
        order_number, 
        payment_method, 
        payment_status, 
        notes, 
        subtotal, 
        total_amount,
        loyalty_points_redeemed,
        loyalty_discount_amount
    ) VALUES (
        v_customer_id, 
        v_order_number, 
        p_payment_method, 
        v_payment_status, 
        p_notes, 
        0, 
        0,
        p_loyalty_points_to_redeem,
        v_loyalty_discount
    ) RETURNING id INTO v_order_id;
    
    -- Process items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_book_id := (v_item.value->>'book_id')::BIGINT;
        v_quantity := (v_item.value->>'quantity')::INTEGER;
        
        IF v_quantity <= 0 THEN
            RAISE EXCEPTION 'Quantity must be positive';
        END IF;
        
        -- Lock the book row
        SELECT * INTO v_book_record 
        FROM public.books 
        WHERE id = v_book_id AND is_active = true
        FOR UPDATE;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Book % not found or inactive', v_book_id;
        END IF;
        
        IF v_book_record.stock < v_quantity THEN
            RAISE EXCEPTION 'Insufficient stock for %', v_book_record.title;
        END IF;
        
        -- Deduct stock
        UPDATE public.books 
        SET stock = stock - v_quantity 
        WHERE id = v_book_id;
        
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
            v_book_id,
            'ORDER_SALE',
            -v_quantity,
            v_book_record.stock,
            v_book_record.stock - v_quantity,
            'Customer order ' || v_order_number,
            'ORDER',
            v_order_id::TEXT,
            v_customer_id
        );
        
        -- Calculate line total
        v_line_total := v_book_record.price * v_quantity;
        v_subtotal := v_subtotal + v_line_total;
        
        -- Insert order item
        INSERT INTO public.order_items (
            order_id,
            book_id,
            book_title_snapshot,
            unit_price,
            quantity,
            line_total
        ) VALUES (
            v_order_id,
            v_book_id,
            v_book_record.title,
            v_book_record.price,
            v_quantity,
            v_line_total
        );
        
        v_item_count := v_item_count + 1;
    END LOOP;
    
    IF v_item_count = 0 THEN
        RAISE EXCEPTION 'Order must contain at least one item';
    END IF;

    -- Enforce discount rule
    IF v_loyalty_discount > v_subtotal THEN
        RAISE EXCEPTION 'Loyalty discount (LKR %) cannot exceed order subtotal (LKR %)', v_loyalty_discount, v_subtotal;
    END IF;

    v_total_amount := v_subtotal - v_loyalty_discount;
    
    -- Update order totals
    UPDATE public.orders 
    SET subtotal = v_subtotal, total_amount = v_total_amount
    WHERE id = v_order_id;

    -- Process Loyalty Deduction
    IF p_loyalty_points_to_redeem > 0 THEN
        UPDATE public.loyalty_accounts
        SET points_balance = points_balance - p_loyalty_points_to_redeem,
            lifetime_points_redeemed = lifetime_points_redeemed + p_loyalty_points_to_redeem
        WHERE customer_id = v_customer_id;

        INSERT INTO public.loyalty_transactions (customer_id, transaction_type, points, order_id, description)
        VALUES (v_customer_id, 'REDEEM', -p_loyalty_points_to_redeem, v_order_id, 'Redeemed for order ' || v_order_number);
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number
    );
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '%', SQLERRM;
END;
$$;


-- 6. RPC: update_order_status (Overwritten for Loyalty Earning)
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
    
    v_loyalty_settings RECORD;
    v_points_to_earn INTEGER := 0;
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

        -- LOYALTY EARNING LOGIC
        SELECT * INTO v_loyalty_settings FROM public.loyalty_settings WHERE id = 1;
        
        IF v_loyalty_settings.is_active AND v_order.total_amount > 0 THEN
            v_points_to_earn := FLOOR(v_order.total_amount / v_loyalty_settings.earn_amount_per_point);
            
            IF v_points_to_earn > 0 THEN
                -- Ensure loyalty account exists
                INSERT INTO public.loyalty_accounts (customer_id, points_balance)
                VALUES (v_order.customer_id, 0)
                ON CONFLICT (customer_id) DO NOTHING;

                -- Lock account
                PERFORM 1 FROM public.loyalty_accounts WHERE customer_id = v_order.customer_id FOR UPDATE;

                -- Update points
                UPDATE public.loyalty_accounts
                SET points_balance = points_balance + v_points_to_earn,
                    lifetime_points_earned = lifetime_points_earned + v_points_to_earn
                WHERE customer_id = v_order.customer_id;

                -- Insert EARN transaction (Protected by unique index to avoid duplicates)
                INSERT INTO public.loyalty_transactions (customer_id, transaction_type, points, order_id, description)
                VALUES (v_order.customer_id, 'EARN', v_points_to_earn, v_order.id, 'Points earned for order ' || v_order.order_number);
                
                -- Track on order
                UPDATE public.orders SET loyalty_points_earned = v_points_to_earn WHERE id = p_order_id;
            END IF;
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


-- 7. RPC: cancel_customer_order (Overwritten for Loyalty Restore)
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

    -- 4. RESTORE LOYALTY POINTS (If any were used)
    IF v_order.loyalty_points_redeemed > 0 THEN
        -- Lock account
        PERFORM 1 FROM public.loyalty_accounts WHERE customer_id = v_order.customer_id FOR UPDATE;

        -- Restore points
        UPDATE public.loyalty_accounts
        SET points_balance = points_balance + v_order.loyalty_points_redeemed
        WHERE customer_id = v_order.customer_id;

        -- Log transaction (Protected by unique index to avoid duplicates)
        INSERT INTO public.loyalty_transactions (customer_id, transaction_type, points, order_id, description)
        VALUES (v_order.customer_id, 'REDEEM_RESTORE', v_order.loyalty_points_redeemed, v_order.id, 'Points restored for cancelled order ' || v_order.order_number);
    END IF;

    -- 5. Update order status
    UPDATE public.orders 
    SET status = 'CANCELLED' 
    WHERE id = p_order_id;

    -- 6. Record history
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
