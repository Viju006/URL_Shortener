import "./globals.css";

export const metadata = {
  title: "Snip — URL Shortener",
  description:
    "Transform long URLs into compact, shareable links. Track clicks, manage links, and view analytics — all in one place.",
  keywords: "url shortener, link shortener, short link, analytics",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="bg-mesh" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
