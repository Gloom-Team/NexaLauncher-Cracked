import { useEffect, useState, useMemo } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Eye,
  MapPin,
  Fingerprint,
  Cloud,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Lock,
  Info,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { useTweakStore } from "../stores/tweakStore";
import TweakCard from "../components/tweaks/TweakCard";
import { useToast } from "../components/common/Toast";
import type { TweakDefinition } from "../lib/types";

interface PrivacyGroup {
  id: string;
  label: string;
  icon: typeof Eye;
  matchTags: string[];
  description: string;
}

const PRIVACY_GROUPS: PrivacyGroup[] = [
  {
    id: "advertising",
    label: "Advertising & Tracking",
    icon: Eye,
    matchTags: ["advertising", "tracking"],
    description: "Advertising IDs, cross-app tracking, and targeted ads",
  },
  {
    id: "telemetry",
    label: "Data Collection & Telemetry",
    icon: BarChart3,
    matchTags: ["telemetry", "data", "diagnostics"],
    description: "Diagnostic data, usage statistics, and feedback collection",
  },
  {
    id: "location",
    label: "Location & Sensors",
    icon: MapPin,
    matchTags: ["location"],
    description: "Location access, geofencing, and sensor permissions",
  },
  {
    id: "input",
    label: "Input & Personalization",
    icon: Fingerprint,
    matchTags: ["inking", "speech", "personalization"],
    description: "Inking, typing data, speech recognition, and personalization",
  },
  {
    id: "sync",
    label: "Sync & Cloud",
    icon: Cloud,
    matchTags: ["sync", "settings"],
    description: "Settings sync, cloud clipboard, and activity history",
  },
];

