// verifyReport.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const readline = require('readline');

// Load environment variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('\x1b[31mError: Supabase credentials missing in .env\x1b[0m');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Normalize input: lowercase, trim, alphanumeric only
 */
function normalize(text) {
  if (!text) return '';
  return text.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

/**
 * Risk Level Logic:
 * 0 = LOW (Green)
 * 1-2 = MEDIUM (Yellow)
 * >=3 = HIGH (Red)
 */
function getRiskInfo(count) {
  if (count === 0) return { level: 'LOW', color: '\x1b[32m' }; // Green
  if (count <= 2) return { level: 'MEDIUM', color: '\x1b[33m' }; // Yellow
  return { level: 'HIGH', color: '\x1b[31m' }; // Red
}

async function runSearch() {
  console.log('\n--- My Paddy: Advanced Report Verification ---\n');

  rl.question('Enter search term (Phone/Name/Handle): ', (term) => {
    rl.question('Enter platform (e.g., WhatsApp, Facebook, Instagram - optional): ', async (platformInput) => {
      try {
        const normalizedTerm = normalize(term);
        const normalizedPlatform = platformInput.trim().toLowerCase();

        if (!normalizedTerm) {
          console.log('\n\x1b[31mError: Search term cannot be empty.\x1b[0m');
          rl.close();
          return;
        }

        // Query Supabase using the new RPC function
        const { data, error } = await supabase.rpc('search_reports', {
          search_term: normalizedTerm,
          platform_filter: platformInput || null
        });

        if (error) {
          console.error(`\x1b[31mSupabase Error: ${error.message}\x1b[0m`);
          rl.close();
          return;
        }

        const matches = data || [];

        if (matches.length === 0) {
          console.log(`\n\x1b[33mNo approved reports found for "${term}" on platform "${platformInput || 'Any'}". Still be cautious!\x1b[0m\n`);
        } else {
          const approvedCount = matches.length;

          const risk = getRiskInfo(approvedCount);

          console.log('\n' + '='.repeat(40));
          console.log('       REPORT VERIFICATION RESULT');
          console.log('='.repeat(40));
          console.log(`Search Term : ${term}`);
          console.log(`Platform    : ${platformInput || 'Any'}`);
          console.log(`Risk Level  : ${risk.color}${risk.level}\x1b[0m`);
          console.log(`Approved Rpts: ${approvedCount}`);
          console.log('-'.repeat(40));

          matches.forEach((report, index) => {
            console.log(`\n[Report #${index + 1}]`);
            console.log(`Business    : ${report.business_name || 'N/A'}`);
            console.log(`Phone       : ${report.phone_number || 'N/A'}`);
            console.log(`Handle      : ${report.platform_handle || 'N/A'}`);
            console.log(`Type        : ${report.incident_type}`);
            console.log(`Platform    : ${report.platform || 'N/A'}`);
            console.log(`Date        : ${new Date(report.created_at).toLocaleDateString()}`);
            console.log(`Description : ${report.description}`);
          });

          console.log('\n' + '='.repeat(40));
          console.log('Disclaimer: Community info only – verify independently and report serious cases to authorities');
          console.log('='.repeat(40) + '\n');
        }
      } catch (err) {
        console.error(`\x1b[31mUnexpected Error: ${err.message}\x1b[0m`);
      } finally {
        rl.close();
      }
    });
  });
}

runSearch();
