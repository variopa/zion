-- ==========================================
-- ADMIN DELETION FIX
-- This script adds a secure function to delete users from auth.users
-- and enables the DELETE policy for profiles.
-- ==========================================

-- 1. Create a function to delete a user from auth.users
-- This must be SECURITY DEFINER to bypass RLS on auth.users
CREATE OR REPLACE FUNCTION public.delete_user_by_id(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Verify the caller is a superadmin or admin
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('superadmin', 'admin')
  ) THEN
    -- Delete from auth.users (cascades to public.profiles)
    DELETE FROM auth.users WHERE id = target_user_id;
  ELSE
    RAISE EXCEPTION 'Access denied: Only administrators can delete users.';
  END IF;
END;
$$;

-- 2. Add explicit DELETE policy to public.profiles for completeness
-- Note: The auth.users deletion above should cascade to profiles,
-- but having this policy allows direct profile deletion by admins if needed.
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Admins can delete profiles'
    ) THEN
        CREATE POLICY "Admins can delete profiles" ON public.profiles 
        FOR DELETE USING (public.get_my_role() IN ('superadmin', 'admin'));
    END IF;
END $$;
