import { useState, useEffect, useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Gamepad2,
  Zap,
  Moon,
  Cpu,
  Shield,
  Battery,
  Wifi,
  Eye,
  Rocket,
  Trash2,
  BellOff,
  Scale,
  Play,
  RotateCcw,
  Plus,
  Download,
  Upload,
  Search,
  X,
  Check,
  Sparkles,
  Package,
  ArrowRightLeft,
  Loader2,
  Layers,
} from "lucide-react";
import { useProfileStore } from "../stores/profileStore";
import { getAllTweaks } from "../lib/tauri";
import { useToast } from "@/components/common/Toast";
import type {
  TweakDefinition,
  ProfileDefinition,
  CustomProfile,
  ProfileStatus,
  TweakCategory,
} from "@/lib/types";
import { CATEGORY_ORDER, CATEGORY_LABELS } from "@/lib/types";

const ICON_MAP: Record<string, LucideIcon> = {
  "gamepad-2": Gamepad2,
  zap: Zap,
  moon: Moon,
  cpu: Cpu,
  shield: Shield,
  battery: Battery,
  wifi: Wifi,
  eye: Eye,
  rocket: Rocket,
  trash: Trash2,
  "bell-off": BellOff,
  scale: Scale,
  layers: Layers,
  sparkles: Sparkles,
  package: Package,
};

function getIcon(iconName: string) {
  return ICON_MAP[iconName] || Zap;
}

