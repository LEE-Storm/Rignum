"use client";

import { useState } from "react";
import { DisclaimerBanner } from "@/components/Layout/DisclaimerBanner";
import { Filters, type FeedFilters } from "@/components/Feed/Filters";
import { FeedList } from "@/components/Feed/FeedList";

export default function HomePage() {
  const [filters, setFilters] = useState<FeedFilters>({
    q: "",
    source: "All",
    market: "All",
    label: "All",
    flag: "All",
    topic: "All",
  });

  return (
    <main className="mx-auto max-w-6xl p-4 space-y-4">
    

      <DisclaimerBanner />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        <div className="md:col-span-4">
          <Filters onChange={setFilters} />
        </div>
        <div className="md:col-span-8">
          <FeedList filters={filters} />
        </div>
      </div>

      <footer className="text-xs text-gray-500 border-t pt-4">
        External sources • Content not hosted • Automated collection • Unverified • No advice • No recommendations
      </footer>
    </main>
  );
}
