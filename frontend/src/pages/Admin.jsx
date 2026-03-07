import { useState, useEffect } from "react";

const SUPABASE_URL = "https://xfyurttqlutukzowfidd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmeXVydHRxbHV0dWt6b3dmaWRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODIzNTUsImV4cCI6MjA4Njc1ODM1NX0.fk5uOgO0Csgme75-CIJd94kzNvsYUaKhxUUhIzCjX_Q";

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

function ReportCard({ report, onApprove, onReject, approving }) {
  const [expanded, setExpanded] = useState(false);
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

export default function Admin() {
  const [reports, setReports] = useState([]);
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
      let query = "/reports?order=created_at.desc";
      if (filter !== "all") query += `&status=eq.${filter}`;
      const data = await supabaseFetch(query);
      setReports(data || []);
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

      {/* The centered white card — same width and centering as before, outer bg gone */}
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  // Transparent wrapper — no background, no extra width
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

  // The centered card — same size and centering as picture 1, outer bg removed
  innerCard: {
    background: "white",
    borderRadius: 20,
    padding: "32px",
    maxWidth: 760,       // same as the original proportional width
    margin: "0 auto",   // centered
    boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
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
  riskHigh: { background: "#fee2e2", color: "#991b1b", fontSize: "0.78rem", fontWeight: 700, padding: "4px 10px", borderRadius: 20 },
  riskMed:  { background: "#fef3c7", color: "#92400e", fontSize: "0.78rem", fontWeight: 700, padding: "4px 10px", borderRadius: 20 },
  riskLow:  { background: "#dcfce7", color: "#166534", fontSize: "0.78rem", fontWeight: 700, padding: "4px 10px", borderRadius: 20 },
  metaGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 14 },
  metaLabel: { fontSize: "0.72rem", color: "#9ca3af", fontWeight: 600, marginBottom: 2, textTransform: "uppercase" },
  metaValue: { fontSize: "0.9rem", color: "#374151", fontWeight: 500 },
  descBox: {
    background: "white", border: "1px solid #e5e7eb",
    borderRadius: 10, padding: "12px 14px", marginBottom: 12,
  },
  readMoreBtn: { background: "none", border: "none", color: "#667eea", fontWeight: 600, fontSize: "0.85rem", padding: 0, cursor: "pointer" },
  tags: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 },
  tag: { background: "#ede9fe", color: "#5b21b6", padding: "4px 12px", borderRadius: 20, fontSize: "0.78rem", fontWeight: 500 },
  cardActions: { display: "flex", gap: 10, justifyContent: "flex-end" },
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