import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const rows = await sql<{ name: string; source_type: string }[]>`
    SELECT name, source_type
    FROM sources
    WHERE is_enabled = true
    ORDER BY name ASC
  `;

  return NextResponse.json({
    sources: rows.map((r) => ({ name: r.name, type: r.source_type })),
  });
}
