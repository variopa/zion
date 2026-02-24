import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env file.");
    process.exit(1);
}

console.log('--- Supabase Diagnostic ---');
console.log('URL:', supabaseUrl);
console.log('Key length:', supabaseKey?.length);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log('Testing public data access...');

    // Attempt to select from 'ads' table (public)
    const { data, error } = await supabase.from('ads').select('id').limit(1);

    if (error) {
        if (error.message.includes('credential') || error.message.includes('API key')) {
            console.error('❌ Connection Failed: Your Anon Key (VITE_SUPABASE_ANON_KEY) is likely incorrect.');
        } else {
            console.error('❌ Error fetching data:', error.message);
        }
    } else {
        console.log('✅ Success! The Supabase URL and Anon Key are valid and working.');
        console.log('Since navigation and data fetching work, the 400 error on login means:');
        console.log('1. The email/password you typed is incorrect.');
        console.log('2. The user does not exist in your Supabase project (Authentication > Users).');
        console.log('3. Email confirmation is required but the email hasn\'t been confirmed.');
    }
}

testConnection();
