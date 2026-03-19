import { useState, useEffect } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function supabaseFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...options.headers,
    },
    ...options,
  });
  if (res.status === 204) return null;
  if (!res.ok) throw new Error(await res.text());
  return res.json().catch(() => null);
}

async function deleteReport(id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/reports?id=eq.${id}`, {
    method: "DELETE",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
  });
  if (res.status === 204 || res.ok) return true;
  throw new Error(await res.text() || `Delete failed with status ${res.status}`);
}

async function approveReport(id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/reports?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({ status: "approved" }),
  });
  if (!res.ok) throw new Error(await res.text() || `Approve failed with status ${res.status}`);
  return res.json().catch(() => null);
}

function RiskBadge({ count }) {
  if (count >= 5) return <span style={s.riskHigh}>🔴 High Risk</span>;
  if (count >= 2) return <span style={s.riskMed}>⚠️ Medium Risk</span>;
  return <span style={s.riskLow}>🟢 Low Risk</span>;
}

// ── Evidence viewer ───────────────────────────────────────────────────────────
function EvidenceSection({ reportId }) {
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    const fetchEvidence = async () => {
      try {
        const data = await supabaseFetch(`/evidence?report_id=eq.${reportId}&select=*`);
        setEvidence(data || []);
      } catch (e) {
        console.error("Evidence fetch error:", e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEvidence();
  }, [reportId]);

  const isImage = (url) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  const isPdf = (url) => /\.pdf$/i.test(url);

  if (loading) return <div style={s.evidenceLoading}>Loading evidence…</div>;
  if (!evidence.length) return null;

  return (
    <div style={s.evidenceSection}>
      <div style={s.metaLabel}>
        Evidence — {evidence.length} file{evidence.length !== 1 ? "s" : ""}
      </div>
      <div style={s.evidenceGrid}>
        {evidence.map((item, i) => (
          <div key={i} style={s.evidenceItem}>
            {isImage(item.file_url) ? (
              <div style={s.evidenceThumbWrap} onClick={() => setLightbox(item.file_url)}>
                <img
                  src={item.file_url}
                  alt={`Evidence ${i + 1}`}
                  style={s.evidenceThumb}
                  onError={(e) => { e.target.style.display = "none"; }}
                />
                <div style={s.evidenceOverlay}>🔍 View</div>
              </div>
            ) : isPdf(item.file_url) ? (
              <a href={item.file_url} target="_blank" rel="noopener noreferrer" style={s.evidencePdf}>
                <span style={{ fontSize: "2rem" }}>📄</span>
                <span style={s.evidencePdfLabel}>View PDF</span>
              </a>
            ) : (
              <a href={item.file_url} target="_blank" rel="noopener noreferrer" style={s.evidencePdf}>
                <span style={{ fontSize: "2rem" }}>📎</span>
                <span style={s.evidencePdfLabel}>View File</span>
              </a>
            )}
          </div>
        ))}
      </div>

      {lightbox && (
        <div style={s.lightboxOverlay} onClick={() => setLightbox(null)}>
          <div style={s.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <button style={s.lightboxClose} onClick={() => setLightbox(null)}>✕</button>
            <img src={lightbox} alt="Evidence" style={s.lightboxImg} />
            <a href={lightbox} target="_blank" rel="noopener noreferrer" style={s.lightboxDownload}>
              ⬇️ Open full size
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Single report card ────────────────────────────────────────────────────────
// hasEvidence is passed in from the parent — determined before rendering
function ReportCard({ report, onApprove, onReject, approving, hasEvidence }) {
  const [expanded, setExpanded] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const desc = report.description || "";

  const target = report.business_name || report.phone_number || "Unknown";
  const incidentType = report.incident_type || "—";
  const platform = report.platform || "—";
  const handle = report.platform_handle || "N/A";
  const date = report.created_at ? new Date(report.created_at).toLocaleDateString() : "—";

  return (
    <div style={s.card}>
      <div style={s.cardHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={s.cardTarget}>Target: {target}</span>
          <span style={report.status === "approved" ? s.approvedBadge : s.pendingBadge}>
            {report.status === "approved" ? "Approved" : "Pending"}
          </span>
          {/* Small badge showing evidence exists */}
          {hasEvidence && (
            <span style={s.evidenceBadge}>📎 Has Evidence</span>
          )}
        </div>
        <RiskBadge count={1} />
      </div>

      <div style={s.metaGrid}>
        <div>
          <div style={s.metaLabel}>Type</div>
          <div style={s.metaValue}>{incidentType}</div>
        </div>
        <div>
          <div style={s.metaLabel}>Platform</div>
          <div style={s.metaValue}>{platform}</div>
        </div>
        <div>
          <div style={s.metaLabel}>Handle</div>
          <div style={s.metaValue}>{handle}</div>
        </div>
        <div>
          <div style={s.metaLabel}>Date</div>
          <div style={s.metaValue}>{date}</div>
        </div>
      </div>

      <div style={s.descBox}>
        <div style={s.metaLabel}>Description</div>
        <div style={{ color: "#374151", fontSize: "0.9rem", lineHeight: 1.6 }}>
          {expanded ? desc : desc.slice(0, 140) + (desc.length > 140 ? "…" : "")}
          {desc.length > 140 && (
            <button style={s.readMoreBtn} onClick={() => setExpanded(!expanded)}>
              {expanded ? " Show less" : " Read more"}
            </button>
          )}
        </div>
      </div>

      <div style={s.tags}>
        {report.phone_number && <span style={s.tag}>📞 {report.phone_number}</span>}
        {report.business_name && <span style={s.tag}>🏢 {report.business_name}</span>}
        {report.platform_handle && <span style={s.tag}>🔗 {report.platform_handle}</span>}
      </div>

      {/* Only show the button if this report has evidence */}
      {hasEvidence && (
        <>
          <button
            style={s.evidenceToggleBtn}
            onClick={() => setShowEvidence(!showEvidence)}
          >
            {showEvidence ? "🔼 Hide Evidence" : "🔽 View Evidence"}
          </button>
          {showEvidence && <EvidenceSection reportId={report.id} />}
        </>
      )}

      <div style={s.cardActions}>
        {report.status !== "approved" && (
          <button
            style={{ ...s.approveBtn, opacity: approving ? 0.6 : 1 }}
            onClick={() => onApprove(report.id)}
            disabled={approving}
          >
            {approving ? "Approving…" : "✅ Approve"}
          </button>
        )}
        <button
          style={{ ...s.rejectBtn, opacity: approving ? 0.6 : 1 }}
          onClick={() => onReject(report.id)}
          disabled={approving}
        >
          ❌ {report.status === "approved" ? "Remove" : "Reject"}
        </button>
      </div>
    </div>
  );
}

// ── Main Admin component ──────────────────────────────────────────────────────
export default function Admin() {
  const [reports, setReports] = useState([]);
  const [evidenceReportIds, setEvidenceReportIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approvingId, setApprovingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch reports
      let query = "/reports?order=created_at.desc";
      if (filter !== "all") query += `&status=eq.${filter}`;
      const data = await supabaseFetch(query);
      setReports(data || []);

      // Fetch all distinct report_ids that have evidence — separate simple query
      // This avoids needing a foreign key relationship
      const evidenceData = await supabaseFetch("/evidence?select=report_id");
      const ids = new Set((evidenceData || []).map((e) => e.report_id));
      setEvidenceReportIds(ids);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, [filter]);

  const handleApprove = async (id) => {
    setApprovingId(id);
    try {
      await approveReport(id);
      if (filter === "pending") {
        setReports((prev) => prev.filter((r) => r.id !== id));
      } else {
        setReports((prev) => prev.map((r) => r.id === id ? { ...r, status: "approved" } : r));
      }
      showToast("✅ Report approved!");
    } catch (e) {
      showToast("❌ Failed to approve: " + e.message, "error");
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("Are you sure you want to delete this report from the database?")) return;
    setApprovingId(id);
    try {
      await deleteReport(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
      showToast("🗑️ Report deleted from database.");
    } catch (e) {
      showToast("❌ Failed to delete: " + e.message, "error");
      fetchReports();
    } finally {
      setApprovingId(null);
    }
  };

  const filtered = reports.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (r.business_name || "").toLowerCase().includes(q) ||
      (r.phone_number || "").toLowerCase().includes(q) ||
      (r.platform_handle || "").toLowerCase().includes(q) ||
      (r.platform || "").toLowerCase().includes(q) ||
      (r.incident_type || "").toLowerCase().includes(q) ||
      (r.description || "").toLowerCase().includes(q)
    );
  });

  const pendingCount = reports.filter((r) => r.status === "pending").length;

  return (
    <div style={s.wrapper}>
      {toast && (
        <div style={{ ...s.toast, background: toast.type === "error" ? "#ef4444" : "#22c55e" }}>
          {toast.msg}
        </div>
      )}

      <div style={s.innerCard}>
        <div style={s.topRow}>
          <div>
            <h2 style={s.title}>Reports Dashboard</h2>
            <p style={s.subtitle}>Review and approve submitted scam reports</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={s.searchBox}>
              <span>🔍</span>
              <input
                style={s.searchInput}
                placeholder="Search reports…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div style={s.pendingBubble}>
              <span style={s.pendingNum}>{pendingCount}</span>
              <span style={s.pendingLabel}>Pending</span>
            </div>
            <button style={s.refreshBtn} onClick={fetchReports} disabled={loading} title="Refresh">
              🔄
            </button>
          </div>
        </div>

        <div style={s.tabs}>
          {["pending", "approved", "all"].map((f) => (
            <button
              key={f}
              style={{ ...s.tab, ...(filter === f ? s.tabActive : {}) }}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={s.center}>
            <div style={s.spinner} />
            <p style={{ color: "#6b7280", marginTop: 14 }}>Loading reports…</p>
          </div>
        ) : error ? (
          <div style={s.errorBox}>
            <p>⚠️ {error}</p>
            <button style={s.retryBtn} onClick={fetchReports}>Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={s.center}>
            <div style={{ fontSize: "3.5rem" }}>📭</div>
            <p style={{ color: "#6b7280", marginTop: 10 }}>No reports found</p>
          </div>
        ) : (
          <div style={s.list}>
            {filtered.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onApprove={handleApprove}
                onReject={handleReject}
                approving={approvingId === report.id}
                hasEvidence={evidenceReportIds.has(report.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  wrapper: {
    width: "100%",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  toast: {
    position: "fixed", top: 20, right: 20,
    color: "white", padding: "12px 22px",
    borderRadius: 10, fontWeight: 600, zIndex: 200,
    boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
  },
  innerCard: {
    background: "white", borderRadius: 20,
    padding: "32px", maxWidth: 760,
    margin: "0 auto", boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
  },
  topRow: {
    display: "flex", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: 20,
    flexWrap: "wrap", gap: 16,
  },
  title: { fontSize: "1.6rem", fontWeight: 800, color: "#111827", marginBottom: 4 },
  subtitle: { color: "#6b7280", fontSize: "0.9rem" },
  searchBox: {
    display: "flex", alignItems: "center", gap: 8,
    background: "#f9fafb", border: "1px solid #e5e7eb",
    borderRadius: 12, padding: "9px 14px", minWidth: 200,
  },
  searchInput: {
    border: "none", background: "transparent", outline: "none",
    fontSize: "0.9rem", color: "#374151", width: "100%", padding: 0,
  },
  pendingBubble: {
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    borderRadius: 14, padding: "10px 18px",
    textAlign: "center", color: "white", minWidth: 70,
  },
  pendingNum: { display: "block", fontSize: "1.6rem", fontWeight: 800, lineHeight: 1 },
  pendingLabel: { fontSize: "0.7rem", opacity: 0.85, textTransform: "uppercase", letterSpacing: 0.5 },
  refreshBtn: {
    background: "#f3f4f6", border: "1px solid #e5e7eb",
    borderRadius: 10, padding: "10px 14px", fontSize: "1rem", cursor: "pointer",
  },
  tabs: { display: "flex", gap: 8, marginBottom: 24 },
  tab: {
    background: "#f3f4f6", border: "none", borderRadius: 8,
    padding: "8px 20px", fontSize: "0.85rem", fontWeight: 600,
    color: "#6b7280", cursor: "pointer",
  },
  tabActive: {
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "white",
  },
  list: { display: "flex", flexDirection: "column", gap: 16 },
  card: {
    border: "1px solid #e5e7eb", borderRadius: 16,
    padding: "22px", background: "#fafafa",
  },
  cardHeader: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8,
  },
  cardTarget: { fontWeight: 700, fontSize: "1rem", color: "#111827" },
  pendingBadge: {
    background: "#fef3c7", color: "#92400e", fontSize: "0.72rem",
    fontWeight: 700, padding: "3px 10px", borderRadius: 20,
    textTransform: "uppercase", letterSpacing: 0.5,
  },
  approvedBadge: {
    background: "#dcfce7", color: "#166534", fontSize: "0.72rem",
    fontWeight: 700, padding: "3px 10px", borderRadius: 20,
    textTransform: "uppercase", letterSpacing: 0.5,
  },
  evidenceBadge: {
    background: "#eff6ff", color: "#1d4ed8", fontSize: "0.72rem",
    fontWeight: 700, padding: "3px 10px", borderRadius: 20,
  },
  riskHigh: { background: "#fee2e2", color: "#991b1b", fontSize: "0.78rem", fontWeight: 700, padding: "4px 10px", borderRadius: 20 },
  riskMed:  { background: "#fef3c7", color: "#92400e", fontSize: "0.78rem", fontWeight: 700, padding: "4px 10px", borderRadius: 20 },
  riskLow:  { background: "#dcfce7", color: "#166534", fontSize: "0.78rem", fontWeight: 700, padding: "4px 10px", borderRadius: 20 },
  metaGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 14 },
  metaLabel: { fontSize: "0.72rem", color: "#9ca3af", fontWeight: 600, marginBottom: 6, textTransform: "uppercase" },
  metaValue: { fontSize: "0.9rem", color: "#374151", fontWeight: 500 },
  descBox: {
    background: "white", border: "1px solid #e5e7eb",
    borderRadius: 10, padding: "12px 14px", marginBottom: 12,
  },
  readMoreBtn: { background: "none", border: "none", color: "#667eea", fontWeight: 600, fontSize: "0.85rem", padding: 0, cursor: "pointer" },
  tags: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 },
  tag: { background: "#ede9fe", color: "#5b21b6", padding: "4px 12px", borderRadius: 20, fontSize: "0.78rem", fontWeight: 500 },
  evidenceToggleBtn: {
    background: "#eff6ff", border: "1px solid #bfdbfe",
    color: "#1d4ed8", borderRadius: 8,
    padding: "7px 14px", fontSize: "0.82rem",
    fontWeight: 600, cursor: "pointer",
    marginBottom: 10, width: "100%", textAlign: "left",
  },
  evidenceSection: { marginBottom: 12 },
  evidenceLoading: { color: "#9ca3af", fontSize: "0.85rem", padding: "8px 0" },
  evidenceGrid: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 },
  evidenceItem: { position: "relative" },
  evidenceThumbWrap: {
    width: 90, height: 90, borderRadius: 10,
    overflow: "hidden", cursor: "pointer",
    position: "relative", border: "2px solid #e5e7eb",
  },
  evidenceThumb: { width: "100%", height: "100%", objectFit: "cover" },
  evidenceOverlay: {
    position: "absolute", inset: 0,
    background: "rgba(0,0,0,0.4)", color: "white",
    fontSize: "0.75rem", fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  evidencePdf: {
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    width: 90, height: 90, borderRadius: 10,
    border: "2px solid #e5e7eb", background: "#fef2f2",
    textDecoration: "none", gap: 4,
  },
  evidencePdfLabel: { fontSize: "0.7rem", color: "#dc2626", fontWeight: 600 },
  lightboxOverlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.85)", zIndex: 999,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  lightboxContent: {
    position: "relative", maxWidth: "90vw", maxHeight: "90vh",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
  },
  lightboxImg: { maxWidth: "90vw", maxHeight: "80vh", borderRadius: 12, objectFit: "contain" },
  lightboxClose: {
    position: "absolute", top: -16, right: -16,
    background: "white", border: "none", borderRadius: "50%",
    width: 32, height: 32, fontWeight: 700, cursor: "pointer", fontSize: "1rem", zIndex: 1000,
  },
  lightboxDownload: { color: "white", fontSize: "0.85rem", fontWeight: 600, textDecoration: "none" },
  cardActions: { display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 },
  approveBtn: {
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    color: "white", border: "none", borderRadius: 10,
    padding: "10px 24px", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer",
  },
  rejectBtn: {
    background: "#f3f4f6", color: "#6b7280", border: "1px solid #e5e7eb",
    borderRadius: 10, padding: "10px 24px", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer",
  },
  center: { textAlign: "center", padding: "60px 20px", display: "flex", flexDirection: "column", alignItems: "center" },
  spinner: {
    width: 42, height: 42, borderRadius: "50%",
    border: "4px solid #e5e7eb", borderTop: "4px solid #667eea",
    animation: "spin 0.8s linear infinite",
  },
  errorBox: {
    background: "#fef2f2", border: "1px solid #fecaca",
    borderRadius: 12, padding: "24px", textAlign: "center", color: "#dc2626",
  },
  retryBtn: {
    marginTop: 10, background: "#667eea", color: "white",
    border: "none", borderRadius: 8, padding: "8px 20px", fontWeight: 600, cursor: "pointer",
  },
};
