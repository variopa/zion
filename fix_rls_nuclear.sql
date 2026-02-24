-- ==========================================
-- NUCLEAR RLS RESET
-- This script COMPLETELY resets all RLS policies and recreates them from scratch.
-- Run this ENTIRE script in the Supabase SQL Editor.
-- ==========================================

-- STEP 0: Diagnostics - See what policies currently exist
-- (This will show you the current state before the fix)
SELECT schemaname, tablename, policyname FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ==========================================
-- STEP 1: NUCLEAR DROP - Remove EVERY policy from every table
-- ==========================================

-- Drop ALL profiles policies (both old and new names)
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    END LOOP;
END $$;

-- Drop ALL ad_campaigns policies
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ad_campaigns'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.ad_campaigns', pol.policyname);
    END LOOP;
END $$;

-- Drop ALL ad_creatives policies
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ad_creatives'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.ad_creatives', pol.policyname);
    END LOOP;
END $$;

-- Drop ALL site_traffic_logs policies
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'site_traffic_logs'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.site_traffic_logs', pol.policyname);
    END LOOP;
END $$;

-- Drop ALL active_presence policies
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'active_presence'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.active_presence', pol.policyname);
    END LOOP;
END $$;

-- Drop ALL audit_logs policies
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'audit_logs'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.audit_logs', pol.policyname);
    END LOOP;
END $$;

-- ==========================================
-- STEP 2: Ensure the helper function exists
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- ==========================================
-- STEP 3: CREATE ALL POLICIES FROM SCRATCH
-- ==========================================

-- ========== PROFILES ==========
CREATE POLICY "profiles_select_own" ON public.profiles 
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_select_admin" ON public.profiles 
  FOR SELECT USING (public.get_my_role() IN ('superadmin', 'admin'));

CREATE POLICY "profiles_update_admin" ON public.profiles 
  FOR UPDATE USING (public.get_my_role() IN ('superadmin', 'admin'));

CREATE POLICY "profiles_insert_own" ON public.profiles 
  FOR INSERT WITH CHECK (id = auth.uid());

-- ========== AD CAMPAIGNS ==========
CREATE POLICY "campaigns_select_public" ON public.ad_campaigns
  FOR SELECT USING (status = 'active');

CREATE POLICY "campaigns_all_admin" ON public.ad_campaigns
  FOR ALL USING (public.get_my_role() IN ('superadmin', 'admin'));

-- ========== AD CREATIVES ==========
CREATE POLICY "creatives_select_public" ON public.ad_creatives
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.ad_campaigns WHERE id = ad_creatives.campaign_id AND status = 'active')
  );

CREATE POLICY "creatives_all_admin" ON public.ad_creatives
  FOR ALL USING (public.get_my_role() IN ('superadmin', 'admin'));

CREATE POLICY "creatives_update_public" ON public.ad_creatives
  FOR UPDATE USING (true) WITH CHECK (true);

-- ========== SITE TRAFFIC LOGS ==========
CREATE POLICY "traffic_insert_public" ON public.site_traffic_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "traffic_select_admin" ON public.site_traffic_logs
  FOR SELECT USING (public.get_my_role() IN ('superadmin', 'admin'));

-- ========== ACTIVE PRESENCE ==========
CREATE POLICY "presence_all_public" ON public.active_presence
  FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- STEP 4: Ensure superadmin role
-- ==========================================
UPDATE public.profiles SET role = 'superadmin' WHERE LOWER(email) = LOWER('Mek@zion.pro');

-- Also try via auth.users join
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'superadmin' 
FROM auth.users 
WHERE LOWER(email) = LOWER('Mek@zion.pro')
ON CONFLICT (id) DO UPDATE SET role = 'superadmin';

-- ==========================================
-- STEP 5: VERIFY EVERYTHING
-- ==========================================

-- Check policies now exist
SELECT schemaname, tablename, policyname, cmd FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check profile
SELECT id, email, role FROM public.profiles;

-- Check function works
SELECT public.get_my_role();
