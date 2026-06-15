"use client";

import { useEffect, useState } from "react";

export function LocalTime({ date, fallback = "N/A" }: { date: string | Date | null, fallback?: string }) {
  const [formatted, setFormatted] = useState<string>("");

  useEffect(() => {
    if (date) {
      setFormatted(new Date(date).toLocaleString());
    }
  }, [date]);

  if (!date) return <>{fallback}</>;
  
  // During SSR or before mount, return an empty string or a placeholder
  // to avoid hydration mismatches, then swap to local time.
  return <span suppressHydrationWarning>{formatted || new Date(date).toLocaleString("en-US", { timeZone: "UTC" }) + " (UTC)"}</span>;
}
