-- ==========================================
-- RLS FIX: Resolves "infinite recursion detected in policy for relation profiles"
-- 
-- ROOT CAUSE: The profiles RLS policy checked profiles itself to verify admin role,
-- causing Postgres to recurse infinitely.
--
-- FIX: Use a SECURITY DEFINER function that bypasses RLS to check the user's role.
-- 
-- HOW TO USE: Run this ENTIRE script in the Supabase SQL Editor.
-- ==========================================

-- STEP 1: Create the SECURITY DEFINER helper function
-- This function runs with elevated privileges (bypasses RLS) to safely check the user's role.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- STEP 2: Drop all existing broken policies
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public can view active campaigns" ON public.ad_campaigns;
DROP POLICY IF EXISTS "Admins manage campaigns" ON public.ad_campaigns;
DROP POLICY IF EXISTS "Public can view active ads" ON public.ad_creatives;
DROP POLICY IF EXISTS "Admins manage creatives" ON public.ad_creatives;
DROP POLICY IF EXISTS "Public increment click count" ON public.ad_creatives;
DROP POLICY IF EXISTS "Public insert traffic" ON public.site_traffic_logs;
DROP POLICY IF EXISTS "Admins read telemetry" ON public.site_traffic_logs;
DROP POLICY IF EXISTS "Public manage presence" ON public.active_presence;

-- STEP 3: Recreate ALL policies using the safe helper function

-- ========== PROFILES ==========
-- Users can always read their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (id = auth.uid());

-- Admins/Superadmins can read ALL profiles
CREATE POLICY "Admins can read all profiles"
ON public.profiles FOR SELECT
USING (public.get_my_role() IN ('superadmin', 'admin'));

-- Admins/Superadmins can update profiles (e.g. change roles)
CREATE POLICY "Admins can update profiles"
ON public.profiles FOR UPDATE
USING (public.get_my_role() IN ('superadmin', 'admin'));

-- Allow insert for the trigger (handle_new_user runs as SECURITY DEFINER anyway)
CREATE POLICY "Allow profile creation"
ON public.profiles FOR INSERT
WITH CHECK (id = auth.uid());

-- ========== AD CAMPAIGNS ==========
-- Public can view active campaigns (for AdBanner on frontend)
CREATE POLICY "Public can view active campaigns"
ON public.ad_campaigns FOR SELECT
USING (status = 'active');

-- Admins can do everything with campaigns
CREATE POLICY "Admins manage campaigns"
ON public.ad_campaigns FOR ALL
USING (public.get_my_role() IN ('superadmin', 'admin'));

-- ========== AD CREATIVES ==========
-- Public can view creatives of active campaigns
CREATE POLICY "Public can view active creatives"
ON public.ad_creatives FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ad_campaigns
    WHERE id = ad_creatives.campaign_id AND status = 'active'
  )
);

-- Admins can do everything with creatives
CREATE POLICY "Admins manage creatives"
ON public.ad_creatives FOR ALL
USING (public.get_my_role() IN ('superadmin', 'admin'));

-- Public can increment click count (for ad click tracking)
CREATE POLICY "Public increment click count"
ON public.ad_creatives FOR UPDATE
USING (true)
WITH CHECK (true);

-- ========== SITE TRAFFIC LOGS ==========
-- Anyone can insert traffic data (anonymous analytics)
CREATE POLICY "Public insert traffic"
ON public.site_traffic_logs FOR INSERT
WITH CHECK (true);

-- Admins can read telemetry data
CREATE POLICY "Admins read telemetry"
ON public.site_traffic_logs FOR SELECT
USING (public.get_my_role() IN ('superadmin', 'admin'));

-- ========== ACTIVE PRESENCE ==========
-- Anyone can manage presence (anonymous heartbeat)
CREATE POLICY "Public manage presence"
ON public.active_presence FOR ALL
USING (true)
WITH CHECK (true);

-- ==========================================
-- STEP 4: Verify the fix
-- Run this query - it should return your profile without errors:
-- SELECT * FROM public.profiles WHERE id = auth.uid();
-- SELECT public.get_my_role();
-- ==========================================
