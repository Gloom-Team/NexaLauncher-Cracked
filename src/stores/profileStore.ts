import { create } from "zustand";
import type { ProfileDefinition, ProfileStatus, CustomProfile } from "../lib/types";
import {
  getProfiles,
  getProfileStatus,
  applyProfile as apiApplyProfile,
  revertProfile as apiRevertProfile,
  getCustomProfiles as apiGetCustomProfiles,
  createCustomProfile as apiCreateCustomProfile,
  deleteCustomProfile as apiDeleteCustomProfile,
  exportProfile as apiExportProfile,
  importProfile as apiImportProfile,
} from "../lib/tauri";

interface ProfileStore {
  presetProfiles: ProfileDefinition[];
  customProfiles: CustomProfile[];
  statuses: ProfileStatus[];
  loading: boolean;
  fetchProfiles: () => Promise<void>;
  fetchStatuses: () => Promise<void>;
  fetchCustomProfiles: () => Promise<void>;
  applyProfile: (id: string) => Promise<string[]>;
  revertProfile: (id: string) => Promise<string[]>;
  createCustomProfile: (profile: CustomProfile) => Promise<void>;
  deleteCustomProfile: (id: string) => Promise<void>;
  exportProfile: (id: string) => Promise<string>;
  importProfile: (json: string) => Promise<void>;
  getStatus: (id: string) => ProfileStatus | undefined;
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  presetProfiles: [],
  customProfiles: [],
  statuses: [],
  loading: false,

  fetchProfiles: async () => {
    set({ loading: true });
    try {
      const profiles = await getProfiles();
      set({ presetProfiles: profiles });
    } finally {
      set({ loading: false });
    }
  },

  fetchStatuses: async () => {
    const statuses = await getProfileStatus();
    set({ statuses });
  },

  fetchCustomProfiles: async () => {
    try {
      const custom = await apiGetCustomProfiles();
      set({ customProfiles: custom });
    } catch {
      set({ customProfiles: [] });
    }
  },

  applyProfile: async (id: string) => {
    const result = await apiApplyProfile(id);
    await get().fetchStatuses();
    return result;
  },

  revertProfile: async (id: string) => {
    const result = await apiRevertProfile(id);
    await get().fetchStatuses();
    return result;
  },

  createCustomProfile: async (profile: CustomProfile) => {
    await apiCreateCustomProfile(profile);
    await get().fetchCustomProfiles();
  },

  deleteCustomProfile: async (id: string) => {
    await apiDeleteCustomProfile(id);
    await get().fetchCustomProfiles();
  },

  exportProfile: async (id: string) => {
    return await apiExportProfile(id);
  },

  importProfile: async (json: string) => {
    await apiImportProfile(json);
    await get().fetchCustomProfiles();
  },

  getStatus: (id: string) => {
    return get().statuses.find((s) => s.profile_id === id);
  },
}));
