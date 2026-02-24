import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

console.log("[Supabase Config] URL being used:", supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        storageKey: 'zion_auth_token',
        // Disable cross-tab lock management to prevent the "Navigator LockManager timeout" crash
        // common in Vite HMR and multi-tab development
        storage: window.localStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        lock: null // Fixes the 10000ms timeout error
    }
});
