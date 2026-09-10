-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES auth.users(id),
    order_number TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED')),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('PAY_AT_SHOP', 'MOCK_CARD')),
    payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID_DEMO')),
    subtotal NUMERIC NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    total_amount NUMERIC NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

-- Create order_items table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    book_id BIGINT NOT NULL REFERENCES public.books(id),
    book_title_snapshot TEXT NOT NULL,
    unit_price NUMERIC NOT NULL CHECK (unit_price >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    line_total NUMERIC NOT NULL CHECK (line_total >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_book_id ON public.order_items(book_id);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Customer Policies for orders
CREATE POLICY "Customers can view own orders"
ON public.orders FOR SELECT
TO authenticated
USING (auth.uid() = customer_id);

-- Staff/Admin Policies for orders
CREATE POLICY "Staff can view all orders"
ON public.orders FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.staff_profiles
        WHERE id = auth.uid() AND is_active = true
    )
);

-- Customer Policies for order_items
CREATE POLICY "Customers can view own order items"
ON public.order_items FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.orders
        WHERE id = order_items.order_id AND customer_id = auth.uid()
    )
);

-- Staff/Admin Policies for order_items
CREATE POLICY "Staff can view all order items"
ON public.order_items FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.staff_profiles
        WHERE id = auth.uid() AND is_active = true
    )
);

-- Trigger for orders updated_at
CREATE OR REPLACE FUNCTION update_orders_mod_time()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_mod_time
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION update_orders_mod_time();

-- Secure RPC for placing customer order
CREATE OR REPLACE FUNCTION place_customer_order(
    p_payment_method TEXT,
    p_notes TEXT,
    p_items JSONB
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
    v_payment_status TEXT;
    
    v_item RECORD;
    v_book_record RECORD;
    v_quantity INTEGER;
    v_book_id BIGINT;
    v_line_total NUMERIC;
    v_item_count INTEGER := 0;
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
    
    -- Create the order record first to get ID, we will update totals later
    v_order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    INSERT INTO public.orders (
        customer_id, 
        order_number, 
        payment_method, 
        payment_status, 
        notes, 
        subtotal, 
        total_amount
    ) VALUES (
        v_customer_id, 
        v_order_number, 
        p_payment_method, 
        v_payment_status, 
        p_notes, 
        0, 
        0
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
    
    -- Update order totals
    UPDATE public.orders 
    SET subtotal = v_subtotal, total_amount = v_subtotal
    WHERE id = v_order_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number
    );
EXCEPTION
    WHEN OTHERS THEN
        -- Re-raise exception with error message
        RAISE EXCEPTION '%', SQLERRM;
END;
$$;