const RECOMMENDED_IDS = ["gaming", "performance", "quiet", "privacy"];

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function Profiles() {
  const store = useProfileStore();
  const { addToast } = useToast();

  const [allTweaks, setAllTweaks] = useState<TweakDefinition[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    store.fetchProfiles();
    store.fetchStatuses();
    store.fetchCustomProfiles();
    getAllTweaks().then(setAllTweaks).catch(() => {});
  }, []);

  const recommendedProfiles = useMemo(
    () =>
      store.presetProfiles
        .filter((p) => RECOMMENDED_IDS.includes(p.id))
        .slice(0, 3),
    [store.presetProfiles],
  );

  const filteredPresets = useMemo(() => {
    if (!searchQuery) return store.presetProfiles;
    const q = searchQuery.toLowerCase();
    return store.presetProfiles.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
    );
  }, [store.presetProfiles, searchQuery]);

  async function handleApply(id: string) {
    setActionLoading(id);
    try {
      const details = await store.applyProfile(id);
      addToast(`Profile applied (${details.length} changes)`, "success");
    } catch (e) {
      addToast(`Failed: ${e}`, "error");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRevert(id: string) {
    setActionLoading(id);
    try {
      await store.revertProfile(id);
      addToast("Profile reverted", "info");
    } catch (e) {
      addToast(`Failed: ${e}`, "error");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleExport(id: string) {
    try {
      const json = await store.exportProfile(id);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `readypc-profile-${id}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addToast("Profile exported", "success");
    } catch (e) {
      addToast(`Export failed: ${e}`, "error");
    }
  }

  function handleImportClick() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (ev) => {
      const file = (ev.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const json = await file.text();
        await store.importProfile(json);
        addToast("Profile imported", "success");
      } catch (e) {
        addToast(`Import failed: ${e}`, "error");
      }
    };
    input.click();
  }

  async function handleDeleteCustom(id: string) {
    try {
      await store.deleteCustomProfile(id);
      addToast("Custom profile deleted", "info");
    } catch (e) {
      addToast(`Delete failed: ${e}`, "error");
    }
  }

  // --- Card renderer ---

  function renderCard(
    profile: ProfileDefinition | CustomProfile,
    isCustom = false,
    isHighlighted = false,
  ) {
    const status = store.getStatus(profile.id);
    const Icon = getIcon(profile.icon);
    const isApplied = status?.fully_applied ?? false;
    const appliedCount = status?.applied_count ?? 0;
    const totalCount = status?.total_count ?? profile.tweak_ids.length;
    const isLoading = actionLoading === profile.id;
    const progress = totalCount > 0 ? (appliedCount / totalCount) * 100 : 0;

    return (
      <div
        key={profile.id}
        className={`card-hover flex flex-col relative ${
          isApplied ? "border-accent/30 bg-accent/[0.03]" : ""
        }`}
      >
        {isHighlighted && (
          <div className="absolute -top-2 -right-2 z-10">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent/20 text-accent border border-accent/20">
              <Sparkles size={10} />
              Recommended
            </span>
          </div>
        )}

        <div className="flex items-start gap-3 mb-3">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              isApplied
                ? "bg-accent/15 text-accent"
                : "bg-surface-800 text-surface-400"
            }`}
          >
            <Icon size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white truncate">
                {profile.name}
              </h3>
              {isApplied && (
                <span className="badge-safe text-[10px] shrink-0">Active</span>
              )}
            </div>
            <p className="text-[11px] text-surface-500 mt-0.5">
              {appliedCount}/{totalCount} tweaks applied
            </p>
          </div>
        </div>

        <div className="w-full h-1 rounded-full bg-surface-800 mb-3">
          <div
            className="h-full rounded-full bg-accent/60 transition-all duration-500 progress-animated"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-xs text-surface-400 leading-relaxed flex-1 mb-4 line-clamp-2">
          {profile.description}
        </p>

        <div className="flex gap-1.5 mt-auto">
          {!isApplied ? (
            <button
              onClick={() => handleApply(profile.id)}
              disabled={isLoading}
              className="btn-primary btn-animated text-xs flex-1 py-2"
            >
              {isLoading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Play size={13} />
              )}
              Apply
            </button>
          ) : (
            <button
              onClick={() => handleRevert(profile.id)}
              disabled={isLoading}
              className="btn-danger text-xs flex-1 py-2"
            >
              {isLoading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <RotateCcw size={13} />
              )}
              Revert
            </button>
          )}
          <button
            onClick={() => handleExport(profile.id)}
            className="btn-ghost text-xs px-2"
            title="Export profile"
          >
            <Download size={13} />
          </button>
          {isCustom && (
            <button
              onClick={() => handleDeleteCustom(profile.id)}
              className="btn-ghost text-xs px-2 text-danger hover:text-danger"
              title="Delete profile"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // --- Loading state ---

  if (store.loading && store.presetProfiles.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-accent/30 border-t-accent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-8 stagger-children">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Profiles</h1>
          <p className="text-sm text-surface-400 mt-1">
            One-click optimization presets. Each profile applies a curated set
            of tweaks — fully reversible.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={handleImportClick} className="btn-secondary text-sm">
            <Upload size={15} />
            Import
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary btn-animated text-sm"
          >
            <Plus size={15} />
            Create Profile
          </button>
        </div>
      </div>

      {/* Recommended for this PC */}
      {recommendedProfiles.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-accent" />
            <h2 className="text-base font-semibold text-white">
              Recommended for This PC
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recommendedProfiles.map((p) => renderCard(p, false, true))}
          </div>
        </section>
      )}

      {/* Search + Compare */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search profiles..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-surface-900 border border-surface-800 rounded-lg text-surface-200 placeholder:text-surface-600 focus:outline-none focus:border-accent/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowCompareModal(true)}
          className="btn-ghost text-sm"
        >
          <ArrowRightLeft size={15} />
          Compare
        </button>
      </div>

      {/* All Presets */}
      <section>
        <h2 className="text-base font-semibold text-white mb-3">
          All Profiles
          <span className="text-surface-500 font-normal ml-2 text-sm">
            {filteredPresets.length}
          </span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredPresets.map((p) => renderCard(p))}
        </div>
        {filteredPresets.length === 0 && (
          <p className="text-sm text-surface-500 text-center py-8">
            No profiles match your search.
          </p>
        )}
      </section>

      {/* Custom Profiles */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-white">
            Custom Profiles
            <span className="text-surface-500 font-normal ml-2 text-sm">
              {store.customProfiles.length}
            </span>
          </h2>
        </div>
        {store.customProfiles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {store.customProfiles.map((p) => renderCard(p, true))}
          </div>
        ) : (
          <div className="card card-animated text-center py-12">
            <Package size={32} className="mx-auto text-surface-600 mb-3" />
            <p className="text-sm text-surface-400">No custom profiles yet</p>
            <p className="text-xs text-surface-600 mt-1">
              Create one by selecting your preferred tweaks
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary btn-animated text-sm mt-4 mx-auto"
            >
              <Plus size={14} />
              Create Profile
            </button>
          </div>
        )}
      </section>

      {/* Modals */}
      {showCreateModal && (
        <CreateProfileModal
          allTweaks={allTweaks}
          onClose={() => setShowCreateModal(false)}
          onCreate={async (profile) => {
            await store.createCustomProfile(profile);
            setShowCreateModal(false);
            addToast("Custom profile created", "success");
          }}
        />
      )}

      {showCompareModal && (
        <CompareModal
          profiles={[...store.presetProfiles, ...store.customProfiles]}
          statuses={store.statuses}
          allTweaks={allTweaks}
          onClose={() => setShowCompareModal(false)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create Profile Modal
// ---------------------------------------------------------------------------

function CreateProfileModal({
  allTweaks,
  onClose,
  onCreate,
}: {
  allTweaks: TweakDefinition[];
  onClose: () => void;
  onCreate: (profile: CustomProfile) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTweaks, setSelectedTweaks] = useState<Set<string>>(new Set());
  const [tweakSearch, setTweakSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<TweakCategory | "all">(
    "all",
  );
  const [saving, setSaving] = useState(false);

  const filteredTweaks = useMemo(() => {
    let tweaks = allTweaks;
    if (activeCategory !== "all") {
      tweaks = tweaks.filter((t) => t.category === activeCategory);
    }
    if (tweakSearch) {
      const q = tweakSearch.toLowerCase();
      tweaks = tweaks.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q),
      );
    }
    return tweaks;
  }, [allTweaks, activeCategory, tweakSearch]);

  const categoryGroups = useMemo(() => {
    const groups: Partial<Record<TweakCategory, TweakDefinition[]>> = {};
    for (const t of filteredTweaks) {
      (groups[t.category] ??= []).push(t);
    }
    return groups;
  }, [filteredTweaks]);

  function toggleTweak(id: string) {
    setSelectedTweaks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleCategory(cat: TweakCategory) {
    const tweaksInCat = allTweaks.filter((t) => t.category === cat);
    const allSelected = tweaksInCat.every((t) => selectedTweaks.has(t.id));
    setSelectedTweaks((prev) => {
      const next = new Set(prev);
      for (const t of tweaksInCat) {
        if (allSelected) next.delete(t.id);
        else next.add(t.id);
      }
      return next;
    });
  }

  async function handleSave() {
    if (!name.trim() || selectedTweaks.size === 0) return;
    setSaving(true);
    const now = new Date().toISOString();
    try {
      await onCreate({
        id: `custom-${Date.now()}`,
        name: name.trim(),
        description: description.trim(),
        icon: "layers",
        tweak_ids: Array.from(selectedTweaks),
        created_at: now,
        modified_at: now,
        is_favorite: false,
        tags: [],
        linked_app: null,
        linked_game: null,
        schedule: null,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-900 border border-surface-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-surface-800">
          <h2 className="text-lg font-semibold text-white">
            Create Custom Profile
          </h2>
          <button
            onClick={onClose}
            className="text-surface-500 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-surface-400 mb-1.5 block">
                Profile Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-surface-800/50 border border-surface-700 rounded-lg text-white placeholder:text-surface-600 focus:outline-none focus:border-accent/50"
                placeholder="My Custom Profile"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-surface-400 mb-1.5 block">
                Description
              </label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-surface-800/50 border border-surface-700 rounded-lg text-white placeholder:text-surface-600 focus:outline-none focus:border-accent/50"
                placeholder="What this profile optimizes for..."
              />
            </div>
          </div>

          {/* Tweak Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-surface-400">
                Select Tweaks
              </label>
              <span className="text-xs text-accent font-medium">
                {selectedTweaks.size} selected
              </span>
            </div>

            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500"
                />
                <input
                  value={tweakSearch}
                  onChange={(e) => setTweakSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-800/50 border border-surface-700 rounded-lg text-white placeholder:text-surface-600 focus:outline-none focus:border-accent/50"
                  placeholder="Search tweaks..."
                />
              </div>
              <select
                value={activeCategory}
                onChange={(e) =>
                  setActiveCategory(e.target.value as TweakCategory | "all")
                }
                className="px-3 py-1.5 text-xs bg-surface-800/50 border border-surface-700 rounded-lg text-surface-200 focus:outline-none focus:border-accent/50"
              >
                <option value="all">All Categories</option>
                {CATEGORY_ORDER.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            </div>

            <div className="border border-surface-800 rounded-lg max-h-72 overflow-y-auto">
              {CATEGORY_ORDER.filter((cat) => categoryGroups[cat]?.length).map(
                (cat) => {
                  const tweaks = categoryGroups[cat]!;
                  const allCatSelected = tweaks.every((t) =>
                    selectedTweaks.has(t.id),
                  );
                  return (
                    <div key={cat}>
                      <button
                        onClick={() => toggleCategory(cat)}
                        className="w-full flex items-center gap-2 px-3 py-2 bg-surface-800/30 text-xs font-semibold text-surface-300 hover:bg-surface-800/60 transition-colors sticky top-0 z-10"
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                            allCatSelected
                              ? "bg-accent border-accent"
                              : "border-surface-600"
                          }`}
                        >
                          {allCatSelected && (
                            <Check size={8} className="text-white" />
                          )}
                        </div>
                        {CATEGORY_LABELS[cat]}
                        <span className="text-surface-600 font-normal ml-auto">
                          {tweaks.length}
                        </span>
                      </button>
                      {tweaks.map((tweak) => {
                        const selected = selectedTweaks.has(tweak.id);
                        return (
                          <label
                            key={tweak.id}
                            className={`flex items-start gap-3 px-3 py-2.5 cursor-pointer hover:bg-surface-800/20 transition-colors border-b border-surface-800/30 last:border-0 ${
                              selected ? "bg-accent/[0.03]" : ""
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded border mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                                selected
                                  ? "bg-accent border-accent"
                                  : "border-surface-600"
                              }`}
                            >
                              {selected && (
                                <Check size={10} className="text-white" />
                              )}
                            </div>
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={selected}
                              onChange={() => toggleTweak(tweak.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-white">
                                  {tweak.name}
                                </span>
                                <span
                                  className={`text-[9px] px-1 py-0.5 rounded ${
                                    tweak.risk_level === "Safe"
                                      ? "bg-success/15 text-success"
                                      : tweak.risk_level === "Moderate"
                                        ? "bg-warning/15 text-warning"
                                        : "bg-danger/15 text-danger"
                                  }`}
                                >
                                  {tweak.risk_level}
                                </span>
                              </div>
                              <p className="text-[11px] text-surface-500 mt-0.5 line-clamp-1">
                                {tweak.description}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  );
                },
              )}
              {filteredTweaks.length === 0 && (
                <p className="text-xs text-surface-500 text-center py-6">
                  No tweaks found
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-5 border-t border-surface-800">
          <button onClick={onClose} className="btn-ghost text-sm">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || selectedTweaks.size === 0 || saving}
            className="btn-primary btn-animated text-sm"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Plus size={14} />
            )}
            Create Profile
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compare Modal
// ---------------------------------------------------------------------------

function CompareModal({
  profiles,
  statuses,
  allTweaks,
  onClose,
}: {
  profiles: (ProfileDefinition | CustomProfile)[];
  statuses: ProfileStatus[];
  allTweaks: TweakDefinition[];
  onClose: () => void;
}) {
  const [leftId, setLeftId] = useState("");
  const [rightId, setRightId] = useState("");

  const leftProfile = profiles.find((p) => p.id === leftId);
  const rightProfile = profiles.find((p) => p.id === rightId);

  const leftTweakSet = useMemo(
    () => new Set(leftProfile?.tweak_ids ?? []),
    [leftProfile],
  );
  const rightTweakSet = useMemo(
    () => new Set(rightProfile?.tweak_ids ?? []),
    [rightProfile],
  );

  const shared = useMemo(
    () => [...leftTweakSet].filter((id) => rightTweakSet.has(id)),
    [leftTweakSet, rightTweakSet],
  );
  const leftOnly = useMemo(
    () => [...leftTweakSet].filter((id) => !rightTweakSet.has(id)),
    [leftTweakSet, rightTweakSet],
  );
  const rightOnly = useMemo(
    () => [...rightTweakSet].filter((id) => !leftTweakSet.has(id)),
    [leftTweakSet, rightTweakSet],
  );

  const tweakName = (id: string) =>
    allTweaks.find((t) => t.id === id)?.name ?? id;

  const bothSelected = leftProfile && rightProfile;

  const selectClasses =
    "w-full px-3 py-2 text-sm bg-surface-800/50 border border-surface-700 rounded-lg text-surface-200 focus:outline-none focus:border-accent/50";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-900 border border-surface-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-surface-800">
          <div className="flex items-center gap-2">
            <ArrowRightLeft size={18} className="text-accent" />
            <h2 className="text-lg font-semibold text-white">
              Compare Profiles
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-surface-500 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* Selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-surface-400 mb-1.5 block">
                Profile A
              </label>
              <select
                value={leftId}
                onChange={(e) => setLeftId(e.target.value)}
                className={selectClasses}
              >
                <option value="">Select a profile…</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-surface-400 mb-1.5 block">
                Profile B
              </label>
              <select
                value={rightId}
                onChange={(e) => setRightId(e.target.value)}
                className={selectClasses}
              >
                <option value="">Select a profile…</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {bothSelected && (
            <>
              {/* Summary pills */}
              <div className="grid grid-cols-3 gap-3">
                <div className="card card-animated p-3 text-center">
                  <p className="text-xl font-bold text-accent">
                    {leftOnly.length}
                  </p>
                  <p className="text-[11px] text-surface-500 mt-0.5">
                    Only in {leftProfile.name}
                  </p>
                </div>
                <div className="card card-animated p-3 text-center">
                  <p className="text-xl font-bold text-success">
                    {shared.length}
                  </p>
                  <p className="text-[11px] text-surface-500 mt-0.5">Shared</p>
                </div>
                <div className="card card-animated p-3 text-center">
                  <p className="text-xl font-bold text-warning">
                    {rightOnly.length}
                  </p>
                  <p className="text-[11px] text-surface-500 mt-0.5">
                    Only in {rightProfile.name}
                  </p>
                </div>
              </div>

              {/* Side-by-side tweak lists */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs font-semibold text-surface-300 mb-2">
                    {leftProfile.name}
                    <span className="font-normal text-surface-600 ml-1">
                      ({leftProfile.tweak_ids.length})
                    </span>
                  </h3>
                  <div className="space-y-1">
                    {leftProfile.tweak_ids.map((id) => {
                      const isShared = rightTweakSet.has(id);
                      return (
                        <div
                          key={id}
                          className={`text-xs px-2.5 py-1.5 rounded-lg ${
                            isShared
                              ? "bg-success/10 text-success"
                              : "bg-surface-800 text-surface-300"
                          }`}
                        >
                          {tweakName(id)}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-surface-300 mb-2">
                    {rightProfile.name}
                    <span className="font-normal text-surface-600 ml-1">
                      ({rightProfile.tweak_ids.length})
                    </span>
                  </h3>
                  <div className="space-y-1">
                    {rightProfile.tweak_ids.map((id) => {
                      const isShared = leftTweakSet.has(id);
                      return (
                        <div
                          key={id}
                          className={`text-xs px-2.5 py-1.5 rounded-lg ${
                            isShared
                              ? "bg-success/10 text-success"
                              : "bg-surface-800 text-surface-300"
                          }`}
                        >
                          {tweakName(id)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}

          {!bothSelected && (
            <div className="text-center py-12 text-surface-500 text-sm">
              Select two profiles above to compare their tweaks side-by-side.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
