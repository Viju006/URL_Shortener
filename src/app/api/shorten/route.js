import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { generateShortCode, isValidAlias } from "@/lib/shortcode";
import { isValidUrl, normalizeUrl } from "@/lib/validators";
import { cache } from "@/lib/cache";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request) {
  try {
    // Rate limiting
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";
    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Try again later.",
          retryAfter: rateCheck.retryAfter,
        },
        {
          status: 429,
          headers: { "Retry-After": String(rateCheck.retryAfter) },
        }
      );
    }

    const body = await request.json();
    const { url, customAlias, expiresAt } = body;

    // Validate URL (FR-03)
    if (!isValidUrl(url)) {
      return NextResponse.json(
        {
          error:
            "Invalid URL. Please provide a valid URL starting with http:// or https://",
        },
        { status: 400 }
      );
    }

    const normalizedUrl = normalizeUrl(url);
    const db = getDb();

    // If custom alias provided, validate it (FR-04)
    let shortCode;
    if (customAlias) {
      if (!isValidAlias(customAlias)) {
        return NextResponse.json(
          {
            error:
              "Invalid alias. Use 3-30 characters: letters, numbers, hyphens, underscores.",
          },
          { status: 400 }
        );
      }

      // Check if alias already exists
      const existing = db
        .prepare("SELECT id FROM links WHERE short_code = ?")
        .get(customAlias);
      if (existing) {
        return NextResponse.json(
          { error: "This alias is already taken. Please choose another." },
          { status: 409 }
        );
      }
      shortCode = customAlias;
    }

    // Calculate expiry (30-day default for anonymous links)
    let expiryDate = expiresAt || null;
    if (!expiryDate) {
      const thirtyDays = new Date();
      thirtyDays.setDate(thirtyDays.getDate() + 30);
      expiryDate = thirtyDays.toISOString();
    }

    // Insert link
    const result = db
      .prepare(
        `INSERT INTO links (short_code, original_url, custom_alias, expires_at)
       VALUES (?, ?, ?, ?)`
      )
      .run(
        shortCode || "placeholder",
        normalizedUrl,
        customAlias || null,
        expiryDate
      );

    // If no custom alias, generate short code from ID (FR-01)
    if (!shortCode) {
      shortCode = generateShortCode(result.lastInsertRowid);
      db.prepare("UPDATE links SET short_code = ? WHERE id = ?").run(
        shortCode,
        result.lastInsertRowid
      );
    }

    // Populate cache
    cache.set(shortCode, normalizedUrl);

    const baseUrl =
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      "localhost:3000";
    const protocol = request.headers.get("x-forwarded-proto") || "http";

    return NextResponse.json(
      {
        shortCode,
        shortUrl: `${protocol}://${baseUrl}/${shortCode}`,
        originalUrl: normalizedUrl,
        expiresAt: expiryDate,
        createdAt: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Shorten error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
