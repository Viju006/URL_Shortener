"use client";
import { useState } from "react";

export default function LinkResult({ data }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = data.shortUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const expiryDate = data.expiresAt
    ? new Date(data.expiresAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="result-card">
      <div className="result-label">Your shortened link</div>
      <div className="result-url-row">
        <a
          href={data.shortUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="result-short-url"
          id="result-url"
        >
          {data.shortUrl}
        </a>
        <button
          id="copy-btn"
          className={`btn-copy ${copied ? "copied" : ""}`}
          onClick={handleCopy}
        >
          {copied ? "✓ Copied!" : "Copy"}
        </button>
      </div>
      <div className="result-original">→ {data.originalUrl}</div>
      <div className="result-meta">
        <span>Code: {data.shortCode}</span>
        {expiryDate && <span>Expires: {expiryDate}</span>}
      </div>
    </div>
  );
}
