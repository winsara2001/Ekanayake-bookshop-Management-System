-- Drop the obsolete 3-argument version of place_customer_order
DROP FUNCTION IF EXISTS public.place_customer_order(text, text, jsonb);
