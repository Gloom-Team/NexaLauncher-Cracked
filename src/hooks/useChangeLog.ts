import { useState, useEffect, useCallback } from "react";
import type { ChangeEntry } from "@/lib/types";
import { getChangeLog } from "@/lib/tauri";

export function useChangeLog() {
  const [entries, setEntries] = useState<ChangeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const data = await getChangeLog();
      setEntries(data);
    } catch (e) {
      console.error("Failed to fetch change log:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { entries, loading, refresh: fetch };
}
