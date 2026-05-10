import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { cache } from "@/lib/cache";
import { isValidAlias } from "@/lib/shortcode";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const db = await getDb();
    const result = await db.query("SELECT * FROM links WHERE id = $1", [id]);
    const link = result.rows[0];

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    return NextResponse.json({ link });
  } catch (error) {
    console.error("Get link error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const db = await getDb();
    const body = await request.json();
    const { customAlias, expiresAt, isActive } = body;

    const linkResult = await db.query("SELECT * FROM links WHERE id = $1", [id]);
    const link = linkResult.rows[0];
    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    // Update custom alias if provided
    if (customAlias !== undefined) {
      if (!isValidAlias(customAlias)) {
        return NextResponse.json(
          { error: "Invalid alias format" },
          { status: 400 }
        );
      }
      const existing = await db.query(
        "SELECT id FROM links WHERE short_code = $1 AND id != $2",
        [customAlias, id]
      );
      if (existing.rows[0]) {
        return NextResponse.json(
          { error: "Alias already taken" },
          { status: 409 }
        );
      }

      // Invalidate old cache entry
      cache.invalidate(link.short_code);

      await db.query(
        "UPDATE links SET short_code = $1, custom_alias = $2 WHERE id = $3",
        [customAlias, customAlias, id]
      );
    }

    if (expiresAt !== undefined) {
      await db.query("UPDATE links SET expires_at = $1 WHERE id = $2", [
        expiresAt,
        id,
      ]);
    }

    if (isActive !== undefined) {
      await db.query("UPDATE links SET is_active = $1 WHERE id = $2", [
        isActive ? 1 : 0,
        id,
      ]);
      if (!isActive) {
        cache.invalidate(link.short_code);
      }
    }

    const updatedResult = await db.query("SELECT * FROM links WHERE id = $1", [id]);
    return NextResponse.json({ link: updatedResult.rows[0] });
  } catch (error) {
    console.error("Update link error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const db = await getDb();

    const result = await db.query("SELECT * FROM links WHERE id = $1", [id]);
    const link = result.rows[0];
    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    // Invalidate cache
    cache.invalidate(link.short_code);

    // Delete link and its clicks (CASCADE)
    await db.query("DELETE FROM links WHERE id = $1", [id]);

    return NextResponse.json({ message: "Link deleted successfully" });
  } catch (error) {
    console.error("Delete link error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
