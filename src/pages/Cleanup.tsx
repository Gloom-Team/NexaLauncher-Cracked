import { useEffect, useState, useMemo } from "react";
import {
  Trash2,
  HardDrive,
  FileSearch,
  RefreshCw,
  Gamepad2,
  BarChart3,
  History,
  Clock,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  FileText,
  Globe,
  Package,
  Thermometer,
  Download,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { scanCleanupTargets, executeCleanup, scanLargeFiles, getHardwareInfo, getDiskUsageMap } from "../lib/tauri";
import type { CleanupTarget, CleanupResult, LargeFile, StorageInfo, DiskUsageEntry } from "../lib/types";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatGB(gb: number): string {
  return gb >= 1000 ? `${(gb / 1000).toFixed(1)} TB` : `${gb.toFixed(1)} GB`;
}

interface CleanupHistoryEntry {
  timestamp: Date;
  freedBytes: number;
  filesRemoved: number;
  errors: number;
}

const SAFE_GAME_TARGET_KEYWORDS = ["temp", "cache", "thumbnail", "shader", "crash", "log", "dump", "update"];

function getTargetIcon(target: CleanupTarget) {
  const name = target.name.toLowerCase();
  if (name.includes("temp")) return Thermometer;
  if (name.includes("browser") || name.includes("chrome") || name.includes("firefox") || name.includes("edge")) return Globe;
  if (name.includes("log")) return FileText;
  if (name.includes("download")) return Download;
  if (name.includes("cache")) return FolderOpen;
  if (name.includes("update")) return Package;
  return Trash2;
}

function getDriveUsagePct(drive: StorageInfo): number {
  if (drive.total_gb === 0) return 0;
  return Math.round(((drive.total_gb - drive.free_gb) / drive.total_gb) * 100);
}

function getDriveBarColor(pct: number): string {
  if (pct >= 90) return "bg-red-500";
  if (pct >= 75) return "bg-orange-400";
  if (pct >= 50) return "bg-yellow-400";
  return "bg-accent";
}

export default function Cleanup() {
  const [targets, setTargets] = useState<CleanupTarget[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<CleanupResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [largeFiles, setLargeFiles] = useState<LargeFile[]>([]);
  const [drives, setDrives] = useState<StorageInfo[]>([]);
  const [diskUsage, setDiskUsage] = useState<DiskUsageEntry[]>([]);
  const [diskUsageLoading, setDiskUsageLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"cleanup" | "large" | "usage">("cleanup");
  const [history, setHistory] = useState<CleanupHistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const scan = async () => {
    setScanning(true);
    try {
      const t = await scanCleanupTargets();
      setTargets(t);
      setSelected(new Set(t.filter((x) => x.risk === "Safe").map((x) => x.id)));
    } finally {
      setScanning(false);
    }
  };

  const fetchDrives = async () => {
    try {
      const hw = await getHardwareInfo();
      setDrives(hw.storage ?? []);
    } catch {
      /* hardware info may fail */
    }
  };

  useEffect(() => {
    scan();
    fetchDrives();
  }, []);

  const handleCleanup = async () => {
    setCleaning(true);
    try {
      const r = await executeCleanup(Array.from(selected));
      setResult(r);
      setHistory((prev) => [
        {
          timestamp: new Date(),
          freedBytes: r.cleaned_bytes,
          filesRemoved: r.files_removed,
          errors: r.errors.length,
        },
        ...prev,
      ]);
      await scan();
      await fetchDrives();
    } finally {
      setCleaning(false);
    }
  };

  const handleScanLarge = async () => {
    setScanning(true);
    try {
      const files = await scanLargeFiles(100, "C:\\");
      setLargeFiles(files);
    } finally {
      setScanning(false);
    }
  };

  const handleDiskUsageMap = async (driveLetter: string) => {
    setActiveTab("usage");
    setDiskUsageLoading(true);
    try {
      const entries = await getDiskUsageMap(`${driveLetter}\\`);
      setDiskUsage(entries);
    } catch {
      setDiskUsage([]);
    } finally {
      setDiskUsageLoading(false);
    }
  };

  const handlePreGameCleanup = () => {
    const gameTargets = targets.filter((t) => {
      if (t.risk !== "Safe") return false;
      const lower = t.name.toLowerCase() + " " + t.description.toLowerCase();
      return SAFE_GAME_TARGET_KEYWORDS.some((kw) => lower.includes(kw));
    });
    setSelected(new Set(gameTargets.map((t) => t.id)));
  };

  const totalSelected = targets
    .filter((t) => selected.has(t.id))
    .reduce((a, t) => a + t.estimated_size_bytes, 0);
  const totalReclaimable = targets.reduce((a, t) => a + t.estimated_size_bytes, 0);

  const safeTargets = useMemo(() => targets.filter((t) => t.risk === "Safe"), [targets]);
  const cautionTargets = useMemo(() => targets.filter((t) => t.risk !== "Safe"), [targets]);

  return (
    <div className="max-w-4xl space-y-6 stagger-children">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">System Cleanup</h1>
        <p className="text-surface-400 text-sm mt-1">
          Free up disk space and remove unnecessary files safely.
        </p>
      </div>

      {/* Storage health overview */}
      {drives.length > 0 && (
        <div className="card card-animated p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive size={16} className="text-accent" />
              <h2 className="text-sm font-semibold text-white">Storage Health</h2>
            </div>
          </div>
          <div className="grid gap-3">
            {drives.map((drive) => {
              const usedGb = drive.total_gb - drive.free_gb;
              const pct = getDriveUsagePct(drive);
              return (
                <div key={drive.drive_letter} className="flex items-center gap-4">
                  <div className="flex items-center gap-2 w-24 shrink-0">
                    <HardDrive size={14} className={pct >= 90 ? "text-red-400" : "text-surface-400"} />
                    <span className="text-sm font-medium text-white">
                      {drive.drive_letter}:\
                    </span>
                    {drive.is_system_drive && (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-accent/10 text-accent">OS</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="w-full h-3 rounded-full bg-surface-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 progress-animated ${getDriveBarColor(pct)}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right w-36 shrink-0">
                    <span className="text-xs text-surface-300">
                      {formatGB(usedGb)} / {formatGB(drive.total_gb)}
                    </span>
                    <span className={`text-xs ml-2 ${pct >= 90 ? "text-red-400" : pct >= 75 ? "text-orange-400" : "text-surface-500"}`}>
                      {pct}%
                    </span>
                  </div>
                  <button
                    onClick={() => handleDiskUsageMap(drive.drive_letter)}
                    className="text-xs text-accent hover:text-accent/80 transition-colors shrink-0"
                    title="What's taking up space?"
                  >
                    <BarChart3 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
          <div className="text-xs text-surface-500">
            {drives.reduce((a, d) => a + d.free_gb, 0).toFixed(1)} GB free across all drives
            {" · "}
            {drives.map((d) => `${d.drive_letter}: ${d.storage_type}`).join(", ")}
          </div>
        </div>
      )}

      {/* Cleanup result banner */}
      {result && (
        <div className="card card-animated p-4 border-green-500/30 bg-green-500/5 flex items-center gap-3">
          <CheckCircle2 size={18} className="text-green-400 shrink-0" />
          <div className="text-sm text-green-400">
            Cleanup complete: freed {formatBytes(result.cleaned_bytes)}, removed {result.files_removed} files
            {result.errors.length > 0 && (
              <span className="text-orange-400"> ({result.errors.length} errors)</span>
            )}
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-2 border-b border-surface-800 pb-2">
        <button
          onClick={() => setActiveTab("cleanup")}
          className={`px-4 py-2 text-sm rounded-lg flex items-center gap-2 transition-colors ${
            activeTab === "cleanup" ? "bg-accent/10 text-accent" : "text-surface-400 hover:text-surface-300"
          }`}
        >
          <Trash2 size={14} />
          Cleanup
        </button>
        <button
          onClick={() => { setActiveTab("large"); handleScanLarge(); }}
          className={`px-4 py-2 text-sm rounded-lg flex items-center gap-2 transition-colors ${
            activeTab === "large" ? "bg-accent/10 text-accent" : "text-surface-400 hover:text-surface-300"
          }`}
        >
          <FileSearch size={14} />
          Large Files
        </button>
        <button
          onClick={() => setActiveTab("usage")}
          className={`px-4 py-2 text-sm rounded-lg flex items-center gap-2 transition-colors ${
            activeTab === "usage" ? "bg-accent/10 text-accent" : "text-surface-400 hover:text-surface-300"
          }`}
        >
          <BarChart3 size={14} />
          Disk Usage
        </button>
      </div>

      {/* Cleanup tab */}
      {activeTab === "cleanup" && (
        <>
          {/* Action bar */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <span className="text-sm text-surface-400">
                Selected: <span className="text-white font-medium">{formatBytes(totalSelected)}</span>
              </span>
              <span className="text-xs text-surface-600">
                {formatBytes(totalReclaimable)} total reclaimable
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePreGameCleanup}
                className="btn-secondary px-3 py-1.5 text-sm flex items-center gap-1.5"
                title="Select safe, game-relevant cleanup targets"
              >
                <Gamepad2 size={14} />
                Pre-Game Cleanup
              </button>
              <button
                onClick={scan}
                disabled={scanning}
                className="btn-secondary px-3 py-1.5 text-sm flex items-center gap-1.5"
              >
                <RefreshCw size={14} className={scanning ? "animate-spin" : ""} />
                Rescan
              </button>
              <button
                onClick={handleCleanup}
                disabled={cleaning || selected.size === 0}
                className="btn-primary btn-animated px-4 py-1.5 text-sm flex items-center gap-1.5"
              >
                {cleaning ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Cleaning…
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Clean Selected
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Safe targets */}
          {safeTargets.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-green-400" />
                Safe to Clean
              </h3>
              {safeTargets.map((target) => {
                const Icon = getTargetIcon(target);
                return (
                  <label key={target.id} className="card card-animated p-4 flex items-center gap-4 cursor-pointer hover:bg-surface-800/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={selected.has(target.id)}
                      onChange={(e) => {
                        const next = new Set(selected);
                        e.target.checked ? next.add(target.id) : next.delete(target.id);
                        setSelected(next);
                      }}
                      className="rounded border-surface-600 accent-accent"
                    />
                    <div className="h-8 w-8 rounded-lg bg-surface-800 flex items-center justify-center shrink-0">
                      <Icon size={16} className="text-surface-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white">{target.name}</div>
                      <div className="text-xs text-surface-500">{target.description}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-medium text-white">{formatBytes(target.estimated_size_bytes)}</div>
                      <div className="text-xs text-surface-500">{target.file_count} files</div>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 shrink-0">
                      Safe
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          {/* Caution targets */}
          {cautionTargets.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle size={12} className="text-yellow-400" />
                Use Caution
              </h3>
              {cautionTargets.map((target) => {
                const Icon = getTargetIcon(target);
                return (
                  <label key={target.id} className="card card-animated p-4 flex items-center gap-4 cursor-pointer hover:bg-surface-800/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={selected.has(target.id)}
                      onChange={(e) => {
                        const next = new Set(selected);
                        e.target.checked ? next.add(target.id) : next.delete(target.id);
                        setSelected(next);
                      }}
                      className="rounded border-surface-600 accent-accent"
                    />
                    <div className="h-8 w-8 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
                      <Icon size={16} className="text-yellow-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white">{target.name}</div>
                      <div className="text-xs text-surface-500">{target.description}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-medium text-white">{formatBytes(target.estimated_size_bytes)}</div>
                      <div className="text-xs text-surface-500">{target.file_count} files</div>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 shrink-0">
                      {target.risk}
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          {targets.length === 0 && !scanning && (
            <div className="card card-animated p-8 text-center">
              <CheckCircle2 size={32} className="text-surface-600 mx-auto mb-3" />
              <p className="text-surface-400 text-sm">No cleanup targets found. Your system is already tidy!</p>
            </div>
          )}
        </>
      )}

      {/* Large files tab */}
      {activeTab === "large" && (
        <div className="space-y-2">
          {scanning && (
            <div className="card card-animated p-4 flex items-center gap-3">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
              <p className="text-surface-400 text-sm">Scanning for large files…</p>
            </div>
          )}
          {!scanning && largeFiles.length === 0 && (
            <div className="card card-animated p-8 text-center">
              <FileSearch size={32} className="text-surface-600 mx-auto mb-3" />
              <p className="text-surface-400 text-sm">No large files found over 100 MB.</p>
            </div>
          )}
          {largeFiles.map((file, i) => (
            <div key={i} className="card card-animated p-3 flex items-center gap-3">
              <FileSearch size={14} className="text-surface-400" />
              <span className="text-sm text-white flex-1 truncate" title={file.path}>{file.path}</span>
              <span className="text-sm font-medium text-accent shrink-0">{formatBytes(file.size_bytes)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Disk usage map tab */}
      {activeTab === "usage" && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            {drives.map((d) => (
              <button
                key={d.drive_letter}
                onClick={() => handleDiskUsageMap(d.drive_letter)}
                className="btn-secondary px-3 py-1.5 text-sm flex items-center gap-1.5"
              >
                <HardDrive size={14} />
                {d.drive_letter}:\
              </button>
            ))}
          </div>

          {diskUsageLoading && (
            <div className="card card-animated p-4 flex items-center gap-3">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
              <p className="text-surface-400 text-sm">Analyzing disk usage…</p>
            </div>
          )}

          {!diskUsageLoading && diskUsage.length > 0 && (
            <div className="space-y-1">
              {diskUsage
                .sort((a, b) => b.size_bytes - a.size_bytes)
                .slice(0, 25)
                .map((entry, i) => {
                  const maxSize = diskUsage[0]?.size_bytes ?? 1;
                  const barPct = (entry.size_bytes / maxSize) * 100;
                  return (
                    <div key={i} className="card card-animated p-3 flex items-center gap-3">
                      {entry.is_directory ? (
                        <FolderOpen size={14} className="text-accent shrink-0" />
                      ) : (
                        <FileText size={14} className="text-surface-400 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white truncate" title={entry.path}>{entry.path}</div>
                        <div className="w-full h-1.5 rounded-full bg-surface-800 overflow-hidden mt-1">
                          <div
                            className="h-full rounded-full bg-accent/60 progress-animated"
                            style={{ width: `${barPct}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium text-accent shrink-0">{formatBytes(entry.size_bytes)}</span>
                    </div>
                  );
                })}
            </div>
          )}

          {!diskUsageLoading && diskUsage.length === 0 && (
            <div className="card card-animated p-8 text-center">
              <BarChart3 size={32} className="text-surface-600 mx-auto mb-3" />
              <p className="text-surface-400 text-sm">
                Select a drive above to see what's taking up space.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Cleanup history section */}
      {history.length > 0 && (
        <div className="card card-animated overflow-hidden">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center gap-3 p-4 text-left hover:bg-surface-800/30 transition-colors"
          >
            <History size={16} className="text-surface-400" />
            <span className="text-sm font-semibold text-white flex-1">Cleanup History</span>
            <span className="text-xs text-surface-500">{history.length} session{history.length !== 1 ? "s" : ""}</span>
            {showHistory ? (
              <ChevronDown size={16} className="text-surface-500" />
            ) : (
              <ChevronRight size={16} className="text-surface-500" />
            )}
          </button>

          {showHistory && (
            <div className="border-t border-surface-800 divide-y divide-surface-800">
              {history.map((entry, i) => (
                <div key={i} className="px-4 py-3 flex items-center gap-4">
                  <Clock size={14} className="text-surface-500 shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm text-white">
                      Freed {formatBytes(entry.freedBytes)} · {entry.filesRemoved} files removed
                    </div>
                    <div className="text-xs text-surface-500">
                      {entry.timestamp.toLocaleTimeString()} — {entry.timestamp.toLocaleDateString()}
                      {entry.errors > 0 && (
                        <span className="text-orange-400 ml-2">{entry.errors} error{entry.errors !== 1 ? "s" : ""}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
