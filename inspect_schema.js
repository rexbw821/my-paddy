require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    console.log('🔍 Inspecting Tables...\n');

    // Try to query evidence table
    const { data: evidenceData, error: evidenceError } = await supabase
        .from('evidence')
        .select('*')
        .limit(1);

    if (evidenceError) {
        console.log('❌ Evidence Table Error:', evidenceError.message);
    } else {
        console.log('✅ Evidence Table exists.');
    }

    // Try to query profiles table
    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

    if (profileError) {
        console.log('❌ Profiles Table Error:', profileError.message);
    } else {
        console.log('✅ Profiles Table exists.');
    }
}

inspectSchema();
