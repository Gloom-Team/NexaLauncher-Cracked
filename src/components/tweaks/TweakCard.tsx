import { useState } from "react";
import { RotateCcw, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import type { TweakDefinition } from "@/lib/types";
import { RiskBadge, RecommendationBadge } from "./RiskBadge";
import Toggle from "../common/Toggle";
import { applyTweak, revertTweak } from "@/lib/tauri";
import { useToast } from "../common/Toast";

function formatActionDisplay(action: unknown): string {
  if (!action || typeof action !== "object") return String(action);
  const obj = action as Record<string, unknown>;
  if ("Registry" in obj) {
    const reg = obj.Registry as Record<string, unknown>;
    return `Registry: ${reg.path}\\${reg.value_name} → ${reg.value}`;
  }
  if ("Service" in obj) {
    const svc = obj.Service as Record<string, unknown>;
    return `Service: ${svc.name} → ${svc.startup_type}`;
  }
  if ("Command" in obj) {
    const cmd = obj.Command as Record<string, unknown>;
    return `Command: ${cmd.command}`;
  }
  if ("PowerShell" in obj) {
    const ps = obj.PowerShell as Record<string, unknown>;
    return `PowerShell: ${ps.script}`;
  }
  return JSON.stringify(action);
}

interface TweakCardProps {
  tweak: TweakDefinition;
  applied: boolean;
  onStatusChange: () => void;
}

export default function TweakCard({
  tweak,
  applied,
  onStatusChange,
}: TweakCardProps) {
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { addToast } = useToast();

  async function handleToggle(enable: boolean) {
    setLoading(true);
    try {
      if (enable) {
        await applyTweak(tweak.id);
        addToast(`Applied: ${tweak.name}`, "success");
      } else {
        await revertTweak(tweak.id);
        addToast(`Reverted: ${tweak.name}`, "info");
      }
      onStatusChange();
    } catch (e) {
      addToast(`Failed: ${e}`, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`card-hover card-animated transition-all ${applied ? "border-accent/30 bg-accent/[0.03] glow-pulse" : ""}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-sm font-semibold text-white">{tweak.name}</h3>
            <RiskBadge level={tweak.risk_level} />
            <RecommendationBadge rec={tweak.recommendation} />
            {tweak.requires_reboot && (
              <span className="badge bg-surface-700 text-surface-400">
                <RefreshCw size={10} className="mr-1" />
                Reboot
              </span>
            )}
          </div>
          <p className="text-xs text-surface-400 leading-relaxed">
            {tweak.description}
          </p>
        </div>
        <Toggle enabled={applied} onChange={handleToggle} loading={loading} />
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-3 flex items-center gap-1 text-xs text-surface-500 hover:text-surface-300 transition-colors"
      >
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {expanded ? "Less info" : "Why it helps"}
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-surface-800 space-y-2 accordion-enter">
          <div>
            <p className="text-[11px] font-medium text-surface-500 uppercase tracking-wider mb-1">
              Why it helps
            </p>
            <p className="text-xs text-surface-300 leading-relaxed">
              {tweak.why_it_helps}
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-surface-500">
            <span>Impact: {tweak.impact_estimate}</span>
            <span>
              {tweak.reversible ? "Fully reversible" : "Not reversible"}
            </span>
            {tweak.requires_admin && <span>Requires admin</span>}
          </div>
          {tweak.actions && tweak.actions.length > 0 && (
            <div className="pt-2">
              <p className="text-[11px] font-medium text-surface-500 uppercase tracking-wider mb-1.5">
                System Actions
              </p>
              <div className="space-y-1">
                {tweak.actions.map((action, i) => (
                  <p
                    key={i}
                    className="text-[11px] text-surface-400 font-mono bg-surface-950 rounded px-2.5 py-1.5 break-all"
                  >
                    {formatActionDisplay(action)}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
