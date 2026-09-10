-- 1. Create the customer_profiles table
CREATE TABLE IF NOT EXISTS public.customer_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Policy: Customers can only select their own profile
CREATE POLICY "Users can view their own profile" 
ON public.customer_profiles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- Policy: Customers can only insert their own profile
CREATE POLICY "Users can insert their own profile" 
ON public.customer_profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- Policy: Customers can only update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.customer_profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- 4. Create trigger to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customer_profiles_updated_at
BEFORE UPDATE ON public.customer_profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 5. Create trigger to automatically insert profile on auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.customer_profiles (id, first_name, last_name, phone)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name',
        NEW.raw_user_meta_data->>'phone'
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger firing when a new row is inserted into auth.users
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Backfill existing authenticated users (Safe One-Time Run)
INSERT INTO public.customer_profiles (id, first_name, last_name, phone)
SELECT 
    id,
    raw_user_meta_data->>'first_name',
    raw_user_meta_data->>'last_name',
    raw_user_meta_data->>'phone'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.customer_profiles)
ON CONFLICT (id) DO NOTHING;
