import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const { code } = await params;
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30", 10);

    // Find the link by short code
    const link = db
      .prepare("SELECT * FROM links WHERE short_code = ?")
      .get(code);

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    // Total clicks
    const totalClicks = db
      .prepare("SELECT COUNT(*) as count FROM clicks WHERE link_id = ?")
      .get(link.id).count;

    // Clicks by day (last N days)
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);
    const clicksByDay = db
      .prepare(
        `SELECT DATE(clicked_at) as date, COUNT(*) as clicks
         FROM clicks
         WHERE link_id = ? AND clicked_at >= ?
         GROUP BY DATE(clicked_at)
         ORDER BY date ASC`
      )
      .all(link.id, sinceDate.toISOString());

    // Top referrers
    const topReferrers = db
      .prepare(
        `SELECT referrer, COUNT(*) as clicks
         FROM clicks
         WHERE link_id = ? AND referrer IS NOT NULL AND referrer != ''
         GROUP BY referrer
         ORDER BY clicks DESC
         LIMIT 10`
      )
      .all(link.id);

    // Top countries
    const topCountries = db
      .prepare(
        `SELECT country, COUNT(*) as clicks
         FROM clicks
         WHERE link_id = ? AND country IS NOT NULL AND country != ''
         GROUP BY country
         ORDER BY clicks DESC
         LIMIT 10`
      )
      .all(link.id);

    // Fill in missing days with 0 clicks
    const dailyData = [];
    const dateMap = new Map(clicksByDay.map((d) => [d.date, d.clicks]));
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      dailyData.push({
        date: dateStr,
        clicks: dateMap.get(dateStr) || 0,
      });
    }

    return NextResponse.json({
      link,
      analytics: {
        totalClicks,
        clicksByDay: dailyData,
        topReferrers,
        topCountries,
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
