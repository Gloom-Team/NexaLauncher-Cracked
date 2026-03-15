import { useState } from "react";
import {
  Gamepad2,
  Zap,
  Moon,
  Cpu,
  Play,
  RotateCcw,
  FileText,
} from "lucide-react";
import type { ProfileDefinition, ProfileStatus } from "@/lib/types";
import { applyProfile, revertProfile, exportChanges } from "@/lib/tauri";
import { useToast } from "../common/Toast";

const ICON_MAP: Record<string, typeof Gamepad2> = {
  "gamepad-2": Gamepad2,
  zap: Zap,
  moon: Moon,
  cpu: Cpu,
};

interface ProfileCardProps {
  profile: ProfileDefinition;
  status: ProfileStatus | undefined;
  onStatusChange: () => void;
}

export default function ProfileCard({
  profile,
  status,
  onStatusChange,
}: ProfileCardProps) {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const Icon = ICON_MAP[profile.icon] || Zap;
  const isApplied = status?.fully_applied ?? false;
  const appliedCount = status?.applied_count ?? 0;
  const totalCount = status?.total_count ?? profile.tweak_ids.length;

  async function handleApply() {
    setLoading(true);
    try {
      const details = await applyProfile(profile.id);
      addToast(
        `${profile.name} applied (${details.length} changes)`,
        "success"
      );
      onStatusChange();
    } catch (e) {
      addToast(`Failed to apply ${profile.name}: ${e}`, "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleRevert() {
    setLoading(true);
    try {
      await revertProfile(profile.id);
      addToast(`${profile.name} reverted`, "info");
      onStatusChange();
    } catch (e) {
      addToast(`Failed to revert ${profile.name}: ${e}`, "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    try {
      const json = await exportChanges();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `readypc-changes-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addToast("Changes exported", "success");
    } catch (e) {
      addToast(`Export failed: ${e}`, "error");
    }
  }

  return (
    <div
      className={`card-hover flex flex-col h-full ${isApplied ? "border-accent/30 bg-accent/[0.03]" : ""}`}
    >
      <div className="flex items-start gap-4 mb-4">
        <div
          className={`p-3 rounded-xl ${isApplied ? "bg-accent/15 text-accent" : "bg-surface-800 text-surface-400"}`}
        >
          <Icon size={24} />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-white">
            {profile.name}
          </h3>
          <p className="text-xs text-surface-500 mt-0.5">
            {appliedCount}/{totalCount} tweaks applied
          </p>
        </div>
        {isApplied && (
          <span className="badge-safe text-[11px]">Active</span>
        )}
      </div>

      <p className="text-xs text-surface-400 leading-relaxed flex-1 mb-4">
        {profile.description}
      </p>

      <div className="flex gap-2">
        {!isApplied ? (
          <button
            onClick={handleApply}
            disabled={loading}
            className="btn-primary text-sm flex-1"
          >
            <Play size={14} />
            Apply
          </button>
        ) : (
          <button
            onClick={handleRevert}
            disabled={loading}
            className="btn-danger text-sm flex-1"
          >
            <RotateCcw size={14} />
            Undo
          </button>
        )}
        <button onClick={handleExport} className="btn-ghost text-sm" title="Export changes receipt">
          <FileText size={14} />
        </button>
      </div>
    </div>
  );
}
