-- Fix RLS policies on authors, books, and categories tables
-- to allow 'admin' and 'inventory_manager' instead of 'staff' and 'admin'

-- TABLE: authors
DROP POLICY IF EXISTS "Staff can insert authors" ON public.authors;
CREATE POLICY "Staff can insert authors" ON public.authors
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT staff_profiles.id
    FROM staff_profiles
    WHERE staff_profiles.is_active = true
      AND staff_profiles.role IN ('admin', 'inventory_manager')
  )
);

DROP POLICY IF EXISTS "Staff can update authors" ON public.authors;
CREATE POLICY "Staff can update authors" ON public.authors
FOR UPDATE TO authenticated
USING (
  auth.uid() IN (
    SELECT staff_profiles.id
    FROM staff_profiles
    WHERE staff_profiles.is_active = true
      AND staff_profiles.role IN ('admin', 'inventory_manager')
  )
);

DROP POLICY IF EXISTS "Staff can view all authors" ON public.authors;
CREATE POLICY "Staff can view all authors" ON public.authors
FOR SELECT TO authenticated
USING (
  auth.uid() IN (
    SELECT staff_profiles.id
    FROM staff_profiles
    WHERE staff_profiles.is_active = true
      AND staff_profiles.role IN ('admin', 'inventory_manager')
  )
);

-- TABLE: books
DROP POLICY IF EXISTS "Staff can insert books" ON public.books;
CREATE POLICY "Staff can insert books" ON public.books
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT staff_profiles.id
    FROM staff_profiles
    WHERE staff_profiles.is_active = true
      AND staff_profiles.role IN ('admin', 'inventory_manager')
  )
);

DROP POLICY IF EXISTS "Staff can update books" ON public.books;
CREATE POLICY "Staff can update books" ON public.books
FOR UPDATE TO authenticated
USING (
  auth.uid() IN (
    SELECT staff_profiles.id
    FROM staff_profiles
    WHERE staff_profiles.is_active = true
      AND staff_profiles.role IN ('admin', 'inventory_manager')
  )
);

DROP POLICY IF EXISTS "Staff can view all books" ON public.books;
CREATE POLICY "Staff can view all books" ON public.books
FOR SELECT TO authenticated
USING (
  auth.uid() IN (
    SELECT staff_profiles.id
    FROM staff_profiles
    WHERE staff_profiles.is_active = true
      AND staff_profiles.role IN ('admin', 'inventory_manager')
  )
);

-- TABLE: categories
DROP POLICY IF EXISTS "Staff can insert categories" ON public.categories;
CREATE POLICY "Staff can insert categories" ON public.categories
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT staff_profiles.id
    FROM staff_profiles
    WHERE staff_profiles.is_active = true
      AND staff_profiles.role IN ('admin', 'inventory_manager')
  )
);

DROP POLICY IF EXISTS "Staff can update categories" ON public.categories;
CREATE POLICY "Staff can update categories" ON public.categories
FOR UPDATE TO authenticated
USING (
  auth.uid() IN (
    SELECT staff_profiles.id
    FROM staff_profiles
    WHERE staff_profiles.is_active = true
      AND staff_profiles.role IN ('admin', 'inventory_manager')
  )
);

DROP POLICY IF EXISTS "Staff can view all categories" ON public.categories;
CREATE POLICY "Staff can view all categories" ON public.categories
FOR SELECT TO authenticated
USING (
  auth.uid() IN (
    SELECT staff_profiles.id
    FROM staff_profiles
    WHERE staff_profiles.is_active = true
      AND staff_profiles.role IN ('admin', 'inventory_manager')
  )
);
