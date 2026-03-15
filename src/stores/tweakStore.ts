import { create } from "zustand";
import type { TweakDefinition, TweakStatus } from "../lib/types";
import { getAllTweaks, getTweakStatus, applyTweak as apiApplyTweak, revertTweak as apiRevertTweak } from "../lib/tauri";

interface TweakStore {
  tweaks: TweakDefinition[];
  statuses: TweakStatus[];
  loading: boolean;
  searchQuery: string;
  selectedCategory: string | null;
  selectedRisk: string | null;
  setSearchQuery: (q: string) => void;
  setSelectedCategory: (c: string | null) => void;
  setSelectedRisk: (r: string | null) => void;
  fetchTweaks: () => Promise<void>;
  fetchStatuses: () => Promise<void>;
  applyTweak: (id: string) => Promise<string[]>;
  revertTweak: (id: string) => Promise<string[]>;
  getFilteredTweaks: () => TweakDefinition[];
  isApplied: (id: string) => boolean;
}

export const useTweakStore = create<TweakStore>((set, get) => ({
  tweaks: [],
  statuses: [],
  loading: false,
  searchQuery: "",
  selectedCategory: null,
  selectedRisk: null,
  setSearchQuery: (q) => set({ searchQuery: q }),
  setSelectedCategory: (c) => set({ selectedCategory: c }),
  setSelectedRisk: (r) => set({ selectedRisk: r }),

  fetchTweaks: async () => {
    set({ loading: true });
    try {
      const tweaks = await getAllTweaks();
      set({ tweaks });
    } finally {
      set({ loading: false });
    }
  },

  fetchStatuses: async () => {
    const statuses = await getTweakStatus();
    set({ statuses });
  },

  applyTweak: async (id: string) => {
    const result = await apiApplyTweak(id);
    await get().fetchStatuses();
    return result;
  },

  revertTweak: async (id: string) => {
    const result = await apiRevertTweak(id);
    await get().fetchStatuses();
    return result;
  },

  getFilteredTweaks: () => {
    const { tweaks, searchQuery, selectedCategory, selectedRisk } = get();
    return tweaks.filter((t) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!t.name.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q) && !t.tags?.some((tag: string) => tag.toLowerCase().includes(q))) {
          return false;
        }
      }
      if (selectedCategory && t.category !== selectedCategory) return false;
      if (selectedRisk && t.risk_level !== selectedRisk) return false;
      return true;
    });
  },

  isApplied: (id: string) => {
    return get().statuses.some((s) => s.tweak_id === id && s.applied);
  },
}));
