import { NextResponse } from "next/server";

// MVP: hardcode allowed enums here.
// Next step: load from lib/policies/*.json to keep it centralized.
const content_labels = ["Rumor", "Opinion", "Claim", "Question", "Announcement"] as const;
const market_categories = ["Stocks", "Crypto", "FX", "Commodities", "Macro", "Multi-market"] as const;

// You can expand this to the full whitelist you already defined.
const topics = [
  "Earnings",
  "Financial Results",
  "Corporate Announcement",
  "Management Change",
  "Layoffs",
  "Restructuring",
  "Bankruptcy Filing",
  "Merger",
  "Acquisition",
  "Lawsuit",
  "Investigation",
  "Hack",
  "Exploit",
  "Security Incident",
  "Network Outage",
  "Fork",
  "Token Issuance",
  "Token Burn",
  "Stablecoin Event",
  "Exchange Incident",
  "Regulation",
  "Court Ruling",
  "Policy Statement",
  "Listing",
  "Delisting",
] as const;

const flags = [
  "Unverified",
  "User-generated",
  "Automated collection",
  "Forward-looking claim present",
  "Numeric claim present",
  "Extreme statement",
] as const;

export async function GET() {
  return NextResponse.json({
    content_labels,
    market_categories,
    topics,
    flags,
  });
}
