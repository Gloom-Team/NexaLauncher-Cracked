import { useState, useEffect, useCallback } from "react";
import type { TweakDefinition, TweakStatus } from "@/lib/types";
import { getAllTweaks, getTweakStatus } from "@/lib/tauri";

export function useTweaks() {
  const [tweaks, setTweaks] = useState<TweakDefinition[]>([]);
  const [statuses, setStatuses] = useState<TweakStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTweaks = useCallback(async () => {
    try {
      const [t, s] = await Promise.all([getAllTweaks(), getTweakStatus()]);
      setTweaks(t);
      setStatuses(s);
    } catch (e) {
      console.error("Failed to fetch tweaks:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTweaks();
  }, [fetchTweaks]);

  const statusMap: Record<string, boolean> = {};
  for (const s of statuses) {
    statusMap[s.tweak_id] = s.applied;
  }

  return { tweaks, statusMap, loading, refresh: fetchTweaks };
}
