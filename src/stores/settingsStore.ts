import { create } from "zustand";

interface AppSettings {
  theme: "dark" | "light";
  accentColor: string;
  showAdvanced: boolean;
  autoScanOnStartup: boolean;
  confirmBeforeApply: boolean;
  createRestorePoint: boolean;
}

interface SettingsStore {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
}

const defaultSettings: AppSettings = {
  theme: "dark",
  accentColor: "indigo",
  showAdvanced: false,
  autoScanOnStartup: true,
  confirmBeforeApply: true,
  createRestorePoint: true,
};

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: defaultSettings,
  updateSettings: (partial) =>
    set((state) => ({
      settings: { ...state.settings, ...partial },
    })),
}));
