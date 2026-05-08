"use client";
import { useState } from "react";
import Header from "@/components/Header";
import ShortenForm from "@/components/ShortenForm";
import LinkResult from "@/components/LinkResult";

export default function HomePage() {
  const [results, setResults] = useState([]);

  const handleResult = (data) => {
    setResults((prev) => [data, ...prev]);
  };

  return (
    <>
      <Header />
      <main>
        <section className="hero">
          <div className="hero-badge">
            <span className="dot" />
            Free &amp; fast URL shortener
          </div>
          <h1>
            Make every link{" "}
            <span className="gradient-text">shorter & smarter</span>
          </h1>
          <p>
            Transform long, messy URLs into clean, compact links you can share
            anywhere. Track clicks and manage all your links in one place.
          </p>
        </section>

        <ShortenForm onResult={handleResult} />

        {results.length > 0 && (
          <div
            style={{
              maxWidth: 680,
              margin: "0 auto",
              padding: "0 1.5rem",
            }}
          >
            {results.map((r, i) => (
              <LinkResult key={`${r.shortCode}-${i}`} data={r} />
            ))}
          </div>
        )}

        {/* Features Section */}
        <section
          style={{
            maxWidth: 900,
            margin: "5rem auto 3rem",
            padding: "0 1.5rem",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {[
            {
              icon: "⚡",
              title: "Lightning Fast",
              desc: "Redirects in under 100ms with intelligent caching",
            },
            {
              icon: "📊",
              title: "Click Analytics",
              desc: "Track clicks, referrers, and geographic data in real time",
            },
            {
              icon: "🔗",
              title: "Custom Aliases",
              desc: "Create memorable, branded short links with custom slugs",
            },
            {
              icon: "⏰",
              title: "Auto Expiry",
              desc: "Links expire after 30 days by default — extend anytime",
            },
            {
              icon: "🛡️",
              title: "Safe & Secure",
              desc: "URL validation and abuse detection keep your links safe",
            },
            {
              icon: "📱",
              title: "Fully Responsive",
              desc: "Works beautifully on desktop, tablet, and mobile",
            },
          ].map((f) => (
            <div
              key={f.title}
              style={{
                padding: "1.5rem",
                borderRadius: "var(--radius-lg)",
                background: "var(--bg-card)",
                border: "1px solid var(--glass-border)",
                transition: "all 0.3s",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent-start)";
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--glass-border)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>
                {f.icon}
              </div>
              <h3
                style={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  marginBottom: "0.375rem",
                }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--text-muted)",
                  lineHeight: 1.5,
                }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
