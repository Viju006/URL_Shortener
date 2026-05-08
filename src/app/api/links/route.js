import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * limit;

    let links, total;

    if (search) {
      links = db
        .prepare(
          `SELECT * FROM links
           WHERE (original_url LIKE ? OR short_code LIKE ? OR custom_alias LIKE ?)
           ORDER BY created_at DESC LIMIT ? OFFSET ?`
        )
        .all(`%${search}%`, `%${search}%`, `%${search}%`, limit, offset);
      total = db
        .prepare(
          `SELECT COUNT(*) as count FROM links
           WHERE (original_url LIKE ? OR short_code LIKE ? OR custom_alias LIKE ?)`
        )
        .get(`%${search}%`, `%${search}%`, `%${search}%`).count;
    } else {
      links = db
        .prepare("SELECT * FROM links ORDER BY created_at DESC LIMIT ? OFFSET ?")
        .all(limit, offset);
      total = db.prepare("SELECT COUNT(*) as count FROM links").get().count;
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
