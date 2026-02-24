-- ==========================================
-- BULLETPROOF SUPERADMIN FIX
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Check what profiles exist right now
SELECT id, email, role FROM public.profiles;

-- 2. Force update role to superadmin for ALL possible email variations
-- (Supabase sometimes stores emails in lowercase)
UPDATE public.profiles 
SET role = 'superadmin' 
WHERE LOWER(email) = LOWER('Mek@zion.pro');

-- 3. If the profile doesn't exist at all, create it from auth.users
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'superadmin' 
FROM auth.users 
WHERE LOWER(email) = LOWER('Mek@zion.pro')
ON CONFLICT (id) DO UPDATE SET role = 'superadmin';

-- 4. Verify the fix worked
SELECT id, email, role FROM public.profiles WHERE LOWER(email) = LOWER('Mek@zion.pro');

-- 5. Verify the get_my_role() function exists and works
-- (You must be logged in as Mek@zion.pro for this to return 'superadmin')
SELECT public.get_my_role();
