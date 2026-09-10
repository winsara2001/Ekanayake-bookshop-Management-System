CREATE OR REPLACE FUNCTION public.adjust_book_stock(
    p_book_id bigint,
    p_adjustment_type text,
    p_quantity integer,
    p_reason text,
    p_reference_type text DEFAULT NULL,
    p_reference_id text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id uuid;
    v_role text;
    v_is_active boolean;
    v_current_stock integer;
    v_new_stock integer;
    v_quantity_change integer;
BEGIN
    -- 1. Get current user
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 3 & 4 & 6. Validate role from staff_profiles
    SELECT role, is_active INTO v_role, v_is_active
    FROM staff_profiles
    WHERE id = v_user_id;

    IF NOT FOUND OR NOT v_is_active OR v_role NOT IN ('admin', 'inventory_manager') THEN
        RAISE EXCEPTION 'Unauthorized: Only active admin and inventory manager can adjust stock';
    END IF;

    -- 2. Validate quantity
    IF p_quantity <= 0 THEN
        RAISE EXCEPTION 'Quantity must be positive';
    END IF;

    -- 3. Validate reason
    IF trim(p_reason) = '' THEN
        RAISE EXCEPTION 'Reason is required';
    END IF;

    -- 4. Validate adjustment type
    IF p_adjustment_type NOT IN ('INITIAL_STOCK', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT') THEN
        RAISE EXCEPTION 'Invalid adjustment type';
    END IF;

    -- 5 & 6. Lock book row and read stock
    SELECT stock INTO v_current_stock
    FROM books
    WHERE id = p_book_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Book not found';
    END IF;

    -- 10. INITIAL_STOCK rule
    IF p_adjustment_type = 'INITIAL_STOCK' AND v_current_stock > 0 THEN
        RAISE EXCEPTION 'INITIAL_STOCK can only be used when current stock is 0. Use ADJUSTMENT_IN instead.';
    END IF;

    -- 7 & 8. Calculate change and new stock
    IF p_adjustment_type = 'ADJUSTMENT_OUT' THEN
        v_quantity_change := -p_quantity;
    ELSE
        v_quantity_change := p_quantity;
    END IF;

    v_new_stock := v_current_stock + v_quantity_change;

    -- 9. Reject negative stock
    IF v_new_stock < 0 THEN
        RAISE EXCEPTION 'Insufficient stock. This adjustment would make stock negative.';
    END IF;

    -- 11. Update books
    UPDATE books
    SET stock = v_new_stock
    WHERE id = p_book_id;

    -- 12. Insert transaction
    INSERT INTO inventory_transactions (
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
        p_book_id,
        p_adjustment_type,
        v_quantity_change,
        v_current_stock,
        v_new_stock,
        trim(p_reason),
        p_reference_type,
        p_reference_id,
        v_user_id
    );
END;
$$;
