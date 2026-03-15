import { create } from "zustand";
import type { SystemInfoData, ProcessInfo, SystemSnapshot, HardwareInfo } from "../lib/types";
import {
  getSystemInfo,
  getProcesses,
  getSnapshots,
  takeSnapshot,
  getHardwareInfo as apiGetHardwareInfo,
} from "../lib/tauri";

interface SystemStore {
  systemInfo: SystemInfoData | null;
  hardwareInfo: HardwareInfo | null;
  processes: ProcessInfo[];
  snapshots: SystemSnapshot[];
  loading: boolean;
  fetchSystemInfo: () => Promise<void>;
  fetchHardwareInfo: () => Promise<void>;
  fetchProcesses: () => Promise<void>;
  fetchSnapshots: () => Promise<void>;
  takeSnapshot: (label: string) => Promise<SystemSnapshot>;
}

export const useSystemStore = create<SystemStore>((set) => ({
  systemInfo: null,
  hardwareInfo: null,
  processes: [],
  snapshots: [],
  loading: false,

  fetchSystemInfo: async () => {
    set({ loading: true });
    try {
      const info = await getSystemInfo();
      set({ systemInfo: info });
    } finally {
      set({ loading: false });
    }
  },

  fetchHardwareInfo: async () => {
    try {
      const hw = await apiGetHardwareInfo();
      set({ hardwareInfo: hw });
    } catch {
      // Hardware info may fail on some systems
    }
  },

  fetchProcesses: async () => {
    const procs = await getProcesses();
    set({ processes: procs });
  },

  fetchSnapshots: async () => {
    try {
      const snaps = await getSnapshots();
      set({ snapshots: snaps });
    } catch {
      set({ snapshots: [] });
    }
  },

  takeSnapshot: async (label: string) => {
    const snap = await takeSnapshot(label);
    const snaps = await getSnapshots();
    set({ snapshots: snaps });
    return snap;
  },
}));
