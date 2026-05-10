import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const { code } = await params;
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30", 10);

    // Find the link by short code
    const linkResult = await db.query(
      "SELECT * FROM links WHERE short_code = $1",
      [code]
    );
    const link = linkResult.rows[0];

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    // Total clicks
    const totalResult = await db.query(
      "SELECT COUNT(*) as count FROM clicks WHERE link_id = $1",
      [link.id]
    );
    const totalClicks = parseInt(totalResult.rows[0].count, 10);

    // Clicks by day (last N days)
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);
    const clicksByDayResult = await db.query(
      `SELECT clicked_at::date as date, COUNT(*) as clicks
       FROM clicks
       WHERE link_id = $1 AND clicked_at >= $2
       GROUP BY clicked_at::date
       ORDER BY date ASC`,
      [link.id, sinceDate.toISOString()]
    );
    const clicksByDay = clicksByDayResult.rows;

    // Top referrers
    const referrersResult = await db.query(
      `SELECT referrer, COUNT(*) as clicks
       FROM clicks
       WHERE link_id = $1 AND referrer IS NOT NULL AND referrer != ''
       GROUP BY referrer
       ORDER BY clicks DESC
       LIMIT 10`,
      [link.id]
    );
    const topReferrers = referrersResult.rows;

    // Top countries
    const countriesResult = await db.query(
      `SELECT country, COUNT(*) as clicks
       FROM clicks
       WHERE link_id = $1 AND country IS NOT NULL AND country != ''
       GROUP BY country
       ORDER BY clicks DESC
       LIMIT 10`,
      [link.id]
    );
    const topCountries = countriesResult.rows;

    // Fill in missing days with 0 clicks
    const dailyData = [];
    const dateMap = new Map(
      clicksByDay.map((d) => [
        new Date(d.date).toISOString().split("T")[0],
        parseInt(d.clicks, 10),
      ])
    );
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
