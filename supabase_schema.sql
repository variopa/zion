-- ==========================================
-- ENTERPRISE SCHEMA v2: Relational & High-Scale
-- Author: Antigravity
-- ==========================================

-- Clean slate (CAUTION: Resets all system tables)
-- DROP TABLE IF EXISTS public.site_traffic_logs CASCADE;
-- DROP TABLE IF EXISTS public.active_presence CASCADE;
-- DROP TABLE IF EXISTS public.ad_creatives CASCADE;
-- DROP TABLE IF EXISTS public.ad_campaigns CASCADE;
-- DROP TABLE IF EXISTS public.audit_logs CASCADE;
-- DROP TABLE IF EXISTS public.profiles CASCADE;

-- 1. IDENTITY & ACCESS (EXTENDING SUPABASE AUTH)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'moderator' CHECK (role IN ('superadmin', 'admin', 'moderator')),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Audit Logging for sensitive admin actions
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES public.profiles(id),
    action_type TEXT NOT NULL, -- e.g. "AD_CREATED", "CAMPAIGN_DELETED"
    entity_id TEXT,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. ADVERTISING ENGINE (RELATIONAL)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.ad_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'expired')),
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    budget NUMERIC(10,2),
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ad_creatives (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    desktop_image_url TEXT NOT NULL,
    mobile_image_url TEXT NOT NULL,
    destination_url TEXT NOT NULL,
    click_count INTEGER DEFAULT 0,
    impression_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TELEMETRY & PRESENCE (PERFORMANCE OPTIMIZED)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.site_traffic_logs (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT NOT NULL,
    path TEXT NOT NULL,
    movie_title TEXT,
    device_type TEXT,
    region_info JSONB, -- Stores {country: "ET", city: "Addis Ababa", etc}
    duration_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Performance Index for massive analytics queries
CREATE INDEX IF NOT EXISTS idx_traffic_path ON public.site_traffic_logs(path);
CREATE INDEX IF NOT EXISTS idx_traffic_created_at ON public.site_traffic_logs(created_at);
-- Strict Unique Device Tracking Index (1 event per device/path per day)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_daily_traffic 
ON public.site_traffic_logs (session_id, path, (cast(created_at AT TIME ZONE 'UTC' as DATE)));

CREATE TABLE IF NOT EXISTS public.active_presence (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT UNIQUE NOT NULL,
    current_path TEXT,
    movie_title TEXT,
    device_type TEXT,
    region_info JSONB,
    last_heartbeat TIMESTAMPTZ DEFAULT now()
);

-- 4. SECURITY POLICIES (RLS)
-- ==========================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_traffic_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_presence ENABLE ROW LEVEL SECURITY;

-- CRITICAL: SECURITY DEFINER helper to check role without triggering RLS
-- This prevents "infinite recursion detected in policy for relation profiles"
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- Profiles: Users see own, Admins see all
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Admins can read all profiles" ON public.profiles FOR SELECT USING (public.get_my_role() IN ('superadmin', 'admin'));
CREATE POLICY "Admins can update profiles" ON public.profiles FOR UPDATE USING (public.get_my_role() IN ('superadmin', 'admin'));
CREATE POLICY "Allow profile creation" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());

-- Ads: Public view active, Admins manage all
CREATE POLICY "Public can view active campaigns" ON public.ad_campaigns FOR SELECT USING (status = 'active');
CREATE POLICY "Admins manage campaigns" ON public.ad_campaigns FOR ALL USING (public.get_my_role() IN ('superadmin', 'admin'));

CREATE POLICY "Public can view active creatives" ON public.ad_creatives FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.ad_campaigns WHERE id = ad_creatives.campaign_id AND status = 'active')
);
CREATE POLICY "Admins manage creatives" ON public.ad_creatives FOR ALL USING (public.get_my_role() IN ('superadmin', 'admin'));
CREATE POLICY "Public increment click count" ON public.ad_creatives FOR UPDATE USING (true) WITH CHECK (true);

-- Telemetry: Public Insert, Admin Read
CREATE POLICY "Public insert traffic" ON public.site_traffic_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public manage presence" ON public.active_presence FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admins read telemetry" ON public.site_traffic_logs FOR SELECT USING (public.get_my_role() IN ('superadmin', 'admin'));

-- ==========================================
-- HELPER FUNCTIONS
-- ==========================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER tr_campaigns_updated BEFORE UPDATE ON public.ad_campaigns FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Create initial Admin trigger
-- Automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', COALESCE(new.raw_user_meta_data->>'role', 'admin'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- MANUAL SUPERADMIN PROMOTION
-- RUN THIS IN SUPABASE SQL EDITOR TO FIX ACCESS
-- ==========================================

/*
-- 1. Ensure the profile exists and has superadmin role
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'superadmin' 
FROM auth.users 
WHERE email = 'Mek@zion.pro'
ON CONFLICT (id) DO UPDATE SET role = 'superadmin';

-- 2. Verify
SELECT * FROM public.profiles WHERE email = 'Mek@zion.pro';
*/
