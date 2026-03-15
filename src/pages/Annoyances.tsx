import { useEffect, useState, useMemo } from "react";
import {
  VolumeX,
  MonitorSmartphone,
  Bell,
  Keyboard,
  Megaphone,
  Package,
  ChevronDown,
  ChevronRight,
  Zap,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { useTweakStore } from "../stores/tweakStore";
import TweakCard from "../components/tweaks/TweakCard";
import { useToast } from "../components/common/Toast";
import type { TweakDefinition } from "../lib/types";

interface Subcategory {
  id: string;
  label: string;
  icon: typeof VolumeX;
  matchTags: string[];
  description: string;
}

const SUBCATEGORIES: Subcategory[] = [
  {
    id: "nags",
    label: "Nags & Prompts",
    icon: VolumeX,
    matchTags: ["nag", "prompt", "suggestion", "tips"],
    description: "Dismiss persistent popups, setup nags, and unsolicited tips",
  },
  {
    id: "taskbar",
    label: "Taskbar & Desktop",
    icon: MonitorSmartphone,
    matchTags: ["taskbar", "desktop", "widgets", "chat"],
    description: "Clean up taskbar clutter, widgets, and Teams chat icon",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    matchTags: ["notification", "sound", "dnd"],
    description: "Tame notification overload and system sounds",
  },
  {
    id: "keyboard",
    label: "Keyboard Interruptions",
    icon: Keyboard,
    matchTags: ["keyboard", "sticky", "filter", "toggle"],
    description: "Stop accidental Sticky Keys, Filter Keys, and toggle popups",
  },
  {
    id: "ads",
    label: "Ads & Suggestions",
    icon: Megaphone,
    matchTags: ["advertising", "suggestion", "consumer"],
    description: "Remove ads from Start, lock screen, and Settings",
  },
  {
    id: "other",
    label: "Other",
    icon: Package,
    matchTags: [],
    description: "Remaining annoyance tweaks",
  },
];

function matchesSubcategory(tweak: TweakDefinition, sub: Subcategory): boolean {
  if (sub.id === "other") return false;
  const tags = tweak.tags?.map((t) => t.toLowerCase()) ?? [];
  return sub.matchTags.some((mt) => tags.some((tag) => tag.includes(mt)));
}

function categorizeTweaks(tweaks: TweakDefinition[]) {
  const assigned = new Set<string>();
  const groups: Record<string, TweakDefinition[]> = {};

  for (const sub of SUBCATEGORIES) {
    if (sub.id === "other") continue;
    groups[sub.id] = [];
  }
  groups["other"] = [];

  for (const sub of SUBCATEGORIES) {
    if (sub.id === "other") continue;
    for (const tweak of tweaks) {
      if (assigned.has(tweak.id)) continue;
      if (matchesSubcategory(tweak, sub)) {
        groups[sub.id].push(tweak);
        assigned.add(tweak.id);
      }
    }
  }

  for (const tweak of tweaks) {
    if (!assigned.has(tweak.id)) {
      groups["other"].push(tweak);
    }
  }

  return groups;
}

export default function Annoyances() {
  const { tweaks, statuses, loading, fetchTweaks, fetchStatuses, applyTweak, isApplied } = useTweakStore();
  const { addToast } = useToast();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [applyingAll, setApplyingAll] = useState(false);

  useEffect(() => {
    fetchTweaks();
    fetchStatuses();
  }, []);

  const annoyanceTweaks = useMemo(
    () => tweaks.filter((t) => t.category === "Annoyance"),
    [tweaks],
  );

  const groups = useMemo(() => categorizeTweaks(annoyanceTweaks), [annoyanceTweaks]);

  const appliedCount = annoyanceTweaks.filter((t) => isApplied(t.id)).length;
  const totalCount = annoyanceTweaks.length;
  const progressPct = totalCount > 0 ? (appliedCount / totalCount) * 100 : 0;

  const toggleCollapse = (id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleMakeQuieter = async () => {
    const unapplied = annoyanceTweaks.filter((t) => !isApplied(t.id));
    if (unapplied.length === 0) {
      addToast("All annoyance tweaks are already applied!", "info");
      return;
    }
    setApplyingAll(true);
    let success = 0;
    let failed = 0;
    for (const tweak of unapplied) {
      try {
        await applyTweak(tweak.id);
        success++;
      } catch {
        failed++;
      }
    }
    await fetchStatuses();
    setApplyingAll(false);
    if (failed > 0) {
      addToast(`Applied ${success} tweaks, ${failed} failed`, "error");
    } else {
      addToast(`Applied ${success} annoyance tweaks — Windows is quieter now`, "success");
    }
  };

  if (loading && tweaks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-accent/30 border-t-accent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6 stagger-children">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Annoyance Removal</h1>
        <p className="text-sm text-surface-400 mt-1">
          Silence the popups, nags, and clutter that make Windows frustrating.
        </p>
      </div>

      {/* Summary bar */}
      <div className="card card-animated p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <VolumeX size={20} className="text-accent" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">
                {appliedCount}/{totalCount} annoyances silenced
              </div>
              <div className="text-xs text-surface-500">
                {totalCount - appliedCount === 0
                  ? "Windows is as quiet as it gets"
                  : `${totalCount - appliedCount} remaining annoyance${totalCount - appliedCount !== 1 ? "s" : ""}`}
              </div>
            </div>
          </div>
          <button
            onClick={handleMakeQuieter}
            disabled={applyingAll || appliedCount === totalCount}
            className="btn-primary btn-animated px-4 py-2 text-sm flex items-center gap-2"
          >
            {applyingAll ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Applying…
              </>
            ) : (
              <>
                <Zap size={14} />
                Make Windows Quieter
              </>
            )}
          </button>
        </div>
        <div className="w-full h-2 rounded-full bg-surface-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-accent/70 transition-all duration-500 progress-animated"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Subcategory groups */}
      <div className="space-y-4">
        {SUBCATEGORIES.map((sub) => {
          const groupTweaks = groups[sub.id] ?? [];
          if (groupTweaks.length === 0) return null;

          const groupApplied = groupTweaks.filter((t) => isApplied(t.id)).length;
          const isCollapsed = collapsed[sub.id] ?? false;
          const Icon = sub.icon;

          return (
            <div key={sub.id} className="card card-animated overflow-hidden">
              <button
                onClick={() => toggleCollapse(sub.id)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-surface-800/30 transition-colors"
              >
                <div className="h-8 w-8 rounded-lg bg-surface-800 flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-surface-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-white">{sub.label}</h2>
                    <span className="text-xs text-surface-500">
                      {groupApplied}/{groupTweaks.length}
                    </span>
                    {groupApplied === groupTweaks.length && (
                      <CheckCircle2 size={14} className="text-green-400" />
                    )}
                  </div>
                  <p className="text-xs text-surface-500 mt-0.5">{sub.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-0.5">
                    {groupTweaks.map((t) => (
                      <div
                        key={t.id}
                        className={`h-1.5 w-1.5 rounded-full ${
                          isApplied(t.id) ? "bg-accent" : "bg-surface-700"
                        }`}
                      />
                    ))}
                  </div>
                  {isCollapsed ? (
                    <ChevronRight size={16} className="text-surface-500" />
                  ) : (
                    <ChevronDown size={16} className="text-surface-500" />
                  )}
                </div>
              </button>

              {!isCollapsed && (
                <div className="border-t border-surface-800 p-4 space-y-3">
                  {groupTweaks.map((tweak) => (
                    <TweakCard
                      key={tweak.id}
                      tweak={tweak}
                      applied={isApplied(tweak.id)}
                      onStatusChange={() => fetchStatuses()}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {totalCount === 0 && (
        <div className="card card-animated p-8 text-center">
          <Circle size={32} className="text-surface-600 mx-auto mb-3" />
          <p className="text-surface-400 text-sm">
            No annoyance tweaks found. Load the tweak catalog first.
          </p>
        </div>
      )}
    </div>
  );
}
