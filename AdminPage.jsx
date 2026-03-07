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
  if (!res.ok) throw new Error(await res.text());
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

  // ── Use the correct column names from submitReport.js ──
  const target = report.business_name || report.phone_number || "Unknown";
  const incidentType = report.incident_type || "—";
  const platform = report.platform || "—";
  const handle = report.platform_handle || "N/A";
  const date = report.created_at ? new Date(report.created_at).toLocaleDateString() : "—";

  return (
    <div style={s.card}>
      {/* Card header */}
      <div style={s.cardHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={s.cardTarget}>Target: {target}</span>
          <span style={report.status === "approved" ? s.approvedBadge : s.pendingBadge}>
            {report.status === "approved" ? "Approved" : "Pending"}
          </span>
        </div>
        <RiskBadge count={1} />
      </div>

      {/* Meta row — all 4 fields now correctly mapped */}
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

      {/* Description */}
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

      {/* Tags — phone number and business name */}
      <div style={s.tags}>
        {report.phone_number && (
          <span style={s.tag}>📞 {report.phone_number}</span>
        )}
        {report.business_name && (
          <span style={s.tag}>🏢 {report.business_name}</span>
        )}
        {report.platform_handle && (
          <span style={s.tag}>🔗 {report.platform_handle}</span>
        )}
      </div>

      {/* Actions */}
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

export default function AdminPage({ onLogout }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approvingId, setApprovingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
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
      await supabaseFetch(`/reports?id=eq.${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "approved" }),
      });
      if (filter === "pending") {
        setReports((prev) => prev.filter((r) => r.id !== id));
      } else {
        setReports((prev) => prev.map((r) => r.id === id ? { ...r, status: "approved" } : r));
      }
      showToast("Report approved successfully!");
    } catch (e) {
      showToast("Failed to approve: " + e.message, "error");
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("Are you sure you want to reject and delete this report?")) return;
    setApprovingId(id);
    try {
      await supabaseFetch(`/reports?id=eq.${id}`, { method: "DELETE" });
      setReports((prev) => prev.filter((r) => r.id !== id));
      showToast("Report rejected and removed.", "error");
    } catch (e) {
      showToast("Failed to reject: " + e.message, "error");
    } finally {
      setApprovingId(null);
    }
  };

  // Search across all relevant columns
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
    <div style={s.fullPage}>
      {/* Toast */}
      {toast && (
        <div style={{ ...s.toast, background: toast.type === "error" ? "#ef4444" : "#22c55e" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header style={s.header}>
        <div style={s.logoRow}>
          <span style={s.logoIcon}>🌾</span>
          <span style={s.logoText}>my paddy</span>
          <span style={s.adminChip}>Admin</span>
        </div>
        <p style={s.headerSub}>Protect communities from fraud and scams</p>

        {/* Nav — matches Search/Report pill style */}
        <nav style={s.nav}>
          {["pending", "approved", "all"].map((f) => (
            <button
              key={f}
              style={{ ...s.navBtn, ...(filter === f ? s.navBtnActive : {}) }}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <button style={s.backBtn} onClick={onLogout}>
            ← Exit Admin
          </button>
        </nav>
      </header>

      {/* Main white card */}
      <main style={s.main}>
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

        {/* Content */}
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
            <p style={{ color: "#6b7280", marginTop: 10, fontSize: "1rem" }}>No reports found</p>
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
      </main>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const s = {
  fullPage: {
    position: "fixed",
    inset: 0,
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    overflowY: "auto",
    padding: "30px 20px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    zIndex: 100,
  },
  toast: {
    position: "fixed",
    top: 20, right: 20,
    color: "white",
    padding: "12px 22px",
    borderRadius: 10,
    fontWeight: 600,
    zIndex: 200,
    boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
  },
  header: { textAlign: "center", marginBottom: 28 },
  logoRow: {
    display: "flex", alignItems: "center",
    justifyContent: "center", gap: 10, marginBottom: 6,
  },
  logoIcon: { fontSize: "2.2rem" },
  logoText: { fontSize: "2.2rem", fontWeight: 800, color: "white", letterSpacing: "-0.5px" },
  adminChip: {
    background: "rgba(255,255,255,0.25)", color: "white",
    fontSize: "0.7rem", fontWeight: 700,
    padding: "3px 10px", borderRadius: 20,
    letterSpacing: 1, textTransform: "uppercase", alignSelf: "center",
  },
  headerSub: { color: "rgba(255,255,255,0.8)", fontSize: "1rem", marginBottom: 20 },
  nav: {
    display: "flex", justifyContent: "center",
    alignItems: "center", gap: 12, flexWrap: "wrap",
  },
  navBtn: {
    background: "transparent",
    border: "2px solid rgba(255,255,255,0.7)",
    color: "white", borderRadius: 50,
    padding: "10px 28px", fontWeight: 600,
    fontSize: "1rem", cursor: "pointer",
  },
  navBtnActive: {
    background: "white", color: "#667eea", border: "2px solid white",
  },
  backBtn: {
    background: "transparent",
    border: "2px solid rgba(255,255,255,0.4)",
    color: "rgba(255,255,255,0.7)", borderRadius: 50,
    padding: "10px 22px", fontWeight: 600,
    fontSize: "0.9rem", cursor: "pointer", marginLeft: 8,
  },
  main: {
    background: "white", borderRadius: 20,
    padding: "32px", maxWidth: 860,
    margin: "0 auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
  },
  topRow: {
    display: "flex", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: 28,
    flexWrap: "wrap", gap: 16,
  },
  title: { fontSize: "1.6rem", fontWeight: 800, color: "#111827", marginBottom: 4 },
  subtitle: { color: "#6b7280", fontSize: "0.9rem" },
  searchBox: {
    display: "flex", alignItems: "center", gap: 8,
    background: "#f9fafb", border: "1px solid #e5e7eb",
    borderRadius: 12, padding: "9px 14px", minWidth: 220,
  },
  searchInput: {
    border: "none", background: "transparent",
    outline: "none", fontSize: "0.9rem",
    color: "#374151", width: "100%", padding: 0,
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
    borderRadius: 10, padding: "10px 14px",
    fontSize: "1rem", cursor: "pointer",
  },
  list: { display: "flex", flexDirection: "column", gap: 16 },
  card: {
    border: "1px solid #e5e7eb", borderRadius: 16,
    padding: "22px", background: "#fafafa",
  },
  cardHeader: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", marginBottom: 16,
    flexWrap: "wrap", gap: 8,
  },
  cardTarget: { fontWeight: 700, fontSize: "1rem", color: "#111827" },
  pendingBadge: {
    background: "#fef3c7", color: "#92400e",
    fontSize: "0.72rem", fontWeight: 700,
    padding: "3px 10px", borderRadius: 20,
    textTransform: "uppercase", letterSpacing: 0.5,
  },
  approvedBadge: {
    background: "#dcfce7", color: "#166534",
    fontSize: "0.72rem", fontWeight: 700,
    padding: "3px 10px", borderRadius: 20,
    textTransform: "uppercase", letterSpacing: 0.5,
  },
  riskHigh: { background: "#fee2e2", color: "#991b1b", fontSize: "0.78rem", fontWeight: 700, padding: "4px 10px", borderRadius: 20 },
  riskMed: { background: "#fef3c7", color: "#92400e", fontSize: "0.78rem", fontWeight: 700, padding: "4px 10px", borderRadius: 20 },
  riskLow: { background: "#dcfce7", color: "#166534", fontSize: "0.78rem", fontWeight: 700, padding: "4px 10px", borderRadius: 20 },
  metaGrid: {
    display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
    gap: 12, marginBottom: 14,
  },
  metaLabel: {
    fontSize: "0.72rem", color: "#9ca3af",
    fontWeight: 600, marginBottom: 2, textTransform: "uppercase",
  },
  metaValue: { fontSize: "0.9rem", color: "#374151", fontWeight: 500 },
  descBox: {
    background: "white", border: "1px solid #e5e7eb",
    borderRadius: 10, padding: "12px 14px", marginBottom: 12,
  },
  readMoreBtn: {
    background: "none", border: "none", color: "#667eea",
    fontWeight: 600, fontSize: "0.85rem", padding: 0, cursor: "pointer",
  },
  tags: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 },
  tag: {
    background: "#ede9fe", color: "#5b21b6",
    padding: "4px 12px", borderRadius: 20,
    fontSize: "0.78rem", fontWeight: 500,
  },
  cardActions: { display: "flex", gap: 10, justifyContent: "flex-end" },
  approveBtn: {
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    color: "white", border: "none", borderRadius: 10,
    padding: "10px 24px", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer",
  },
  rejectBtn: {
    background: "#f3f4f6", color: "#6b7280",
    border: "1px solid #e5e7eb", borderRadius: 10,
    padding: "10px 24px", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer",
  },
  center: {
    textAlign: "center", padding: "60px 20px",
    display: "flex", flexDirection: "column", alignItems: "center",
  },
  spinner: {
    width: 42, height: 42, borderRadius: "50%",
    border: "4px solid #e5e7eb",
    borderTop: "4px solid #667eea",
    animation: "spin 0.8s linear infinite",
  },
  errorBox: {
    background: "#fef2f2", border: "1px solid #fecaca",
    borderRadius: 12, padding: "24px",
    textAlign: "center", color: "#dc2626",
  },
  retryBtn: {
    marginTop: 10, background: "#667eea", color: "white",
    border: "none", borderRadius: 8, padding: "8px 20px",
    fontWeight: 600, cursor: "pointer",
  },
};