import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { cache } from "@/lib/cache";

export async function GET(request, { params }) {
  try {
    const { code } = await params;
    const db = await getDb();

    // 1. Check cache first (hot path)
    const cachedUrl = cache.get(code);
    if (cachedUrl) {
      // Log click asynchronously
      logClick(db, code, request);
      return NextResponse.redirect(cachedUrl, 302);
    }

    // 2. Cache miss → check database
    const result = await db.query(
      "SELECT * FROM links WHERE short_code = $1 AND is_active = 1",
      [code]
    );
    const link = result.rows[0];

    if (!link) {
      // Return a nice 404 page
      return new NextResponse(get404Html(code), {
        status: 404,
        headers: { "Content-Type": "text/html" },
      });
    }

    // 3. Check expiry → 410 Gone (FR-05)
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return new NextResponse(get410Html(), {
        status: 410,
        headers: { "Content-Type": "text/html" },
      });
    }

    // 4. Populate cache for future requests
    cache.set(link.short_code, link.original_url);

    // 5. Log click asynchronously
    logClick(db, code, request);

    // 6. Redirect (302 by default per PRD)
    return NextResponse.redirect(link.original_url, 302);
  } catch (error) {
    console.error("Redirect error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function logClick(db, code, request) {
  try {
    const result = await db.query(
      "SELECT id FROM links WHERE short_code = $1",
      [code]
    );
    const link = result.rows[0];
    if (!link) return;

    const referrer = request.headers.get("referer") || "";
    const userAgent = request.headers.get("user-agent") || "";
    // Country would come from a GeoIP service; using placeholder for now
    const country = request.headers.get("cf-ipcountry") || "Unknown";

    await db.query(
      `INSERT INTO clicks (link_id, referrer, country, user_agent) VALUES ($1, $2, $3, $4)`,
      [link.id, referrer, country, userAgent]
    );

    // Update click count
    await db.query(
      "UPDATE links SET click_count = click_count + 1 WHERE id = $1",
      [link.id]
    );
  } catch (err) {
    console.error("Click logging error:", err);
  }
}

function get404Html(code) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Link Not Found — Snip</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: #0a0a0f; color: #e4e4e7; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .container { text-align: center; max-width: 480px; padding: 2rem; }
    .code { font-size: 6rem; font-weight: 700; background: linear-gradient(135deg, #7c3aed, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    h1 { font-size: 1.5rem; margin: 1rem 0 0.5rem; font-weight: 600; }
    p { color: #71717a; margin-bottom: 2rem; }
    a { display: inline-block; padding: 0.75rem 2rem; background: linear-gradient(135deg, #7c3aed, #3b82f6); color: white; text-decoration: none; border-radius: 12px; font-weight: 500; transition: transform 0.2s, box-shadow 0.2s; }
    a:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(124, 58, 237, 0.3); }
  </style>
</head>
<body>
  <div class="container">
    <div class="code">404</div>
    <h1>Link not found</h1>
    <p>The short link <strong>/${code}</strong> doesn't exist or has been deleted.</p>
    <a href="/">Create a new link</a>
  </div>
</body>
</html>`;
}

function get410Html() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Link Expired — Snip</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: #0a0a0f; color: #e4e4e7; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .container { text-align: center; max-width: 480px; padding: 2rem; }
    .code { font-size: 6rem; font-weight: 700; background: linear-gradient(135deg, #f97316, #ef4444); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    h1 { font-size: 1.5rem; margin: 1rem 0 0.5rem; font-weight: 600; }
    p { color: #71717a; margin-bottom: 2rem; }
    a { display: inline-block; padding: 0.75rem 2rem; background: linear-gradient(135deg, #7c3aed, #3b82f6); color: white; text-decoration: none; border-radius: 12px; font-weight: 500; transition: transform 0.2s, box-shadow 0.2s; }
    a:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(124, 58, 237, 0.3); }
  </style>
</head>
<body>
  <div class="container">
    <div class="code">410</div>
    <h1>Link expired</h1>
    <p>This short link has expired and is no longer active.</p>
    <a href="/">Create a new link</a>
  </div>
</body>
</html>`;
}