function categorizeTweaks(tweaks: TweakDefinition[]) {
  const assigned = new Set<string>();
  const groups: Record<string, TweakDefinition[]> = {};

  for (const g of PRIVACY_GROUPS) {
    groups[g.id] = [];
  }
  groups["other"] = [];

  for (const g of PRIVACY_GROUPS) {
    for (const tweak of tweaks) {
      if (assigned.has(tweak.id)) continue;
      const tags = tweak.tags?.map((t) => t.toLowerCase()) ?? [];
      if (g.matchTags.some((mt) => tags.some((tag) => tag.includes(mt)))) {
        groups[g.id].push(tweak);
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

function getScoreColor(pct: number): string {
  if (pct >= 80) return "text-green-400";
  if (pct >= 50) return "text-yellow-400";
  if (pct >= 25) return "text-orange-400";
  return "text-red-400";
}

function getScoreRingColor(pct: number): string {
  if (pct >= 80) return "stroke-green-400";
  if (pct >= 50) return "stroke-yellow-400";
  if (pct >= 25) return "stroke-orange-400";
  return "stroke-red-400";
}

function getScoreLabel(pct: number): string {
  if (pct >= 80) return "Strong";
  if (pct >= 50) return "Moderate";
  if (pct >= 25) return "Weak";
  return "Minimal";
}

export default function Privacy() {
  const { tweaks, statuses, loading, fetchTweaks, fetchStatuses, applyTweak, isApplied } = useTweakStore();
  const { addToast } = useToast();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [applyingSafe, setApplyingSafe] = useState(false);
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchTweaks();
    fetchStatuses();
  }, []);

  const privacyTweaks = useMemo(
    () => tweaks.filter((t) => t.category === "Privacy"),
    [tweaks],
  );

  const groups = useMemo(() => categorizeTweaks(privacyTweaks), [privacyTweaks]);

  const appliedCount = privacyTweaks.filter((t) => isApplied(t.id)).length;
  const totalCount = privacyTweaks.length;
  const scorePct = totalCount > 0 ? Math.round((appliedCount / totalCount) * 100) : 0;

  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (scorePct / 100) * circumference;

  const toggleCollapse = (id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleDetails = (id: string) => {
    setExpandedDetails((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleApplySafe = async () => {
    const safeUnapplied = privacyTweaks.filter(
      (t) => t.recommendation === "Recommended" && !isApplied(t.id),
    );
    if (safeUnapplied.length === 0) {
      addToast("All recommended privacy tweaks are already applied!", "info");
      return;
    }
    setApplyingSafe(true);
    let success = 0;
    let failed = 0;
    for (const tweak of safeUnapplied) {
      try {
        await applyTweak(tweak.id);
        success++;
      } catch {
        failed++;
      }
    }
    await fetchStatuses();
    setApplyingSafe(false);
    if (failed > 0) {
      addToast(`Applied ${success} tweaks, ${failed} failed`, "error");
    } else {
      addToast(`Applied ${success} recommended privacy tweaks`, "success");
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
        <h1 className="text-2xl font-bold text-white">Privacy Controls</h1>
        <p className="text-sm text-surface-400 mt-1">
          Manage Windows privacy settings safely and transparently.
        </p>
      </div>

      {/* Privacy audit score + safe apply */}
      <div className="card card-animated p-5">
        <div className="flex items-center gap-6">
          {/* Score ring */}
          <div className="relative shrink-0">
            <svg width="96" height="96" viewBox="0 0 96 96">
              <circle
                cx="48" cy="48" r="40"
                fill="none"
                stroke="currentColor"
                className="text-surface-800"
                strokeWidth="6"
              />
              <circle
                cx="48" cy="48" r="40"
                fill="none"
                className={getScoreRingColor(scorePct)}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 48 48)"
                style={{ transition: "stroke-dashoffset 0.6s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-xl font-bold ${getScoreColor(scorePct)}`}>
                {scorePct}%
              </span>
              <span className="text-[10px] text-surface-500">protected</span>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              {scorePct >= 50 ? (
                <ShieldCheck size={18} className="text-green-400" />
              ) : (
                <ShieldAlert size={18} className="text-orange-400" />
              )}
              <span className="text-sm font-semibold text-white">
                Privacy Audit: {getScoreLabel(scorePct)}
              </span>
            </div>
            <p className="text-xs text-surface-400">
              {appliedCount} of {totalCount} privacy tweaks applied.{" "}
              {totalCount - appliedCount > 0
                ? `${totalCount - appliedCount} setting${totalCount - appliedCount !== 1 ? "s" : ""} still sending data to Microsoft.`
                : "All privacy settings are locked down."}
            </p>

            <button
              onClick={handleApplySafe}
              disabled={applyingSafe}
              className="btn-primary btn-animated px-4 py-2 text-sm flex items-center gap-2 mt-1"
            >
              {applyingSafe ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Applying…
                </>
              ) : (
                <>
                  <Lock size={14} />
                  Privacy Without Breaking Windows
                </>
              )}
            </button>
            <p className="text-[11px] text-surface-500">
              Applies only Recommended tweaks — safe and fully reversible.
            </p>
          </div>
        </div>
      </div>

      {/* Category groups */}
      <div className="space-y-4">
        {PRIVACY_GROUPS.map((group) => {
          const groupTweaks = groups[group.id] ?? [];
          if (groupTweaks.length === 0) return null;

          const groupApplied = groupTweaks.filter((t) => isApplied(t.id)).length;
          const isCollapsed = collapsed[group.id] ?? false;
          const Icon = group.icon;
          const allDone = groupApplied === groupTweaks.length;

          return (
            <div key={group.id} className="card card-animated overflow-hidden">
              <button
                onClick={() => toggleCollapse(group.id)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-surface-800/30 transition-colors"
              >
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                  allDone ? "bg-green-500/10" : "bg-surface-800"
                }`}>
                  <Icon size={16} className={allDone ? "text-green-400" : "text-surface-300"} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-white">{group.label}</h2>
                    <span className="text-xs text-surface-500">
                      {groupApplied}/{groupTweaks.length}
                    </span>
                    {allDone && <CheckCircle2 size={14} className="text-green-400" />}
                  </div>
                  <p className="text-xs text-surface-500 mt-0.5">{group.description}</p>
                </div>
                {isCollapsed ? (
                  <ChevronRight size={16} className="text-surface-500 shrink-0" />
                ) : (
                  <ChevronDown size={16} className="text-surface-500 shrink-0" />
                )}
              </button>

              {!isCollapsed && (
                <div className="border-t border-surface-800 p-4 space-y-3">
                  {groupTweaks.map((tweak) => (
                    <div key={tweak.id} className="space-y-0">
                      <TweakCard
                        tweak={tweak}
                        applied={isApplied(tweak.id)}
                        onStatusChange={() => fetchStatuses()}
                      />
                      {/* Inline detail panel */}
                      <button
                        onClick={() => toggleDetails(tweak.id)}
                        className="ml-1 mt-1 flex items-center gap-1 text-[11px] text-surface-500 hover:text-surface-300 transition-colors"
                      >
                        <Info size={12} />
                        {expandedDetails[tweak.id] ? "Hide details" : "What does this do?"}
                      </button>
                      {expandedDetails[tweak.id] && (
                        <div className="ml-1 mt-2 p-3 rounded-lg bg-surface-800/40 border border-surface-700/50 space-y-2">
                          <div>
                            <p className="text-[10px] font-semibold text-surface-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                              <Shield size={10} /> What this does
                            </p>
                            <p className="text-xs text-surface-300 leading-relaxed">
                              {tweak.description}
                            </p>
                          </div>
                          {tweak.when_not_to_use && (
                            <div>
                              <p className="text-[10px] font-semibold text-orange-400/80 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                <AlertTriangle size={10} /> Impact on Windows features
                              </p>
                              <p className="text-xs text-surface-300 leading-relaxed">
                                {tweak.when_not_to_use}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Uncategorized privacy tweaks */}
        {(groups["other"]?.length ?? 0) > 0 && (
          <div className="card card-animated overflow-hidden">
            <button
              onClick={() => toggleCollapse("other")}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-surface-800/30 transition-colors"
            >
              <div className="h-8 w-8 rounded-lg bg-surface-800 flex items-center justify-center shrink-0">
                <Shield size={16} className="text-surface-300" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-white">Other Privacy Settings</h2>
                <p className="text-xs text-surface-500 mt-0.5">Additional privacy-related tweaks</p>
              </div>
              <span className="text-xs text-surface-500 mr-2">
                {groups["other"].filter((t) => isApplied(t.id)).length}/{groups["other"].length}
              </span>
              {collapsed["other"] ? (
                <ChevronRight size={16} className="text-surface-500" />
              ) : (
                <ChevronDown size={16} className="text-surface-500" />
              )}
            </button>

            {!collapsed["other"] && (
              <div className="border-t border-surface-800 p-4 space-y-3">
                {groups["other"].map((tweak) => (
                  <div key={tweak.id} className="space-y-0">
                    <TweakCard
                      tweak={tweak}
                      applied={isApplied(tweak.id)}
                      onStatusChange={() => fetchStatuses()}
                    />
                    <button
                      onClick={() => toggleDetails(tweak.id)}
                      className="ml-1 mt-1 flex items-center gap-1 text-[11px] text-surface-500 hover:text-surface-300 transition-colors"
                    >
                      <Info size={12} />
                      {expandedDetails[tweak.id] ? "Hide details" : "What does this do?"}
                    </button>
                    {expandedDetails[tweak.id] && (
                      <div className="ml-1 mt-2 p-3 rounded-lg bg-surface-800/40 border border-surface-700/50 space-y-2">
                        <div>
                          <p className="text-[10px] font-semibold text-surface-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                            <Shield size={10} /> What this does
                          </p>
                          <p className="text-xs text-surface-300 leading-relaxed">
                            {tweak.description}
                          </p>
                        </div>
                        {tweak.when_not_to_use && (
                          <div>
                            <p className="text-[10px] font-semibold text-orange-400/80 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                              <AlertTriangle size={10} /> Impact on Windows features
                            </p>
                            <p className="text-xs text-surface-300 leading-relaxed">
                              {tweak.when_not_to_use}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {totalCount === 0 && (
        <div className="card card-animated p-8 text-center">
          <Shield size={32} className="text-surface-600 mx-auto mb-3" />
          <p className="text-surface-400 text-sm">
            Privacy tweaks will be available after the full tweak catalog is loaded.
          </p>
        </div>
      )}
    </div>
  );
}
