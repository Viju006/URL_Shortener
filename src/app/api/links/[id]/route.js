import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { cache } from "@/lib/cache";
import { isValidAlias } from "@/lib/shortcode";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const db = getDb();
    const link = db.prepare("SELECT * FROM links WHERE id = ?").get(id);

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
    const db = getDb();
    const body = await request.json();
    const { customAlias, expiresAt, isActive } = body;

    const link = db.prepare("SELECT * FROM links WHERE id = ?").get(id);
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
      const existing = db
        .prepare("SELECT id FROM links WHERE short_code = ? AND id != ?")
        .get(customAlias, id);
      if (existing) {
        return NextResponse.json(
          { error: "Alias already taken" },
          { status: 409 }
        );
      }

      // Invalidate old cache entry
      cache.invalidate(link.short_code);

      db.prepare("UPDATE links SET short_code = ?, custom_alias = ? WHERE id = ?").run(
        customAlias,
        customAlias,
        id
      );
    }

    if (expiresAt !== undefined) {
      db.prepare("UPDATE links SET expires_at = ? WHERE id = ?").run(
        expiresAt,
        id
      );
    }

    if (isActive !== undefined) {
      db.prepare("UPDATE links SET is_active = ? WHERE id = ?").run(
        isActive ? 1 : 0,
        id
      );
      if (!isActive) {
        cache.invalidate(link.short_code);
      }
    }

    const updated = db.prepare("SELECT * FROM links WHERE id = ?").get(id);
    return NextResponse.json({ link: updated });
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
    const db = getDb();

    const link = db.prepare("SELECT * FROM links WHERE id = ?").get(id);
    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    // Invalidate cache
    cache.invalidate(link.short_code);

    // Delete link and its clicks (CASCADE)
    db.prepare("DELETE FROM links WHERE id = ?").run(id);

    return NextResponse.json({ message: "Link deleted successfully" });
  } catch (error) {
    console.error("Delete link error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
