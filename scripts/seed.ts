import postgres from "postgres";
import crypto from "crypto";
import "dotenv/config";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("Missing DATABASE_URL in environment.");
}

const sql = postgres(DATABASE_URL, {
  max: 1,
  connect_timeout: 10,
  idle_timeout: 10,
  family: 4,
} as any);

function sha256hex(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

type SeedSource = {
  name: string;
  source_type: "Forum" | "Chat Platform" | "Social Network" | "News Website" | "Blog" | "Other";
  base_url?: string;
};

type SeedItem = {
  source_name: string;
  external_url: string;
  content_label: "Rumor" | "Opinion" | "Claim" | "Question" | "Announcement";
  market_category: "Stocks" | "Crypto" | "FX" | "Commodities" | "Macro" | "Multi-market";
  topics: string[];
  flags: string[];
  entities: Record<string, string[]>;
  risk_signals: Record<string, boolean>;
  visibility_level: 0 | 1 | 2 | 3;
};

const SOURCES: SeedSource[] = [
  { name: "Reddit", source_type: "Forum", base_url: "https://www.reddit.com" },
  { name: "X", source_type: "Social Network", base_url: "https://x.com" },
  { name: "Telegram", source_type: "Chat Platform" },
  { name: "Discord", source_type: "Chat Platform" },
  { name: "Hacker News", source_type: "Forum", base_url: "https://news.ycombinator.com" },
];

const ITEMS: SeedItem[] = [
  {
    source_name: "Reddit",
    external_url: "https://www.reddit.com/r/stocks/comments/example1",
    content_label: "Rumor",
    market_category: "Stocks",
    topics: ["Earnings", "Corporate Announcement"],
    flags: ["Unverified", "User-generated", "Automated collection", "Forward-looking claim present"],
    entities: { companies: ["Microsoft"], tickers: ["MSFT"], cryptocurrencies: [], protocols: [], exchanges: [] },
    risk_signals: {
      blacklist_terms_detected: false,
      manipulative_language_detected: false,
      call_to_action_detected: false,
      personal_data_detected: false,
    },
    visibility_level: 0,
  },
  {
    source_name: "X",
    external_url: "https://x.com/example/status/111111",
    content_label: "Claim",
    market_category: "Crypto",
    topics: ["Hack", "Security Incident"],
    flags: ["Unverified", "User-generated", "Automated collection", "Numeric claim present", "Extreme statement"],
    entities: { companies: [], tickers: [], cryptocurrencies: ["ETH"], protocols: ["Ethereum"], exchanges: [] },
    risk_signals: {
      blacklist_terms_detected: false,
      manipulative_language_detected: true,
      call_to_action_detected: false,
      personal_data_detected: false,
    },
    visibility_level: 1, // limited display
  },
  {
    source_name: "Telegram",
    external_url: "https://t.me/example/2222",
    content_label: "Opinion",
    market_category: "FX",
    topics: ["Central Bank Statement"],
    flags: ["Unverified", "User-generated", "Automated collection"],
    entities: { companies: [], tickers: [], cryptocurrencies: [], protocols: [], exchanges: [] },
    risk_signals: {
      blacklist_terms_detected: false,
      manipulative_language_detected: false,
      call_to_action_detected: false,
      personal_data_detected: false,
    },
    visibility_level: 0,
  },
  {
    source_name: "Discord",
    external_url: "https://discord.com/channels/example/3333",
    content_label: "Question",
    market_category: "Stocks",
    topics: ["Lawsuit", "Investigation"],
    flags: ["Unverified", "User-generated", "Automated collection"],
    entities: { companies: ["Tesla"], tickers: ["TSLA"], cryptocurrencies: [], protocols: [], exchanges: [] },
    risk_signals: {
      blacklist_terms_detected: false,
      manipulative_language_detected: false,
      call_to_action_detected: false,
      personal_data_detected: false,
    },
    visibility_level: 0,
  },
  {
    source_name: "Hacker News",
    external_url: "https://news.ycombinator.com/item?id=444444",
    content_label: "Announcement",
    market_category: "Multi-market",
    topics: ["Regulation", "Policy Statement"],
    flags: ["Unverified", "Automated collection"],
    entities: { companies: [], tickers: [], cryptocurrencies: [], protocols: [], exchanges: [] },
    risk_signals: {
      blacklist_terms_detected: false,
      manipulative_language_detected: false,
      call_to_action_detected: false,
      personal_data_detected: false,
    },
    visibility_level: 0,
  },
];

// Add more items quickly (simple variations)
function generateMoreItems(): SeedItem[] {
  const base: SeedItem[] = [];
  const companies = [
    { name: "NVIDIA", ticker: "NVDA" },
    { name: "Apple", ticker: "AAPL" },
    { name: "Amazon", ticker: "AMZN" },
    { name: "Meta", ticker: "META" },
  ];
  const cryptos = ["BTC", "SOL", "XRP"];
  const topicsPool = [
    ["Earnings"],
    ["Regulation"],
    ["Exchange Incident"],
    ["Network Outage"],
    ["Listing"],
    ["Delisting"],
    ["Lawsuit"],
  ];

  for (let i = 0; i < 12; i++) {
    const c = companies[i % companies.length];
    const t = topicsPool[i % topicsPool.length];
    base.push({
      source_name: SOURCES[i % SOURCES.length].name,
      external_url: `https://example.com/source/${i}`,
      content_label: (["Rumor", "Opinion", "Claim", "Question", "Announcement"] as const)[i % 5],
      market_category: (i % 3 === 0 ? "Stocks" : i % 3 === 1 ? "Crypto" : "Macro"),
      topics: t,
      flags: ["Unverified", "User-generated", "Automated collection"],
      entities:
        i % 3 === 0
          ? { companies: [c.name], tickers: [c.ticker], cryptocurrencies: [], protocols: [], exchanges: [] }
          : i % 3 === 1
          ? { companies: [], tickers: [], cryptocurrencies: [cryptos[i % cryptos.length]], protocols: [], exchanges: [] }
          : { companies: [], tickers: [], cryptocurrencies: [], protocols: [], exchanges: [] },
      risk_signals: {
        blacklist_terms_detected: false,
        manipulative_language_detected: false,
        call_to_action_detected: false,
        personal_data_detected: false,
      },
      visibility_level: 0,
    });
  }
  return base;
}

async function upsertSources() {
  for (const s of SOURCES) {
    await sql`
      INSERT INTO sources (name, source_type, base_url)
      VALUES (${s.name}, ${s.source_type}, ${s.base_url ?? null})
      ON CONFLICT (name) DO UPDATE
        SET source_type = EXCLUDED.source_type,
            base_url = EXCLUDED.base_url,
            is_enabled = TRUE
    `;
  }
}

async function getSourceIdByName(): Promise<Record<string, string>> {
  const rows = await sql<{ id: string; name: string }[]>`
    SELECT id, name FROM sources
  `;
  return Object.fromEntries(rows.map((r) => [r.name, r.id]));
}

async function insertItems(sourceIds: Record<string, string>, items: SeedItem[]) {
  for (const it of items) {
    const source_id = sourceIds[it.source_name];
    if (!source_id) throw new Error(`Missing source_id for source ${it.source_name}`);

    const url_hash = sha256hex(it.external_url);
    const now = new Date();
    const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    await sql`
      INSERT INTO items (
        source_id, external_url, external_url_hash,
        captured_at, expires_at,
        content_label, market_category,
        visibility_level, is_hidden,
        entities, topics, flags, risk_signals,
        status
      )
      VALUES (
        ${source_id}, ${it.external_url}, ${url_hash},
        ${now.toISOString()}, ${expires.toISOString()},
        ${it.content_label}, ${it.market_category},
        ${it.visibility_level}, ${it.visibility_level >= 2},
        ${sql.json(it.entities)}, ${it.topics}, ${it.flags}, ${sql.json(it.risk_signals)},
        'PUBLISHED'
      )
      ON CONFLICT (external_url_hash) DO NOTHING
    `;
  }
}

async function main() {
  try {
    console.log("Seeding sources...");
    await upsertSources();

    const sourceIds = await getSourceIdByName();

    const allItems = [...ITEMS, ...generateMoreItems()];
    console.log(`Seeding items: ${allItems.length}...`);
    await insertItems(sourceIds, allItems);

    console.log("Done.");
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
