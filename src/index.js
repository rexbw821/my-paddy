const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Helper: create an authenticated Supabase client using the user's JWT
// This ensures RLS policies work correctly for the actual user.
function getSupabaseForUser(token) {
  if (!token) return supabase; // fallback to anon
  return createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY,
    {
      global: {
        headers: { Authorization: `Bearer ${token}` }
      }
    }
  );
}

app.get('/', (req, res) => {
  res.json({ status: 'API running' });
});

/**
 * Normalize target string for deduplication
 */
function normalizeTarget(target) {
  if (!target) return '';
  return target.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

// Search Endpoint (Only returns APPROVED reports)
app.post('/api/scam-check', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const normalizedQuery = normalizeTarget(query);
    console.log(`🔍 Search Query: "${query}" | Normalized: "${normalizedQuery}"`);

    // 1. Search for matching approved reports
    const { data: results, error: searchError } = await supabase.rpc('search_reports', {
      search_term: query
    });

    if (searchError) {
      console.error('❌ Search error:', searchError);
      return res.status(500).json({ error: searchError.message });
    }

    // 2. Fetch aggregate summary from the view (Optional but provides richer metadata)
    const { data: summary } = await supabase
      .from('report_summaries')
      .select('*')
      .ilike('target_normalized', `%${normalizedQuery}%`);

    console.log(`✅ Found ${results ? results.length : 0} reports.`);

    res.json({
      query,
      results: results || [],
      found: (results || []).length > 0,
      count: (results || []).length,
      summary: summary || [] // Aggregate stats for display
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit Report Endpoint
app.post('/api/reports', async (req, res) => {
  try {
    // Extract user JWT from Authorization header
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const db = getSupabaseForUser(token); // use user-scoped client if available

    const {
      business_name,
      phone_number,
      incident_type,
      description,
      platform,
      platform_handle,
      reporter_id,
      evidence_urls // Expecting an array of strings
    } = req.body;

    if ((!business_name && !phone_number) || !incident_type || !description) {
      return res.status(400).json({ error: 'At least Business Name or Phone Number is required, plus type and description.' });
    }

    const validTypes = ['scam', 'theft', 'robbery', 'fraud', 'other'];
    if (!validTypes.includes(incident_type)) {
      return res.status(400).json({ error: `Type must be one of: ${validTypes.join(', ')}` });
    }

    const phone_normalized = phone_number ? phone_number.replace(/[^0-9]/g, '') : null;
    const business_normalized = business_name ? normalizeTarget(business_name) : null;
    const target_normalized = phone_normalized || business_normalized || normalizeTarget(platform_handle);

    // 1. Insert report (using user-scoped client to satisfy RLS)
    const { data: report, error: reportError } = await db
      .from('reports')
      .insert([
        {
          business_name: business_name || null,
          business_normalized,
          phone_number: phone_number || null,
          phone_normalized,
          platform: platform || null,
          platform_handle: platform_handle || null,
          target_normalized,
          incident_type: incident_type,
          description: description.trim(),
          reporter_id: reporter_id || null,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (reportError) {
      console.error('❌ Report insert error:', reportError);
      return res.status(500).json({ error: reportError.message });
    }

    // 2. Insert evidence entries if any
    if (evidence_urls && Array.isArray(evidence_urls) && evidence_urls.length > 0) {
      const evidenceData = evidence_urls.map(url => ({
        report_id: report.id,
        uploader_id: reporter_id || null,
        file_url: url,
        file_type: url.split('.').pop() || 'unknown'
      }));

      const { error: evidenceError } = await db
        .from('evidence')
        .insert(evidenceData);

      if (evidenceError) {
        console.error('❌ Evidence insert error:', evidenceError);
        // We don't fail the whole request, but log it
      }
    }

    res.json({
      success: true,
      reportId: report.id,
      message: 'Report submitted successfully! Your report is pending approval.'
    });
  } catch (err) {
    console.error('Report submission error:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
