import { create } from "zustand";
import type { AutomationRule } from "../lib/types";
import {
  getAutomationRules,
  addAutomationRule as apiAddRule,
  removeAutomationRule as apiRemoveRule,
  toggleAutomationRule as apiToggleRule,
  getDefaultAutomationRules,
} from "../lib/tauri";

interface AutomationStore {
  rules: AutomationRule[];
  loading: boolean;
  fetchRules: () => Promise<void>;
  addRule: (rule: AutomationRule) => Promise<void>;
  removeRule: (id: string) => Promise<void>;
  toggleRule: (id: string, enabled: boolean) => Promise<void>;
  fetchDefaults: () => Promise<AutomationRule[]>;
}

export const useAutomationStore = create<AutomationStore>((set, get) => ({
  rules: [],
  loading: false,

  fetchRules: async () => {
    set({ loading: true });
    try {
      const rules = await getAutomationRules();
      set({ rules });
    } finally {
      set({ loading: false });
    }
  },

  addRule: async (rule: AutomationRule) => {
    await apiAddRule(rule);
    await get().fetchRules();
  },

  removeRule: async (id: string) => {
    await apiRemoveRule(id);
    await get().fetchRules();
  },

  toggleRule: async (id: string, enabled: boolean) => {
    await apiToggleRule(id, enabled);
    await get().fetchRules();
  },

  fetchDefaults: async () => {
    return await getDefaultAutomationRules();
  },
}));
