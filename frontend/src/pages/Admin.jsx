import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import './Admin.css'

function RiskBadge({ count }) {
  if (count >= 5) return <span className="admin-risk-high">🔴 High Risk</span>
  if (count >= 2) return <span className="admin-risk-med">⚠️ Medium Risk</span>
  return <span className="admin-risk-low">🟢 Low Risk</span>
}

function EvidenceSection({ reportId, supabase }) {
  const [evidence, setEvidence] = useState([])
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState(null)

  useEffect(() => {
    const fetchEvidence = async () => {
      try {
        const { data, error } = await supabase
          .from('evidence')
          .select('*')
          .eq('report_id', reportId)

        if (error) throw error
        setEvidence(data || [])
      } catch (e) {
        console.error('Evidence fetch error:', e.message)
      } finally {
        setLoading(false)
      }
    }
    fetchEvidence()
  }, [reportId])

  const isImage = (url) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url)
  const isPdf = (url) => /\.pdf$/i.test(url)

  if (loading) return <div className="admin-evidence-loading">Loading evidence…</div>
  if (!evidence.length) return <div className="admin-evidence-loading">No evidence files found.</div>

  return (
    <div className="admin-evidence-section">
      <div className="admin-meta-label">
        Evidence — {evidence.length} file{evidence.length !== 1 ? 's' : ''}
      </div>
      <div className="admin-evidence-grid">
        {evidence.map((item, i) => (
          <div key={i} className="admin-evidence-item">
            {isImage(item.file_url) ? (
              <div className="admin-evidence-thumb-wrap" onClick={() => setLightbox(item.file_url)}>
                <img
                  src={item.file_url}
                  alt={`Evidence ${i + 1}`}
                  className="admin-evidence-thumb"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
                <div className="admin-evidence-overlay">🔍 View</div>
              </div>
            ) : isPdf(item.file_url) ? (
              <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="admin-evidence-pdf">
                <span style={{ fontSize: '2rem' }}>📄</span>
                <span className="admin-evidence-pdf-label">View PDF</span>
              </a>
            ) : (
              <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="admin-evidence-pdf">
                <span style={{ fontSize: '2rem' }}>📎</span>
                <span className="admin-evidence-pdf-label">View File</span>
              </a>
            )}
          </div>
        ))}
      </div>

      {lightbox && (
        <div className="admin-lightbox-overlay" onClick={() => setLightbox(null)}>
          <div className="admin-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="admin-lightbox-close" onClick={() => setLightbox(null)}>✕</button>
            <img src={lightbox} alt="Evidence" className="admin-lightbox-img" />
            <a href={lightbox} target="_blank" rel="noopener noreferrer" className="admin-lightbox-download">
              ⬇️ Open full size
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

function ReportCard({ report, onApprove, onReject, approving, hasEvidence, supabase }) {
  const [expanded, setExpanded] = useState(false)
  const [showEvidence, setShowEvidence] = useState(false)
  const desc = report.description || ''
  const target = report.business_name || report.phone_number || 'Unknown'
  const date = report.created_at ? new Date(report.created_at).toLocaleDateString() : '—'

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span className="admin-card-target">Target: {target}</span>
          <span className={report.status === 'approved' ? 'admin-badge-approved' : 'admin-badge-pending'}>
            {report.status === 'approved' ? 'Approved' : 'Pending'}
          </span>
          {hasEvidence && <span className="admin-badge-evidence">📎 Has Evidence</span>}
        </div>
        <RiskBadge count={1} />
      </div>

      <div className="admin-meta-grid">
        <div><div className="admin-meta-label">Type</div><div className="admin-meta-value">{report.incident_type || '—'}</div></div>
        <div><div className="admin-meta-label">Platform</div><div className="admin-meta-value">{report.platform || '—'}</div></div>
        <div><div className="admin-meta-label">Handle</div><div className="admin-meta-value">{report.platform_handle || 'N/A'}</div></div>
        <div><div className="admin-meta-label">Date</div><div className="admin-meta-value">{date}</div></div>
      </div>

      <div className="admin-desc-box">
        <div className="admin-meta-label" style={{ marginBottom: 6 }}>Description</div>
        <div style={{ color: '#374151', fontSize: '0.9rem', lineHeight: 1.6 }}>
          {expanded ? desc : desc.slice(0, 140) + (desc.length > 140 ? '…' : '')}
          {desc.length > 140 && (
            <button className="admin-read-more-btn" onClick={() => setExpanded(!expanded)}>
              {expanded ? ' Show less' : ' Read more'}
            </button>
          )}
        </div>
      </div>

      <div className="admin-tags">
        {report.phone_number && <span className="admin-tag">📞 {report.phone_number}</span>}
        {report.business_name && <span className="admin-tag">🏢 {report.business_name}</span>}
        {report.platform_handle && <span className="admin-tag">🔗 {report.platform_handle}</span>}
      </div>

      {hasEvidence && (
        <>
          <button className="admin-evidence-toggle" onClick={() => setShowEvidence(!showEvidence)}>
            {showEvidence ? '🔼 Hide Evidence' : '🔽 View Evidence'}
          </button>
          {showEvidence && <EvidenceSection reportId={report.id} supabase={supabase} />}
        </>
      )}

      <div className="admin-card-actions">
        {report.status !== 'approved' && (
          <button
            className="admin-approve-btn"
            style={{ opacity: approving ? 0.6 : 1 }}
            onClick={() => onApprove(report.id)}
            disabled={approving}
          >
            {approving ? 'Approving…' : '✅ Approve'}
          </button>
        )}
        <button
          className="admin-reject-btn"
          style={{ opacity: approving ? 0.6 : 1 }}
          onClick={() => onReject(report.id)}
          disabled={approving}
        >
          ❌ {report.status === 'approved' ? 'Remove' : 'Reject'}
        </button>
      </div>
    </div>
  )
}

export default function Admin() {
  // ✅ Use the supabase client from AuthContext — carries the logged-in user's session token
  const { supabase, isAdmin } = useAuth()

  const [reports, setReports] = useState([])
  const [evidenceReportIds, setEvidenceReportIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [approvingId, setApprovingId] = useState(null)
  const [toast, setToast] = useState(null)
  const [filter, setFilter] = useState('pending')
  const [search, setSearch] = useState('')

  // ✅ Extra client-side guard — belt AND suspenders alongside App.jsx route guard
  if (!isAdmin) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p style={{ color: '#6B7280' }}>You don't have permission to view this page.</p>
      </div>
    )
  }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchReports = async () => {
    setLoading(true)
    setError(null)
    try {
      // ✅ supabase client automatically sends the user's JWT — RLS policies enforce admin access
      let query = supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })

      if (filter !== 'all') query = query.eq('status', filter)

      const { data, error: reportsError } = await query
      if (reportsError) throw reportsError

      setReports(data || [])

      // Fetch which reports have evidence
      const { data: evidenceData, error: evidenceError } = await supabase
        .from('evidence')
        .select('report_id')

      if (evidenceError) throw evidenceError

      const ids = new Set((evidenceData || []).map((e) => e.report_id))
      setEvidenceReportIds(ids)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReports() }, [filter])

  const handleApprove = async (id) => {
    setApprovingId(id)
    try {
      // ✅ Session token sent automatically — Supabase RLS will reject if user is not admin
      const { error } = await supabase
        .from('reports')
        .update({ status: 'approved' })
        .eq('id', id)

      if (error) throw error

      if (filter === 'pending') {
        setReports((prev) => prev.filter((r) => r.id !== id))
      } else {
        setReports((prev) => prev.map((r) => r.id === id ? { ...r, status: 'approved' } : r))
      }
      showToast('✅ Report approved!')
    } catch (e) {
      showToast('❌ Failed to approve: ' + e.message, 'error')
    } finally {
      setApprovingId(null)
    }
  }

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return
    setApprovingId(id)
    try {
      // ✅ Session token sent automatically — RLS will block non-admins at the database level
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', id)

      if (error) throw error

      setReports((prev) => prev.filter((r) => r.id !== id))
      showToast('🗑️ Report deleted.')
    } catch (e) {
      showToast('❌ Failed to delete: ' + e.message, 'error')
      fetchReports()
    } finally {
      setApprovingId(null)
    }
  }

  const filtered = reports.filter((r) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      (r.business_name || '').toLowerCase().includes(q) ||
      (r.phone_number || '').toLowerCase().includes(q) ||
      (r.platform_handle || '').toLowerCase().includes(q) ||
      (r.platform || '').toLowerCase().includes(q) ||
      (r.incident_type || '').toLowerCase().includes(q) ||
      (r.description || '').toLowerCase().includes(q)
    )
  })

  const pendingCount = reports.filter((r) => r.status === 'pending').length

  return (
    <div className="admin-wrapper">
      {toast && (
        <div className="admin-toast" style={{ background: toast.type === 'error' ? '#DC2626' : '#16A97A' }}>
          {toast.msg}
        </div>
      )}

      <div className="admin-inner-card">
        <div className="admin-top-row">
          <div>
            <h2 className="admin-title">Reports Dashboard</h2>
            <p className="admin-subtitle">Review and approve submitted scam reports</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div className="admin-search-box">
              <span>🔍</span>
              <input
                className="admin-search-input"
                placeholder="Search reports…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="admin-pending-bubble">
              <span className="admin-pending-num">{pendingCount}</span>
              <span className="admin-pending-label">Pending</span>
            </div>
            <button className="admin-refresh-btn" onClick={fetchReports} disabled={loading} title="Refresh">🔄</button>
          </div>
        </div>

        <div className="admin-tabs">
          {['pending', 'approved', 'all'].map((f) => (
            <button
              key={f}
              className={`admin-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="admin-center">
            <div className="admin-spinner" />
            <p style={{ color: '#6B7280', margin: 0 }}>Loading reports…</p>
          </div>
        ) : error ? (
          <div className="admin-error-box">
            <p>⚠️ {error}</p>
            <button className="admin-retry-btn" onClick={fetchReports}>Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="admin-center">
            <div style={{ fontSize: '3rem' }}>📭</div>
            <p style={{ color: '#6B7280', margin: 0 }}>No reports found</p>
          </div>
        ) : (
          <div className="admin-list">
            {filtered.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onApprove={handleApprove}
                onReject={handleReject}
                approving={approvingId === report.id}
                hasEvidence={evidenceReportIds.has(report.id)}
                supabase={supabase}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
