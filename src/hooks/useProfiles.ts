import { useState, useEffect, useCallback } from "react";
import type { ProfileDefinition, ProfileStatus } from "@/lib/types";
import { getProfiles, getProfileStatus } from "@/lib/tauri";

export function useProfiles() {
  const [profiles, setProfiles] = useState<ProfileDefinition[]>([]);
  const [statuses, setStatuses] = useState<ProfileStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfiles = useCallback(async () => {
    try {
      const [p, s] = await Promise.all([getProfiles(), getProfileStatus()]);
      setProfiles(p);
      setStatuses(s);
    } catch (e) {
      console.error("Failed to fetch profiles:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  return { profiles, statuses, loading, refresh: fetchProfiles };
}
