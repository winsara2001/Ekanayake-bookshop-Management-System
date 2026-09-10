# Ekanayake Book Shop - Account Model

This document outlines the intended account model for the Ekanayake Book Shop Management System.

## Normal Customer
- Exists in `auth.users` (Supabase Authentication)
- Exists in `public.customer_profiles`
- Does NOT exist in `public.staff_profiles`

## Staff
- Exists in `auth.users` (Supabase Authentication)
- Exists in `public.staff_profiles` with `role = 'staff'`
- Does NOT exist in `public.customer_profiles`

## Admin / Owner
- Exists in `auth.users` (Supabase Authentication)
- Exists in `public.staff_profiles` with `role = 'admin'`
- Does NOT exist in `public.customer_profiles`

---

# Future Customer -> Staff Promotion

When an Admin assigns an existing Customer as Staff, the system should perform the following:

1. **Preserve the existing `auth.users` account.** (Never delete the Auth account).
2. **Read safe profile details** from `public.customer_profiles`.
3. **Create a matching `staff_profiles` row** using the SAME user UUID.
4. **Set `role = 'staff'`** and `is_active = true`.
5. **Safely remove that user's `customer_profiles` row**, but ONLY after successful staff profile creation.

*Note: This promotion should ideally be implemented as one secure server-side operation (e.g. via a Supabase Edge Function or secure RPC) so that frontend clients do not need elevated privileges.*
