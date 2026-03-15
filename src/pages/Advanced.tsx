import { useEffect, useState, useMemo } from "react";
import {
  Filter,
  Code,
  FileJson,
  Download,
  Eye,
  EyeOff,
  Tag,
  Shield,
  RefreshCw,
  ShieldCheck,
  BarChart3,
  Wand2,
} from "lucide-react";
import { useTweakStore } from "../stores/tweakStore";
import { useSystemStore } from "../stores/systemStore";
import { useScanStore } from "../stores/scanStore";
import { getChangeLog } from "../lib/tauri";
import type { TweakDefinition, ChangeEntry } from "../lib/types";
import TweakCard from "../components/tweaks/TweakCard";
import SearchBar from "../components/common/SearchBar";
import Modal from "../components/common/Modal";
import SymptomWizard from "../components/wizard/SymptomWizard";

export default function Advanced() {
  const {
    tweaks,
    statuses,
    fetchTweaks,
    fetchStatuses,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedRisk,
    setSelectedRisk,
    getFilteredTweaks,
  } = useTweakStore();

  const { systemInfo, hardwareInfo, fetchSystemInfo, fetchHardwareInfo } =
    useSystemStore();
  const { scanResult, runScan } = useScanStore();

  const [rebootFilter, setRebootFilter] = useState(false);
  const [adminFilter, setAdminFilter] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [dryRun, setDryRun] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [jsonModal, setJsonModal] = useState(false);
  const [diagnosticModal, setDiagnosticModal] = useState(false);
  const [wizardModal, setWizardModal] = useState(false);
  const [changeLog, setChangeLog] = useState<ChangeEntry[]>([]);

  useEffect(() => {
    fetchTweaks();
    fetchStatuses();
    fetchSystemInfo();
    fetchHardwareInfo();
    getChangeLog()
      .then(setChangeLog)
      .catch(() => {});
  }, []);

  const categories = useMemo(
    () => [...new Set(tweaks.map((t) => t.category))],
    [tweaks],
  );
  const risks = ["Safe", "Moderate", "Advanced"] as const;

  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of tweaks) {
      for (const tag of t.tags ?? []) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag]) => tag);
  }, [tweaks]);

  const baseFiltered = getFilteredTweaks();

  const filtered = useMemo(() => {
    return baseFiltered.filter((t) => {
      if (rebootFilter && !t.requires_reboot) return false;
      if (adminFilter && !t.requires_admin) return false;
      if (selectedTags.size > 0) {
        if (!t.tags?.some((tag) => selectedTags.has(tag))) return false;
      }
      return true;
    });
  }, [baseFiltered, rebootFilter, adminFilter, selectedTags]);

  const appliedIds = useMemo(
    () => new Set(statuses.filter((s) => s.applied).map((s) => s.tweak_id)),
    [statuses],
  );

  const stats = useMemo(() => {
    const byCategory = new Map<string, { total: number; applied: number }>();
    for (const t of tweaks) {
      const entry = byCategory.get(t.category) ?? { total: 0, applied: 0 };
      entry.total++;
      if (appliedIds.has(t.id)) entry.applied++;
      byCategory.set(t.category, entry);
    }
    return {
      total: tweaks.length,
      applied: appliedIds.size,
      byCategory,
    };
  }, [tweaks, appliedIds]);

  function toggleTag(tag: string) {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  function exportTweaksJson() {
    const json = JSON.stringify(tweaks, null, 2);
    downloadJson(json, "readypc-tweaks.json");
  }

  function exportDiagnosticBundle() {
    const bundle = {
      exported_at: new Date().toISOString(),
      system_info: systemInfo,
      hardware_info: hardwareInfo,
      applied_tweaks: statuses.filter((s) => s.applied),
      all_tweaks_count: tweaks.length,
      change_log: changeLog,
      scan_result: scanResult,
    };
    downloadJson(JSON.stringify(bundle, null, 2), "readypc-diagnostic.json");
  }

  function downloadJson(json: string, filename: string) {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function formatAction(action: unknown): string {
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

  return (
    <div className="space-y-6 stagger-children">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Advanced</h1>
          <p className="text-surface-400 text-sm mt-1">
            Search, filter, and browse all tweaks with full details
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWizardModal(true)}
            className="btn-primary btn-animated text-xs"
          >
            <Wand2 size={14} />
            Symptom Wizard
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card card-animated p-4">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 size={14} className="text-accent" />
            <span className="text-xs text-surface-500 uppercase tracking-wider font-medium">
              Total Tweaks
            </span>
          </div>
          <p className="text-xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="card card-animated p-4">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={14} className="text-success" />
            <span className="text-xs text-surface-500 uppercase tracking-wider font-medium">
              Applied
            </span>
          </div>
          <p className="text-xl font-bold text-success">{stats.applied}</p>
        </div>
        <div className="card card-animated p-4 col-span-2">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={14} className="text-surface-400" />
            <span className="text-xs text-surface-500 uppercase tracking-wider font-medium">
              By Category
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {[...stats.byCategory.entries()].map(([cat, data]) => (
              <span key={cat} className="text-xs text-surface-300">
                {cat}{" "}
                <span className="text-surface-500">
                  {data.applied}/{data.total}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Search */}
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search tweaks by name, description, or tag..."
      />

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-ghost text-xs ${showFilters ? "bg-surface-800 text-white" : ""}`}
        >
          <Filter size={14} />
          Filters
        </button>

        <div className="h-5 w-px bg-surface-800" />

        <button
          onClick={() => setDryRun(!dryRun)}
          className={`btn-ghost text-xs ${dryRun ? "bg-accent/10 text-accent" : ""}`}
          title="Dry-run mode: preview what would change"
        >
          {dryRun ? <Eye size={14} /> : <EyeOff size={14} />}
          Dry Run {dryRun ? "ON" : "OFF"}
        </button>

        <div className="h-5 w-px bg-surface-800" />

        <button onClick={exportTweaksJson} className="btn-ghost text-xs">
          <FileJson size={14} />
          Export Tweaks
        </button>

        <button onClick={exportDiagnosticBundle} className="btn-ghost text-xs">
          <Download size={14} />
          Diagnostic Bundle
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="card card-animated p-5 space-y-4">
          {/* Category */}
          <div>
            <p className="text-[11px] text-surface-500 uppercase tracking-wider font-medium mb-2">
              Category
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                  !selectedCategory
                    ? "bg-accent/20 text-accent"
                    : "bg-surface-800 text-surface-400 hover:text-surface-300"
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() =>
                    setSelectedCategory(
                      cat === selectedCategory ? null : cat,
                    )
                  }
                  className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                    selectedCategory === cat
                      ? "bg-accent/20 text-accent"
                      : "bg-surface-800 text-surface-400 hover:text-surface-300"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Risk Level */}
          <div>
            <p className="text-[11px] text-surface-500 uppercase tracking-wider font-medium mb-2">
              Risk Level
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedRisk(null)}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                  !selectedRisk
                    ? "bg-accent/20 text-accent"
                    : "bg-surface-800 text-surface-400 hover:text-surface-300"
                }`}
              >
                All
              </button>
              {risks.map((risk) => (
                <button
                  key={risk}
                  onClick={() =>
                    setSelectedRisk(risk === selectedRisk ? null : risk)
                  }
                  className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                    selectedRisk === risk
                      ? "bg-accent/20 text-accent"
                      : "bg-surface-800 text-surface-400 hover:text-surface-300"
                  }`}
                >
                  {risk}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rebootFilter}
                onChange={(e) => setRebootFilter(e.target.checked)}
                className="accent-accent"
              />
              <span className="text-xs text-surface-300">
                <RefreshCw size={12} className="inline mr-1" />
                Reboot Required
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={adminFilter}
                onChange={(e) => setAdminFilter(e.target.checked)}
                className="accent-accent"
              />
              <span className="text-xs text-surface-300">
                <Shield size={12} className="inline mr-1" />
                Admin Required
              </span>
            </label>
          </div>

          {/* Tags */}
          {allTags.length > 0 && (
            <div>
              <p className="text-[11px] text-surface-500 uppercase tracking-wider font-medium mb-2">
                <Tag size={10} className="inline mr-1" />
                Tags
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-0.5 text-[11px] rounded-full border transition-colors ${
                      selectedTags.has(tag)
                        ? "bg-accent/15 border-accent/30 text-accent"
                        : "bg-surface-800 border-surface-700 text-surface-400 hover:text-surface-300"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Result count */}
      <div className="text-xs text-surface-500">
        {filtered.length} of {tweaks.length} tweaks shown
        {dryRun && (
          <span className="ml-2 text-accent font-medium">
            ● Dry-run mode active
          </span>
        )}
      </div>

      {/* Tweak list */}
      <div className="space-y-3">
        {filtered.map((tweak) => (
          <div key={tweak.id}>
            <TweakCard
              tweak={tweak}
              applied={appliedIds.has(tweak.id)}
              onStatusChange={() => fetchStatuses()}
            />
            {dryRun && (
              <DryRunDetail tweak={tweak} formatAction={formatAction} />
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-surface-500 text-sm">
              No tweaks match your filters
            </p>
          </div>
        )}
      </div>

      {/* Export Tweaks JSON Modal */}
      <Modal
        open={jsonModal}
        onClose={() => setJsonModal(false)}
        title="All Tweaks (JSON)"
        maxWidth="max-w-2xl"
      >
        <pre className="text-xs text-surface-300 bg-surface-950 rounded-lg p-4 overflow-auto max-h-96 font-mono">
          {JSON.stringify(tweaks, null, 2)}
        </pre>
      </Modal>

      {/* Diagnostic Modal */}
      <Modal
        open={diagnosticModal}
        onClose={() => setDiagnosticModal(false)}
        title="Diagnostic Bundle"
        maxWidth="max-w-2xl"
      >
        <pre className="text-xs text-surface-300 bg-surface-950 rounded-lg p-4 overflow-auto max-h-96 font-mono">
          {JSON.stringify(
            {
              system_info: systemInfo,
              hardware_info: hardwareInfo,
              applied_tweaks: statuses.filter((s) => s.applied),
              change_log: changeLog,
            },
            null,
            2,
          )}
        </pre>
      </Modal>

      {/* Symptom Wizard Modal */}
      <Modal
        open={wizardModal}
        onClose={() => setWizardModal(false)}
        title="Symptom Wizard"
        maxWidth="max-w-2xl"
      >
        <SymptomWizard onClose={() => setWizardModal(false)} />
      </Modal>
    </div>
  );
}

function DryRunDetail({
  tweak,
  formatAction,
}: {
  tweak: TweakDefinition;
  formatAction: (action: unknown) => string;
}) {
  if (!tweak.actions || tweak.actions.length === 0) return null;

  return (
    <div className="ml-5 mt-1 mb-3 pl-4 border-l-2 border-accent/20">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Code size={12} className="text-accent" />
        <span className="text-[11px] text-accent font-medium">
          System actions (preview)
        </span>
      </div>
      <div className="space-y-1">
        {tweak.actions.map((action, i) => (
          <p
            key={i}
            className="text-[11px] text-surface-400 font-mono bg-surface-950 rounded px-2 py-1"
          >
            {formatAction(action)}
          </p>
        ))}
      </div>
    </div>
  );
}
