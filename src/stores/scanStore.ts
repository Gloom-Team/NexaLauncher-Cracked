import { create } from "zustand";
import type { ScanResult, ScanFinding } from "../lib/types";
import {
  runSystemScan,
  getSystemFindings,
  getPerformanceBottleneck,
} from "../lib/tauri";

interface ScanStore {
  scanResult: ScanResult | null;
  findings: ScanFinding[];
  bottleneck: string;
  scanning: boolean;
  runScan: () => Promise<void>;
  fetchFindings: () => Promise<void>;
  fetchBottleneck: () => Promise<void>;
}

export const useScanStore = create<ScanStore>((set) => ({
  scanResult: null,
  findings: [],
  bottleneck: "",
  scanning: false,

  runScan: async () => {
    set({ scanning: true });
    try {
      const result = await runSystemScan();
      set({ scanResult: result });
    } finally {
      set({ scanning: false });
    }
  },

  fetchFindings: async () => {
    const findings = await getSystemFindings();
    set({ findings });
  },

  fetchBottleneck: async () => {
    const bottleneck = await getPerformanceBottleneck();
    set({ bottleneck });
  },
}));
