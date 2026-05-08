"use client";
import { useState } from "react";

export default function ShortenForm({ onResult }) {
  // Default expiry: 30 days from now
  const defaultExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [url, setUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [expiresAt, setExpiresAt] = useState(defaultExpiry);
  const [showOptions, setShowOptions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError("");

    try {
      const body = { url: url.trim() };
      if (customAlias.trim()) body.customAlias = customAlias.trim();
      if (expiresAt) body.expiresAt = new Date(expiresAt).toISOString();

      const res = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      onResult(data);
      setUrl("");
      setCustomAlias("");
      setExpiresAt("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const minDate = new Date().toISOString().split("T")[0];

  return (
    <div className="shorten-section">
      <div className="shorten-card">
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              id="url-input"
              type="url"
              className="url-input"
              placeholder="Paste your long URL here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              autoComplete="off"
              autoFocus
            />
            <button
              id="shorten-btn"
              type="submit"
              className="btn-shorten"
              disabled={loading || !url.trim()}
            >
              {loading ? <span className="spinner" /> : "Shorten"}
            </button>
          </div>

          <button
            type="button"
            className="options-toggle"
            onClick={() => setShowOptions(!showOptions)}
          >
            <span
              className={`chevron ${showOptions ? "open" : ""}`}
            >
              ▼
            </span>
            Advanced options
          </button>

          <div className={`options-panel ${showOptions ? "open" : ""}`}>
            <div className="option-field">
              <label htmlFor="custom-alias">Custom Alias</label>
              <input
                id="custom-alias"
                type="text"
                className="option-input"
                placeholder="my-custom-link"
                value={customAlias}
                onChange={(e) => setCustomAlias(e.target.value)}
              />
            </div>
            <div className="option-field">
              <label htmlFor="expires-at">Expiry Date</label>
              <input
                id="expires-at"
                type="date"
                className="option-input"
                min={minDate}
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>
        </form>

        {error && (
          <div
            style={{
              marginTop: "1rem",
              padding: "0.75rem 1rem",
              borderRadius: "var(--radius-sm)",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "var(--danger)",
              fontSize: "0.875rem",
            }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
