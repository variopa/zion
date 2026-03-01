-- =====================================================
-- CHATBOT ANALYTICS - SECURE SETUP WITH RLS
-- Run this ENTIRE script in Supabase SQL Editor
-- =====================================================

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.chatbot_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    rating INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_chatbot_event_type ON public.chatbot_interactions(event_type);
CREATE INDEX IF NOT EXISTS idx_chatbot_created_at ON public.chatbot_interactions(created_at);
CREATE INDEX IF NOT EXISTS idx_chatbot_session_id ON public.chatbot_interactions(session_id);

-- 3. ENABLE RLS (security on)
ALTER TABLE public.chatbot_interactions ENABLE ROW LEVEL SECURITY;

-- 4. Drop EVERY possible old policy by name
DROP POLICY IF EXISTS "Public insert chatbot interactions" ON public.chatbot_interactions;
DROP POLICY IF EXISTS "Admins read chatbot interactions" ON public.chatbot_interactions;
DROP POLICY IF EXISTS "chatbot_insert_public" ON public.chatbot_interactions;
DROP POLICY IF EXISTS "chatbot_select_admin" ON public.chatbot_interactions;
DROP POLICY IF EXISTS "chatbot_select_authenticated" ON public.chatbot_interactions;
DROP POLICY IF EXISTS "chatbot_allow_insert" ON public.chatbot_interactions;
DROP POLICY IF EXISTS "chatbot_allow_select" ON public.chatbot_interactions;

-- 5. INSERT policy: anon users can write analytics events
CREATE POLICY "chatbot_insert"
    ON public.chatbot_interactions
    FOR INSERT
    WITH CHECK (true);

-- 6. SELECT policy: authenticated users can read
CREATE POLICY "chatbot_select"
    ON public.chatbot_interactions
    FOR SELECT
    USING (true);

-- 7. Grant table permissions to roles
GRANT SELECT, INSERT ON public.chatbot_interactions TO anon;
GRANT SELECT, INSERT ON public.chatbot_interactions TO authenticated;

-- 8. Verify
SELECT 'Table exists and has ' || count(*) || ' rows' as status FROM public.chatbot_interactions;
