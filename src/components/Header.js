"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="header">
      <Link href="/" className="logo">
        <span className="logo-icon">✂</span>
        Snip
      </Link>
      <nav className="nav-links">
        <Link
          href="/"
          className={`nav-link ${pathname === "/" ? "active" : ""}`}
        >
          Shorten
        </Link>
        <Link
          href="/dashboard"
          className={`nav-link ${pathname === "/dashboard" ? "active" : ""}`}
        >
          Dashboard
        </Link>
      </nav>
    </header>
  );
}
