-- ==========================================
-- FINAL FIX: Table-Level GRANT Permissions
-- 
-- ERROR: "permission denied for table profiles" (42501)
-- This is NOT an RLS issue — it's a GRANT issue.
-- The 'authenticated' and 'anon' Postgres roles need
-- explicit permission to access the tables.
--
-- Run this ENTIRE script in Supabase SQL Editor.
-- ==========================================

-- ========== PROFILES ==========
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- ========== AD CAMPAIGNS ==========
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ad_campaigns TO authenticated;
GRANT SELECT ON public.ad_campaigns TO anon;

-- ========== AD CREATIVES ==========
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ad_creatives TO authenticated;
GRANT SELECT, UPDATE ON public.ad_creatives TO anon;

-- ========== SITE TRAFFIC LOGS ==========
GRANT SELECT, INSERT ON public.site_traffic_logs TO authenticated;
GRANT INSERT ON public.site_traffic_logs TO anon;

-- ========== ACTIVE PRESENCE ==========
GRANT SELECT, INSERT, UPDATE, DELETE ON public.active_presence TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.active_presence TO anon;

-- ========== AUDIT LOGS ==========
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;

-- ========== SEQUENCES (needed for BIGSERIAL columns) ==========
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- ========== VERIFY ==========
-- After running, this should return rows without 403:
SELECT id, email, role FROM public.profiles LIMIT 5;
SELECT public.get_my_role();
