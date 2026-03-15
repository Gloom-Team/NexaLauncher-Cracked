import { useEffect, useState, useMemo } from "react";
import {
  RotateCcw,
  Clock,
  Shield,
  Download,
  Upload,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Loader2,
  Tag,
  Calendar,
} from "lucide-react";
import {
  getChangeLog,
  exportChanges,
  undoAll,
  revertTweak,
  getAllTweaks,
} from "../lib/tauri";
import type { ChangeEntry, TweakDefinition } from "../lib/types";

export default function UndoSafety() {
  const [entries, setEntries] = useState<ChangeEntry[]>([]);
  const [allTweaks, setAllTweaks] = useState<TweakDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [undoingCategory, setUndoingCategory] = useState<string | null>(null);
  const [auditMode, setAuditMode] = useState(false);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [showRollbackConfirm, setShowRollbackConfirm] = useState(false);

  useEffect(() => {
    getChangeLog().then(setEntries).catch(() => {});
    getAllTweaks().then(setAllTweaks).catch(() => {});
  }, []);

  const tweakMap = useMemo(() => {
    const map = new Map<string, TweakDefinition>();
    for (const t of allTweaks) map.set(t.id, t);
    return map;
  }, [allTweaks]);

  const dateGroups = useMemo(() => {
    const groups = new Map<string, ChangeEntry[]>();
    const sorted = [...entries].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    for (const entry of sorted) {
      const dateKey = new Date(entry.timestamp).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const group = groups.get(dateKey) ?? [];
      group.push(entry);
      groups.set(dateKey, group);
    }
    return groups;
  }, [entries]);

  const categoryGroups = useMemo(() => {
    const groups = new Map<string, ChangeEntry[]>();
    for (const entry of entries) {
      const tweak = tweakMap.get(entry.tweak_id);
      const cat = tweak?.category ?? "Other";
      const group = groups.get(cat) ?? [];
      group.push(entry);
      groups.set(cat, group);
    }
    return groups;
  }, [entries, tweakMap]);

  const handleUndoAll = async () => {
    setLoading(true);
    try {
      await undoAll();
      const updated = await getChangeLog();
      setEntries(updated);
    } finally {
      setLoading(false);
      setShowRollbackConfirm(false);
    }
  };

  const handleUndoCategory = async (category: string) => {
    setUndoingCategory(category);
    try {
      const catEntries = categoryGroups.get(category) ?? [];
      const appliedIds = new Set<string>();
      for (const entry of catEntries) {
        if (entry.action === "Applied") appliedIds.add(entry.tweak_id);
        if (entry.action === "Reverted") appliedIds.delete(entry.tweak_id);
      }
      for (const id of appliedIds) {
        await revertTweak(id);
      }
      const updated = await getChangeLog();
      setEntries(updated);
    } finally {
      setUndoingCategory(null);
    }
  };

  const handleExport = async () => {
    try {
      const json = await exportChanges();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "readypc-backup.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Export can fail silently
    }
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async () => {
      // Import would call a Tauri command to restore backup
    };
    input.click();
  };

  const toggleDateGroup = (dateKey: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateKey)) next.delete(dateKey);
      else next.add(dateKey);
      return next;
    });
  };

  const formatAction = (action: ChangeEntry["action"]) => {
    if (action === "Applied")
      return (
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 font-medium">
          Applied
        </span>
      );
    if (action === "Reverted")
      return (
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 font-medium">
          Reverted
        </span>
      );
    if (typeof action === "object" && "ProfileApplied" in action)
      return (
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 font-medium">
          Profile: {action.ProfileApplied.profile_name}
        </span>
      );
    if (typeof action === "object" && "ProfileReverted" in action)
      return (
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 font-medium">
          Profile Reverted: {action.ProfileReverted.profile_name}
        </span>
      );
    return <span className="text-surface-400 text-[11px]">Unknown</span>;
  };

  const getRiskBadge = (tweakId: string) => {
    const tweak = tweakMap.get(tweakId);
    if (!tweak) return null;
    const color =
      tweak.risk_level === "Safe"
        ? "bg-green-500/15 text-green-400"
        : tweak.risk_level === "Moderate"
          ? "bg-yellow-500/15 text-yellow-400"
          : "bg-red-500/15 text-red-400";
    return <span className={`text-[10px] px-1.5 py-0.5 rounded ${color}`}>{tweak.risk_level}</span>;
  };

  const getTweakLabels = (tweakId: string) => {
    const tweak = tweakMap.get(tweakId);
    if (!tweak) return null;
    const hasLabels = tweak.requires_reboot || tweak.requires_admin;
    if (!hasLabels) return null;
    return (
      <div className="flex gap-1 mt-1">
        {tweak.requires_reboot && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
            Requires restart
          </span>
        )}
        {tweak.requires_admin && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Admin required
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl space-y-6 stagger-children">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Undo & Safety</h1>
          <p className="text-surface-400 text-sm mt-1">
            Review changes, undo actions, and export backups
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setAuditMode(!auditMode)}
            className={`btn-ghost text-sm flex items-center gap-2 ${auditMode ? "text-accent border-accent/30" : ""}`}
            title="Audit mode — read-only view"
          >
            {auditMode ? <EyeOff size={14} /> : <Eye size={14} />}
            {auditMode ? "Exit Audit" : "Audit Mode"}
          </button>
          <button
            onClick={handleImport}
            className="btn-ghost text-sm flex items-center gap-2"
            disabled={auditMode}
          >
            <Upload size={14} /> Import
          </button>
          <button
            onClick={handleExport}
            className="btn-secondary px-3 py-2 text-sm flex items-center gap-2"
          >
            <Download size={14} /> Export Backup
          </button>
          {!auditMode && (
            <button
              onClick={() => setShowRollbackConfirm(true)}
              disabled={loading || entries.length === 0}
              className="bg-red-500/10 text-red-400 hover:bg-red-500/20 px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
            >
              <RotateCcw size={14} />
              {loading ? "Undoing..." : "Full Rollback"}
            </button>
          )}
        </div>
      </div>

      {/* Safety Banner */}
      <div className="card card-animated p-4 border-accent/20 bg-accent/5">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-accent" />
          <span className="text-sm text-accent font-medium">All changes are reversible</span>
        </div>
        <p className="text-xs text-surface-400 mt-1">
          ReadyPC backs up every setting before changing it. You can undo any change at any time.
        </p>
      </div>

      {auditMode && (
        <div className="card card-animated p-3 border-yellow-500/20 bg-yellow-500/5">
          <div className="flex items-center gap-2">
            <Eye size={14} className="text-yellow-400" />
            <span className="text-xs text-yellow-400 font-medium">
              Audit Mode — Read-only view. No changes can be made.
            </span>
          </div>
        </div>
      )}

      {/* Undo by Category */}
      {!auditMode && categoryGroups.size > 0 && (
        <div className="card card-animated p-5">
          <div className="flex items-center gap-2 mb-3">
            <Tag size={16} className="text-accent" />
            <h2 className="text-base font-semibold text-white">Undo by Category</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {Array.from(categoryGroups.entries()).map(([cat, catEntries]) => {
              const isUndoing = undoingCategory === cat;
              return (
                <div
                  key={cat}
                  className="flex items-center justify-between p-3 rounded-lg bg-surface-800/50"
                >
                  <div>
                    <div className="text-sm font-medium text-white">{cat}</div>
                    <div className="text-xs text-surface-500">{catEntries.length} changes</div>
                  </div>
                  <button
                    onClick={() => handleUndoCategory(cat)}
                    disabled={isUndoing}
                    className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-1.5"
                  >
                    {isUndoing ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <RotateCcw size={12} />
                    )}
                    Undo All
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={16} className="text-accent" />
          <h2 className="text-base font-semibold text-white">Change Timeline</h2>
          <span className="text-xs text-surface-500">{entries.length} total changes</span>
        </div>

        {entries.length === 0 && (
          <div className="card card-animated text-center py-12">
            <Shield size={32} className="text-surface-600 mx-auto mb-3" />
            <p className="text-surface-400 text-sm">No changes have been made yet.</p>
            <p className="text-surface-600 text-xs mt-1">
              Changes will appear here as you apply tweaks and profiles.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {Array.from(dateGroups.entries()).map(([dateKey, dateEntries]) => {
            const isExpanded = expandedDates.has(dateKey) || dateGroups.size <= 3;
            return (
              <div key={dateKey}>
                <button
                  onClick={() => toggleDateGroup(dateKey)}
                  className="flex items-center gap-2 w-full text-left mb-2 group"
                >
                  <div className="h-px flex-1 bg-surface-800" />
                  <span className="text-xs font-medium text-surface-400 group-hover:text-surface-300 transition-colors flex items-center gap-1.5 shrink-0">
                    {dateKey}
                    <span className="text-surface-600">({dateEntries.length})</span>
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </span>
                  <div className="h-px flex-1 bg-surface-800" />
                </button>

                {isExpanded && (
                  <div className="space-y-1.5 pl-4 border-l-2 border-surface-800 ml-2">
                    {dateEntries.map((entry) => (
                      <div key={entry.id} className="card card-animated p-3 ml-2 relative">
                        <div className="absolute -left-[calc(0.5rem+1.5px)] top-4 w-2 h-2 rounded-full bg-surface-700 border-2 border-surface-900" />
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-white">
                                {entry.tweak_name}
                              </span>
                              {formatAction(entry.action)}
                              {getRiskBadge(entry.tweak_id)}
                            </div>
                            <div className="text-[11px] text-surface-500 mt-0.5">
                              {new Date(entry.timestamp).toLocaleTimeString()}
                            </div>
                            {getTweakLabels(entry.tweak_id)}
                          </div>
                        </div>
                        {entry.details.length > 0 && (
                          <div className="mt-2 space-y-0.5">
                            {entry.details.map((d, i) => (
                              <div
                                key={i}
                                className="text-[11px] text-surface-600 flex items-start gap-1.5"
                              >
                                <span className="text-surface-700 shrink-0">&bull;</span>
                                <span>{d}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Full Rollback Confirmation Modal */}
      {showRollbackConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-900 border border-surface-800 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-red-500/10">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Full Rollback to Defaults</h2>
            </div>
            <p className="text-sm text-surface-400 mb-2">
              This will revert{" "}
              <strong className="text-white">{entries.length} changes</strong> and restore all
              settings to their original values.
            </p>
            <p className="text-xs text-surface-500 mb-6">
              Some changes may require a system restart to take effect.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowRollbackConfirm(false)}
                className="btn-ghost text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleUndoAll}
                disabled={loading}
                className="bg-red-500/10 text-red-400 hover:bg-red-500/20 px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
              >
                {loading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <RotateCcw size={14} />
                )}
                Confirm Rollback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
