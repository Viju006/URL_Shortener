"use client";
import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";

export default function DashboardPage() {
  const [links, setLinks] = useState([]);
  const [pagination, setPagination] = useState({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [analyticsCode, setAnalyticsCode] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search) params.set("search", search);
      const res = await fetch(`/api/links?${params}`);
      const data = await res.json();
      setLinks(data.links || []);
      setPagination(data.pagination || {});
    } catch {
      console.error("Failed to fetch links");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this link? This cannot be undone.")) return;
    try {
      await fetch(`/api/links/${id}`, { method: "DELETE" });
      fetchLinks();
      if (analyticsCode) setAnalyticsCode(null);
    } catch {
      console.error("Delete failed");
    }
  };

  const handleToggleActive = async (id, currentActive) => {
    try {
      await fetch(`/api/links/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      fetchLinks();
    } catch {
      console.error("Toggle failed");
    }
  };

  const handleViewAnalytics = async (code) => {
    if (analyticsCode === code) {
      setAnalyticsCode(null);
      return;
    }
    setAnalyticsCode(code);
    setAnalyticsLoading(true);
    try {
      const res = await fetch(`/api/analytics/${code}?days=30`);
      const data = await res.json();
      setAnalyticsData(data);
    } catch {
      console.error("Analytics fetch failed");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleCopy = async (shortCode) => {
    const url = `${window.location.origin}/${shortCode}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch { /* fallback not needed for dashboard */ }
  };

  const getLinkStatus = (link) => {
    if (!link.is_active) return "inactive";
    if (link.expires_at && new Date(link.expires_at) < new Date()) return "expired";
    return "active";
  };

  const totalClicks = links.reduce((sum, l) => sum + (l.click_count || 0), 0);
  const activeLinks = links.filter((l) => getLinkStatus(l) === "active").length;

  return (
    <>
      <Header />
      <main className="dashboard">
        <div className="dashboard-header">
          <h1>Link Dashboard</h1>
        </div>

        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-label">Total Links</div>
            <div className="stat-value gradient">{pagination.total || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active Links</div>
            <div className="stat-value" style={{ color: "var(--success)" }}>{activeLinks}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Clicks</div>
            <div className="stat-value gradient">{totalClicks}</div>
          </div>
        </div>

        <div className="search-bar">
          <input
            id="search-links"
            type="text"
            className="search-input"
            placeholder="Search links by URL, code, or alias..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        {loading ? (
          <div className="empty-state"><p>Loading...</p></div>
        ) : links.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🔗</div>
            <h3>No links yet</h3>
            <p>Create your first short link to get started!</p>
          </div>
        ) : (
          <>
            <table className="links-table">
              <thead>
                <tr>
                  <th>Short Link</th>
                  <th>Original URL</th>
                  <th>Clicks</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {links.map((link) => {
                  const status = getLinkStatus(link);
                  return (
                    <tr key={link.id}>
                      <td>
                        <a href={`/${link.short_code}`} target="_blank" rel="noopener noreferrer" className="link-short">
                          /{link.short_code}
                        </a>
                      </td>
                      <td>
                        <span className="link-original" title={link.original_url}>
                          {link.original_url}
                        </span>
                      </td>
                      <td><span className="link-clicks">{link.click_count || 0}</span></td>
                      <td>
                        <span className={`badge badge-${status}`}>{status}</span>
                      </td>
                      <td style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                        {new Date(link.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="actions-cell">
                          <button className="btn-action" onClick={() => handleCopy(link.short_code)} title="Copy link">📋</button>
                          <button className="btn-action" onClick={() => handleViewAnalytics(link.short_code)} title="View analytics">
                            {analyticsCode === link.short_code ? "✕" : "📊"}
                          </button>
                          <button className="btn-action" onClick={() => handleToggleActive(link.id, link.is_active)} title={link.is_active ? "Deactivate" : "Activate"}>
                            {link.is_active ? "⏸" : "▶"}
                          </button>
                          <button className="btn-action danger" onClick={() => handleDelete(link.id)} title="Delete">🗑</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {analyticsCode && (
              <div className="analytics-panel">
                {analyticsLoading ? (
                  <p>Loading analytics...</p>
                ) : analyticsData ? (
                  <>
                    <h3>Analytics for /{analyticsCode}</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                      <div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          Clicks (Last 30 Days) — Total: {analyticsData.analytics?.totalClicks || 0}
                        </div>
                        <div className="chart-container">
                          {(analyticsData.analytics?.clicksByDay || []).map((d, i) => {
                            const max = Math.max(...(analyticsData.analytics?.clicksByDay || []).map((x) => x.clicks), 1);
                            const height = Math.max((d.clicks / max) * 100, 2);
                            return (
                              <div key={i} className="chart-bar" style={{ height: `${height}%` }}>
                                <div className="tooltip">{d.date}: {d.clicks} clicks</div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="chart-labels">
                          <span>30 days ago</span>
                          <span>Today</span>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          Top Referrers
                        </div>
                        {(analyticsData.analytics?.topReferrers || []).length === 0 ? (
                          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>No referrer data yet</p>
                        ) : (
                          <ul className="referrers-list">
                            {(analyticsData.analytics?.topReferrers || []).map((r, i) => (
                              <li key={i}>
                                <span style={{ color: "var(--text-secondary)" }}>{r.referrer || "Direct"}</span>
                                <span style={{ fontWeight: 600 }}>{r.clicks}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            )}

            {pagination.totalPages > 1 && (
              <div className="pagination">
                <button className="page-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
                {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => i + 1).map((p) => (
                  <button key={p} className={`page-btn ${page === p ? "active" : ""}`} onClick={() => setPage(p)}>{p}</button>
                ))}
                <button className="page-btn" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
