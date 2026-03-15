import { useState } from "react";
import {
  Gamepad2,
  MonitorX,
  Rocket,
  BellRing,
  Battery,
  Thermometer,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Check,
  Zap,
} from "lucide-react";
import type { TweakDefinition } from "@/lib/types";
import { useTweakStore } from "@/stores/tweakStore";
import { useScanStore } from "@/stores/scanStore";
import { RiskBadge } from "../tweaks/RiskBadge";
import Toggle from "../common/Toggle";

const SYMPTOMS = [
  {
    id: "low_fps",
    label: "Low FPS",
    description: "Games don't feel smooth",
    icon: Gamepad2,
    tags: ["fps", "gaming", "gpu"],
  },
  {
    id: "stuttering",
    label: "Stuttering",
    description: "Random hitches and frame drops",
    icon: MonitorX,
    tags: ["stutter", "gaming", "disk", "ram"],
  },
  {
    id: "slow_startup",
    label: "Slow Startup",
    description: "PC takes forever to boot",
    icon: Rocket,
    tags: ["startup", "boot", "performance"],
  },
  {
    id: "popups",
    label: "Too Many Popups",
    description: "Annoying notifications and nags",
    icon: BellRing,
    tags: ["annoyance", "notification", "nag"],
  },
  {
    id: "battery",
    label: "Battery Dying Fast",
    description: "Laptop drains too quickly",
    icon: Battery,
    tags: ["battery", "power", "laptop"],
  },
  {
    id: "hot_loud",
    label: "PC Running Hot / Loud",
    description: "Fans spinning up, overheating",
    icon: Thermometer,
    tags: ["power", "cooling", "performance"],
  },
] as const;

type SymptomId = (typeof SYMPTOMS)[number]["id"];

interface SymptomWizardProps {
  onClose: () => void;
}

export default function SymptomWizard({ onClose }: SymptomWizardProps) {
  const [step, setStep] = useState<"pick" | "results">("pick");
  const [selected, setSelected] = useState<Set<SymptomId>>(new Set());
  const [applying, setApplying] = useState<Set<string>>(new Set());
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [applyingAll, setApplyingAll] = useState(false);

  const {
    tweaks,
    statuses,
    fetchTweaks,
    fetchStatuses,
    applyTweak,
  } = useTweakStore();
  const { runScan, scanning } = useScanStore();

  function toggleSymptom(id: SymptomId) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleAnalyze() {
    await Promise.all([fetchTweaks(), fetchStatuses(), runScan()]);
    setStep("results");
  }

  function getMatchingTweaks(): TweakDefinition[] {
    const allTags = new Set<string>();
    for (const symptomId of selected) {
      const symptom = SYMPTOMS.find((s) => s.id === symptomId);
      if (symptom) symptom.tags.forEach((t) => allTags.add(t));
    }

    const appliedIds = new Set(
      statuses.filter((s) => s.applied).map((s) => s.tweak_id),
    );

    return tweaks.filter(
      (t) =>
        !appliedIds.has(t.id) &&
        !applied.has(t.id) &&
        t.tags?.some((tag) => allTags.has(tag)),
    );
  }

  async function handleApplyOne(id: string) {
    setApplying((prev) => new Set(prev).add(id));
    try {
      await applyTweak(id);
      setApplied((prev) => new Set(prev).add(id));
    } finally {
      setApplying((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  async function handleApplyAll() {
    const matches = getMatchingTweaks();
    setApplyingAll(true);
    for (const t of matches) {
      await handleApplyOne(t.id);
    }
    setApplyingAll(false);
  }

  const matchingTweaks = step === "results" ? getMatchingTweaks() : [];

  return (
    <div className="space-y-5">
      {step === "pick" && (
        <>
          <p className="text-sm text-surface-300">
            What's bothering you? Select all that apply.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {SYMPTOMS.map((symptom) => {
              const Icon = symptom.icon;
              const active = selected.has(symptom.id);
              return (
                <button
                  key={symptom.id}
                  onClick={() => toggleSymptom(symptom.id)}
                  className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                    active
                      ? "border-accent/40 bg-accent/[0.06]"
                      : "border-surface-800 bg-surface-900 hover:border-surface-700"
                  }`}
                >
                  <Icon
                    size={20}
                    className={active ? "text-accent" : "text-surface-500"}
                  />
                  <div>
                    <p
                      className={`text-sm font-medium ${active ? "text-white" : "text-surface-300"}`}
                    >
                      {symptom.label}
                    </p>
                    <p className="text-xs text-surface-500 mt-0.5">
                      {symptom.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="btn-ghost text-sm">
              Cancel
            </button>
            <button
              onClick={handleAnalyze}
              disabled={selected.size === 0 || scanning}
              className="btn-primary text-sm"
            >
              {scanning ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  Analyze
                  <ChevronRight size={14} />
                </>
              )}
            </button>
          </div>
        </>
      )}

      {step === "results" && (
        <>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep("pick")}
              className="btn-ghost text-xs"
            >
              <ChevronLeft size={14} />
              Back
            </button>
            {matchingTweaks.length > 0 && (
              <button
                onClick={handleApplyAll}
                disabled={applyingAll}
                className="btn-primary text-xs"
              >
                {applyingAll ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Zap size={14} />
                    Apply All Recommended ({matchingTweaks.length})
                  </>
                )}
              </button>
            )}
          </div>

          {matchingTweaks.length === 0 ? (
            <div className="text-center py-8">
              <Check size={32} className="mx-auto text-success mb-3" />
              <p className="text-sm text-surface-300 font-medium">
                All relevant tweaks are already applied!
              </p>
              <p className="text-xs text-surface-500 mt-1">
                Your system is optimized for the selected symptoms.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-surface-500">
                {matchingTweaks.length} unapplied tweaks match your symptoms
              </p>
              {matchingTweaks.map((tweak) => (
                <div
                  key={tweak.id}
                  className="card-hover flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-white truncate">
                        {tweak.name}
                      </span>
                      <RiskBadge level={tweak.risk_level} />
                    </div>
                    <p className="text-xs text-surface-400 line-clamp-1">
                      {tweak.description}
                    </p>
                  </div>
                  <Toggle
                    enabled={applied.has(tweak.id)}
                    onChange={() => handleApplyOne(tweak.id)}
                    loading={applying.has(tweak.id)}
                  />
                </div>
              ))}
            </div>
          )}

          {applied.size > 0 && (
            <div className="pt-3 border-t border-surface-800">
              <p className="text-xs text-success">
                <Check size={12} className="inline mr-1" />
                {applied.size} tweak{applied.size !== 1 ? "s" : ""} applied this
                session
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
