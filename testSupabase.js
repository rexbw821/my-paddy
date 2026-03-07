require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Fallback for environment variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase credentials missing in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔗 Testing Supabase connection...\n');

  try {
    // Test: Check connection by attempting a simple query on the reports table
    const { data, error } = await supabase
      .from('reports')
      .select('count', { count: 'exact' })
      .limit(1);

    if (error) {
      console.log('❌ Error:', error.message);
      console.log('Note: Ensure the "reports" table exists in your Supabase dashboard');
      return;
    }

    console.log('✅ Supabase connection successful!');
    console.log(`📊 Reports found in database: ${data?.length || 0}`);

    // Try to fetch a sample report
    const { data: sampleData, error: fetchError } = await supabase
      .from('reports')
      .select('*')
      .limit(3);

    if (fetchError) {
      console.log('❌ Fetch error:', fetchError.message);
    } else {
      console.log('\n📋 Sample data (first 3 records):');
      console.log(JSON.stringify(sampleData, null, 2));
    }
  } catch (err) {
    console.log('❌ Connection failed:', err.message);
  }
}

testConnection();

