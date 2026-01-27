import "dotenv/config";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("Missing DATABASE_URL");

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

async function main() {
  const r = await sql`select now() as now`;
  console.log(r);
  await sql.end({ timeout: 5 });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
