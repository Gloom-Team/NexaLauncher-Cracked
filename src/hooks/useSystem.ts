import { useState, useEffect, useCallback } from "react";
import type { SystemInfoData, ProcessInfo } from "@/lib/types";
import { getSystemInfo, getProcesses } from "@/lib/tauri";

export function useSystemInfo() {
  const [info, setInfo] = useState<SystemInfoData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const data = await getSystemInfo();
      setInfo(data);
    } catch (e) {
      console.error("Failed to fetch system info:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { info, loading, refresh: fetch };
}

export function useProcesses() {
  const [procs, setProcs] = useState<ProcessInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const data = await getProcesses();
      setProcs(data);
    } catch (e) {
      console.error("Failed to fetch processes:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { processes: procs, loading, refresh: fetch };
}
