import { useState } from "react";
import {
  RotateCcw,
  Download,
  CheckCircle,
  XCircle,
  Layers,
  Trash2,
} from "lucide-react";
import { useChangeLog } from "@/hooks/useChangeLog";
import { useTweaks } from "@/hooks/useTweaks";
import { revertTweak, exportChanges, undoAll } from "@/lib/tauri";
import { useToast } from "@/components/common/Toast";
import type { ChangeEntry } from "@/lib/types";

function getActionLabel(action: ChangeEntry["action"]): {
  label: string;
  color: string;
  icon: typeof CheckCircle;
} {
  if (action === "Applied") {
    return { label: "Applied", color: "text-success", icon: CheckCircle };
  }
  if (action === "Reverted") {
    return { label: "Reverted", color: "text-surface-400", icon: XCircle };
  }
  if (typeof action === "object" && "ProfileApplied" in action) {
    return { label: `Profile: ${action.ProfileApplied.profile_name}`, color: "text-accent", icon: Layers };
  }
  if (typeof action === "object" && "ProfileReverted" in action) {
    return { label: `Reverted: ${action.ProfileReverted.profile_name}`, color: "text-surface-400", icon: Layers };
  }
  return { label: "Unknown", color: "text-surface-500", icon: CheckCircle };
}

export default function ChangeLog() {
  const { entries, loading, refresh } = useChangeLog();
  const { statusMap, refresh: refreshTweaks } = useTweaks();
  const [reverting, setReverting] = useState<string | null>(null);
  const { addToast } = useToast();

  async function handleRevert(tweakId: string) {
    setReverting(tweakId);
    try {
      await revertTweak(tweakId);
      addToast("Tweak reverted", "success");
      refresh();
      refreshTweaks();
    } catch (e) {
      addToast(`Revert failed: ${e}`, "error");
    } finally {
      setReverting(null);
    }
  }

  async function handleExport() {
    try {
      const json = await exportChanges();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `readypc-changelog-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addToast("Change log exported", "success");
    } catch (e) {
      addToast(`Export failed: ${e}`, "error");
    }
  }

  async function handleUndoAll() {
    try {
      const details = await undoAll();
      addToast(`All changes reverted (${details.length} operations)`, "success");
      refresh();
      refreshTweaks();
    } catch (e) {
      addToast(`Undo all failed: ${e}`, "error");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-accent/30 border-t-accent rounded-full" />
      </div>
    );
  }

  const reversed = [...entries].reverse();

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Change Log</h1>
          <p className="text-sm text-surface-400 mt-1">
            Every modification ReadyPC has made — with full undo capability
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-secondary text-sm">
            <Download size={14} />
            Export
          </button>
          <button
            onClick={handleUndoAll}
            className="btn-danger text-sm"
            disabled={entries.length === 0}
          >
            <RotateCcw size={14} />
            Undo All
          </button>
        </div>
      </div>

      {reversed.length === 0 ? (
        <div className="card text-center py-12">
          <Trash2 size={32} className="text-surface-700 mx-auto mb-3" />
          <p className="text-surface-500">No changes yet</p>
          <p className="text-xs text-surface-600 mt-1">
            Apply a tweak or profile to see changes here
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {reversed.map((entry) => {
            const { label, color, icon: Icon } = getActionLabel(entry.action);
            const isActive = statusMap[entry.tweak_id] ?? false;

            return (
              <div key={entry.id} className="card-hover">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <Icon size={16} className={`mt-0.5 ${color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-white">
                          {entry.tweak_name}
                        </span>
                        <span className={`text-xs ${color}`}>{label}</span>
                      </div>
                      <p className="text-xs text-surface-500 mt-0.5">
                        {new Date(entry.timestamp).toLocaleString()}
                      </p>
                      {entry.details.length > 0 && (
                        <div className="mt-2 space-y-0.5">
                          {entry.details.slice(0, 3).map((d, i) => (
                            <p
                              key={i}
                              className="text-[11px] text-surface-500 font-mono truncate"
                            >
                              {d}
                            </p>
                          ))}
                          {entry.details.length > 3 && (
                            <p className="text-[11px] text-surface-600">
                              +{entry.details.length - 3} more
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {isActive && !entry.tweak_id.startsWith("profile:") && (
                    <button
                      onClick={() => handleRevert(entry.tweak_id)}
                      disabled={reverting === entry.tweak_id}
                      className="btn-ghost text-xs text-surface-400"
                    >
                      <RotateCcw size={12} />
                      Undo
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
