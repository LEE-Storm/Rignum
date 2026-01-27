import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

function clampInt(v: string | null, def: number, min: number, max: number) {
  const n = v ? Number.parseInt(v, 10) : def;
  if (Number.isNaN(n)) return def;
  return Math.max(min, Math.min(max, n));
}

// Simple helper to build WHERE safely
type Where = { sql: any[]; values: any[] };
function and(where: Where, clause: any, ...vals: any[]) {
  where.sql.push(clause);
  where.values.push(...vals);
  return where;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const q = (searchParams.get("q") || "").trim();
  const source = (searchParams.get("source") || "").trim(); // source name
  const market = (searchParams.get("market") || "").trim();
  const label = (searchParams.get("label") || "").trim();
  const flag = (searchParams.get("flag") || "").trim();
  const topic = (searchParams.get("topic") || "").trim();
  const limit = clampInt(searchParams.get("limit"), 50, 1, 100);

  // Base filters: 24h retention + safe visibility
  // visibility_level IN (0,1) only
  const whereParts: string[] = [
    "i.expires_at > now()",
    "i.status = 'PUBLISHED'",
    "i.visibility_level IN (0,1)",
    "i.is_hidden = false",
  ];
  const values: any[] = [];

  // Filters
  if (source) {
    whereParts.push("s.name = $" + (values.length + 1));
    values.push(source);
  }
  if (market) {
    whereParts.push("i.market_category = $" + (values.length + 1));
    values.push(market);
  }
  if (label) {
    whereParts.push("i.content_label = $" + (values.length + 1));
    values.push(label);
  }
  if (flag) {
    whereParts.push("i.flags @> ARRAY[$" + (values.length + 1) + "]::text[]");
    values.push(flag);
  }
  if (topic) {
    whereParts.push("i.topics @> ARRAY[$" + (values.length + 1) + "]::text[]");
    values.push(topic);
  }

  // "q" search: lightweight, metadata-only.
  // We match against entities JSONB text representation (MVP),
  // and also against market/category/label/source name.
  // Later we can optimize using dedicated columns or trigram.
  if (q) {
    whereParts.push(
      "(" +
        [
          "s.name ILIKE $" + (values.length + 1),
          "i.market_category ILIKE $" + (values.length + 1),
          "i.content_label ILIKE $" + (values.length + 1),
          "i.entities::text ILIKE $" + (values.length + 1),
          "i.topics::text ILIKE $" + (values.length + 1),
        ].join(" OR ") +
        ")"
    );
    values.push(`%${q}%`);
  }

  const whereSQL = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";

const query = `
  SELECT
    i.id,
    i.captured_at,
    i.expires_at,
    i.external_url,
    i.content_label,
    i.market_category,
    i.visibility_level,
    i.entities,
    i.topics,
    i.flags,
    s.name as source_name,
    s.source_type as source_type
  FROM items i
  JOIN sources s ON s.id = i.source_id
  ${whereSQL}
  ORDER BY i.captured_at DESC
  LIMIT ${limit}
`;

const rows = await sql.unsafe(query, values) as {
  id: string;
  captured_at: string;
  expires_at: string;
  external_url: string;
  content_label: string;
  market_category: string;
  visibility_level: number;
  entities: any;
  topics: string[];
  flags: string[];
  source_name: string;
  source_type: string;
}[];


  return NextResponse.json({
    items: rows.map((r) => ({
      id: r.id,
      captured_at: r.captured_at,
      expires_at: r.expires_at,
      source: { name: r.source_name, type: r.source_type },
      external_url: r.external_url,
      content_label: r.content_label,
      market_category: r.market_category,
      visibility_level: r.visibility_level,
      entities: r.entities,
      topics: r.topics ?? [],
      flags: r.flags ?? [],
    })),
    meta: { count: rows.length },
  });
}
