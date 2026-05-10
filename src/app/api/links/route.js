import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * limit;

    let links, total;

    if (search) {
      const searchPattern = `%${search}%`;
      const linksResult = await db.query(
        `SELECT * FROM links
         WHERE (original_url LIKE $1 OR short_code LIKE $2 OR custom_alias LIKE $3)
         ORDER BY created_at DESC LIMIT $4 OFFSET $5`,
        [searchPattern, searchPattern, searchPattern, limit, offset]
      );
      links = linksResult.rows;

      const totalResult = await db.query(
        `SELECT COUNT(*) as count FROM links
         WHERE (original_url LIKE $1 OR short_code LIKE $2 OR custom_alias LIKE $3)`,
        [searchPattern, searchPattern, searchPattern]
      );
      total = parseInt(totalResult.rows[0].count, 10);
    } else {
      const linksResult = await db.query(
        "SELECT * FROM links ORDER BY created_at DESC LIMIT $1 OFFSET $2",
        [limit, offset]
      );
      links = linksResult.rows;

      const totalResult = await db.query("SELECT COUNT(*) as count FROM links");
      total = parseInt(totalResult.rows[0].count, 10);
    }

    return NextResponse.json({
      links,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("List links error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
