-- ==========================================
-- SYSTEM MAINTENANCE: DATABASE PURGE ENGINE
-- Author: ZION OS / Antigravity
-- Description: Cleans up analytics and temporary data older than 30 days
-- ==========================================

-- Create the maintenance function
CREATE OR REPLACE FUNCTION public.purge_old_analytics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges
SET search_path = public
AS $$
DECLARE
    deleted_traffic INTEGER;
    deleted_chatbot INTEGER;
    deleted_presence INTEGER;
    result JSONB;
BEGIN
    -- 1. Purge Site Traffic Logs (Older than 30 days)
    DELETE FROM public.site_traffic_logs
    WHERE created_at < NOW() - INTERVAL '30 days';
    GET DIAGNOSTICS deleted_traffic = ROW_COUNT;

    -- 2. Purge Chatbot Interactions (Older than 30 days)
    DELETE FROM public.chatbot_interactions
    WHERE created_at < NOW() - INTERVAL '30 days';
    GET DIAGNOSTICS deleted_chatbot = ROW_COUNT;

    -- 3. Purge Dead Presence (Older than 24 hours - presence is transient)
    DELETE FROM public.active_presence
    WHERE last_heartbeat < NOW() - INTERVAL '24 hours';
    GET DIAGNOSTICS deleted_presence = ROW_COUNT;

    -- Construct result
    result = jsonb_build_object(
        'status', 'success',
        'timestamp', NOW(),
        'purged_traffic', deleted_traffic,
        'purged_chatbot', deleted_chatbot,
        'purged_presence', deleted_presence,
        'message', 'Database cleaned successfully'
    );

    RETURN result;
END;
$$;

-- Grant execution to authenticated users (Roles will be checked in the app)
GRANT EXECUTE ON FUNCTION public.purge_old_analytics() TO authenticated;

-- Comment for documentation
COMMENT ON FUNCTION public.purge_old_analytics() IS 'Daily maintenance task to keep the database lean by deleting analytics older than 30 days.';
