import { useEffect, useState, useMemo } from "react";
import {
  Activity,
  Cpu,
  HardDrive,
  Monitor,
  Battery,
  BarChart3,
  Download,
  Camera,
  ArrowRightLeft,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Zap,
  TrendingDown,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { useSystemStore } from "../stores/systemStore";
import { useScanStore } from "../stores/scanStore";

export default function Diagnostics() {
  const {
    systemInfo,
    hardwareInfo,
    fetchSystemInfo,
    fetchHardwareInfo,
    processes,
    fetchProcesses,
    snapshots,
    fetchSnapshots,
    takeSnapshot,
  } = useSystemStore();
  const { scanResult, findings, bottleneck, runScan, fetchFindings, fetchBottleneck, scanning } =
    useScanStore();

  const [processSort, setProcessSort] = useState<"cpu" | "memory">("cpu");
  const [showAllProcesses, setShowAllProcesses] = useState(false);
  const [snapshotLabel, setSnapshotLabel] = useState("");
  const [takingSnapshot, setTakingSnapshot] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchSystemInfo();
    fetchHardwareInfo();
    fetchProcesses();
    fetchFindings();
    fetchBottleneck();
    fetchSnapshots();
  }, []);

  const sortedProcesses = useMemo(() => {
    const sorted = [...processes].sort((a, b) =>
      processSort === "cpu" ? b.cpu_percent - a.cpu_percent : b.memory_mb - a.memory_mb,
    );
    return showAllProcesses ? sorted : sorted.slice(0, 10);
  }, [processes, processSort, showAllProcesses]);

  const rankedFindings = useMemo(() => {
    const severityOrder: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    return [...findings].sort(
      (a, b) => (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4),
    );
  }, [findings]);

  const lastTwoSnapshots = useMemo(() => {
    const sorted = [...snapshots].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    return sorted.slice(0, 2);
  }, [snapshots]);

  const handleExportReport = async () => {
    setExporting(true);
    try {
      const report = {
        generated_at: new Date().toISOString(),
        system_info: systemInfo,
        hardware_info: hardwareInfo,
        scan_result: scanResult,
        findings,
        bottleneck,
        top_processes: [...processes]
          .sort((a, b) => b.cpu_percent - a.cpu_percent)
          .slice(0, 20),
        snapshots,
      };
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `readypc-diagnostics-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const handleTakeSnapshot = async () => {
    if (!snapshotLabel.trim()) return;
    setTakingSnapshot(true);
    try {
      await takeSnapshot(snapshotLabel.trim());
      setSnapshotLabel("");
    } finally {
      setTakingSnapshot(false);
    }
  };

  return (
    <div className="max-w-6xl space-y-6 stagger-children">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Diagnostics</h1>
          <p className="text-surface-400 text-sm mt-1">
            System information, hardware details, and health scores
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportReport}
            disabled={exporting}
            className="btn-secondary px-3 py-2 text-sm flex items-center gap-2"
          >
            <Download size={14} />
            {exporting ? "Exporting..." : "Export Report"}
          </button>
          <button onClick={runScan} disabled={scanning} className="btn-primary btn-animated px-4 py-2 text-sm">
            {scanning ? "Scanning..." : "Run Full Scan"}
          </button>
        </div>
      </div>

      {scanResult && (
        <div className="grid grid-cols-4 gap-4">
          <div className="card card-animated p-4 text-center">
            <div className="text-3xl font-bold text-accent">{scanResult.optimization_score}</div>
            <div className="text-xs text-surface-400 mt-1">Optimization Score</div>
          </div>
          <div className="card card-animated p-4 text-center">
            <div className="text-3xl font-bold text-green-400">
              {scanResult.easiest_wins.length}
            </div>
            <div className="text-xs text-surface-400 mt-1">Easy Wins</div>
          </div>
          <div className="card card-animated p-4 text-center">
            <div className="text-3xl font-bold text-yellow-400">
              {scanResult.highest_impact.length}
            </div>
            <div className="text-xs text-surface-400 mt-1">High Impact</div>
          </div>
          <div className="card card-animated p-4 text-center">
            <div className="text-lg font-bold text-purple-400">{bottleneck || "N/A"}</div>
            <div className="text-xs text-surface-400 mt-1">Bottleneck</div>
          </div>
        </div>
      )}

      {/* VBS / HAGS / Memory Integrity */}
      {hardwareInfo && (
        <div className="card card-animated p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={18} className="text-accent" />
            <h2 className="text-lg font-semibold text-white">Security & Performance Features</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div
              className={`flex items-center gap-3 p-3 rounded-lg ${hardwareInfo.os.vbs_enabled ? "bg-yellow-500/10" : "bg-green-500/10"}`}
            >
              {hardwareInfo.os.vbs_enabled ? (
                <ShieldAlert size={16} className="text-yellow-400" />
              ) : (
                <ShieldCheck size={16} className="text-green-400" />
              )}
              <div>
                <div className="text-sm font-medium text-white">VBS</div>
                <div
                  className={`text-xs ${hardwareInfo.os.vbs_enabled ? "text-yellow-400" : "text-green-400"}`}
                >
                  {hardwareInfo.os.vbs_enabled ? "Enabled" : "Disabled"}
                </div>
              </div>
            </div>
            <div
              className={`flex items-center gap-3 p-3 rounded-lg ${hardwareInfo.os.memory_integrity ? "bg-yellow-500/10" : "bg-green-500/10"}`}
            >
              {hardwareInfo.os.memory_integrity ? (
                <ShieldAlert size={16} className="text-yellow-400" />
              ) : (
                <ShieldCheck size={16} className="text-green-400" />
              )}
              <div>
                <div className="text-sm font-medium text-white">Memory Integrity</div>
                <div
                  className={`text-xs ${hardwareInfo.os.memory_integrity ? "text-yellow-400" : "text-green-400"}`}
                >
                  {hardwareInfo.os.memory_integrity ? "Enabled" : "Disabled"}
                </div>
              </div>
            </div>
            <div
              className={`flex items-center gap-3 p-3 rounded-lg ${hardwareInfo.os.hags_enabled ? "bg-green-500/10" : "bg-yellow-500/10"}`}
            >
              <Zap
                size={16}
                className={hardwareInfo.os.hags_enabled ? "text-green-400" : "text-yellow-400"}
              />
              <div>
                <div className="text-sm font-medium text-white">HAGS</div>
                <div
                  className={`text-xs ${hardwareInfo.os.hags_enabled ? "text-green-400" : "text-yellow-400"}`}
                >
                  {hardwareInfo.os.hags_enabled ? "Enabled" : "Disabled"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hardware Overview */}
      {hardwareInfo && (
        <div className="card card-animated p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Hardware Overview</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Cpu size={16} className="text-accent" />
              <div>
                <div className="text-sm text-white">{hardwareInfo.cpu.name}</div>
                <div className="text-xs text-surface-500">
                  {hardwareInfo.cpu.cores} cores, {hardwareInfo.cpu.threads} threads
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Monitor size={16} className="text-green-400" />
              <div>
                <div className="text-sm text-white">{hardwareInfo.gpu.name}</div>
                <div className="text-xs text-surface-500">
                  {hardwareInfo.gpu.is_integrated ? "Integrated" : "Discrete"}
                  {hardwareInfo.gpu.vram_mb ? `, ${hardwareInfo.gpu.vram_mb}MB VRAM` : ""}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <BarChart3 size={16} className="text-yellow-400" />
              <div>
                <div className="text-sm text-white">{hardwareInfo.ram.total_mb} MB RAM</div>
                <div className="text-xs text-surface-500">
                  {hardwareInfo.ram.speed_mhz ? `${hardwareInfo.ram.speed_mhz} MHz` : ""}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Battery size={16} className="text-blue-400" />
              <div>
                <div className="text-sm text-white">
                  {hardwareInfo.power.is_laptop ? "Laptop" : "Desktop"}
                </div>
                <div className="text-xs text-surface-500">
                  {hardwareInfo.power.current_power_plan}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-surface-400 mb-2">Storage</h3>
            <div className="space-y-2">
              {hardwareInfo.storage.map((drive, i) => (
                <div key={i} className="flex items-center gap-3">
                  <HardDrive size={14} className="text-surface-400" />
                  <span className="text-sm text-white">{drive.drive_letter}</span>
                  <span className="text-xs text-surface-500">
                    {drive.free_gb.toFixed(1)} GB free / {drive.total_gb.toFixed(1)} GB
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-700 text-surface-300">
                    {drive.storage_type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* What's Hurting Performance Most? */}
      {rankedFindings.length > 0 && (
        <div className="card card-animated p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown size={18} className="text-red-400" />
            <h2 className="text-lg font-semibold text-white">
              What's Hurting Performance Most?
            </h2>
          </div>
          <div className="space-y-2">
            {rankedFindings.slice(0, 8).map((f, idx) => (
              <div
                key={f.id}
                className="flex items-start gap-3 py-2.5 px-3 rounded-lg bg-surface-800/50"
              >
                <span className="text-sm font-bold text-surface-600 w-5 text-right shrink-0">
                  #{idx + 1}
                </span>
                <span
                  className={`mt-0.5 text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${
                    f.severity === "Critical"
                      ? "bg-red-500/20 text-red-400"
                      : f.severity === "High"
                        ? "bg-orange-500/20 text-orange-400"
                        : f.severity === "Medium"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-surface-700 text-surface-400"
                  }`}
                >
                  {f.severity}
                </span>
                <div className="min-w-0">
                  <div className="text-sm text-white">{f.title}</div>
                  <div className="text-xs text-surface-500">{f.description}</div>
                  {f.recommended_fix && (
                    <div className="text-xs text-accent mt-1">Fix: {f.recommended_fix}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Process Viewer */}
      <div className="card card-animated p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-accent" />
            <h2 className="text-lg font-semibold text-white">Top Processes</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => fetchProcesses()} className="btn-ghost text-xs px-2 py-1">
              <RefreshCw size={12} />
            </button>
            <div className="flex bg-surface-800 rounded-lg p-0.5">
              <button
                onClick={() => setProcessSort("cpu")}
                className={`text-xs px-3 py-1 rounded-md transition-colors ${processSort === "cpu" ? "bg-accent/20 text-accent" : "text-surface-400"}`}
              >
                CPU
              </button>
              <button
                onClick={() => setProcessSort("memory")}
                className={`text-xs px-3 py-1 rounded-md transition-colors ${processSort === "memory" ? "bg-accent/20 text-accent" : "text-surface-400"}`}
              >
                Memory
              </button>
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-3 px-3 py-1.5 text-[11px] font-medium text-surface-500 uppercase tracking-wider">
            <span className="flex-1">Process</span>
            <span className="w-16 text-right">PID</span>
            <span className="w-20 text-right">CPU %</span>
            <span className="w-20 text-right">Memory</span>
          </div>
          {sortedProcesses.map((p) => (
            <div
              key={`${p.name}-${p.pid}`}
              className="flex items-center gap-3 py-2 px-3 rounded-lg bg-surface-800/50"
            >
              <span className="text-sm text-white flex-1 truncate">{p.name}</span>
              <span className="w-16 text-right text-xs text-surface-500">{p.pid}</span>
              <span className="w-20 text-right">
                <span
                  className={`text-xs font-medium ${p.cpu_percent > 50 ? "text-red-400" : p.cpu_percent > 20 ? "text-yellow-400" : "text-surface-300"}`}
                >
                  {p.cpu_percent.toFixed(1)}%
                </span>
              </span>
              <span className="w-20 text-right text-xs text-surface-300">
                {p.memory_mb.toFixed(0)} MB
              </span>
            </div>
          ))}
          {processes.length > 10 && (
            <button
              onClick={() => setShowAllProcesses(!showAllProcesses)}
              className="btn-ghost text-xs mt-2 mx-auto flex items-center gap-1"
            >
              {showAllProcesses ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {showAllProcesses ? "Show Top 10" : `Show All (${processes.length})`}
            </button>
          )}
        </div>
      </div>

      {/* Snapshots & Before/After Comparison */}
      <div className="card card-animated p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-accent" />
            <h2 className="text-lg font-semibold text-white">Snapshots</h2>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={snapshotLabel}
              onChange={(e) => setSnapshotLabel(e.target.value)}
              placeholder="Snapshot label..."
              className="px-3 py-1.5 text-xs bg-surface-800/50 border border-surface-700 rounded-lg text-white placeholder:text-surface-600 focus:outline-none focus:border-accent/50"
              onKeyDown={(e) => e.key === "Enter" && handleTakeSnapshot()}
            />
            <button
              onClick={handleTakeSnapshot}
              disabled={takingSnapshot || !snapshotLabel.trim()}
              className="btn-primary btn-animated text-xs px-3 py-1.5"
            >
              {takingSnapshot ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Camera size={12} />
              )}
              Take Snapshot
            </button>
          </div>
        </div>

        {lastTwoSnapshots.length >= 2 && (
          <>
            <div className="flex items-center gap-2 mb-3">
              <ArrowRightLeft size={14} className="text-accent" />
              <span className="text-sm font-medium text-surface-300">
                Before / After Comparison
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {lastTwoSnapshots.map((snap, idx) => (
                <div
                  key={snap.id}
                  className={`p-4 rounded-lg border ${idx === 0 ? "bg-accent/5 border-accent/20" : "bg-surface-800/50 border-surface-700"}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-surface-400">
                      {idx === 0 ? "Latest" : "Previous"}
                    </span>
                    <span className="text-[11px] text-surface-500">
                      {new Date(snap.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-white mb-2">{snap.label}</div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-surface-400">Startup Apps</span>
                      <span className="text-white">{snap.startup_app_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-surface-400">Processes</span>
                      <span className="text-white">{snap.process_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-surface-400">RAM Used</span>
                      <span className="text-white">
                        {snap.ram_used_mb} / {snap.ram_total_mb} MB
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-surface-400">CPU Usage</span>
                      <span className="text-white">{snap.cpu_usage_percent.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-surface-400">Power Plan</span>
                      <span className="text-white">{snap.power_plan}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {(() => {
              const [latest, prev] = lastTwoSnapshots;
              const ramDiff = latest.ram_used_mb - prev.ram_used_mb;
              const cpuDiff = latest.cpu_usage_percent - prev.cpu_usage_percent;
              const procDiff = latest.process_count - prev.process_count;
              return (
                <div className="mt-3 flex gap-3">
                  <DiffBadge label="RAM" diff={ramDiff} unit="MB" reverse />
                  <DiffBadge label="CPU" diff={cpuDiff} unit="%" reverse />
                  <DiffBadge label="Processes" diff={procDiff} unit="" reverse />
                </div>
              );
            })()}
          </>
        )}

        {lastTwoSnapshots.length < 2 && (
          <p className="text-surface-500 text-sm text-center py-4">
            {snapshots.length === 0
              ? "Take your first snapshot to start tracking changes."
              : "Take one more snapshot to compare before/after."}
          </p>
        )}

        {snapshots.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-medium text-surface-400 mb-2">
              All Snapshots ({snapshots.length})
            </h3>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {[...snapshots]
                .sort(
                  (a, b) =>
                    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
                )
                .map((snap) => (
                  <div
                    key={snap.id}
                    className="flex items-center gap-3 py-1.5 px-3 rounded-lg bg-surface-800/30 text-xs"
                  >
                    <span className="text-surface-500 w-36 shrink-0">
                      {new Date(snap.timestamp).toLocaleString()}
                    </span>
                    <span className="text-white flex-1">{snap.label}</span>
                    <span className="text-surface-500">{snap.process_count} procs</span>
                    <span className="text-surface-500">{snap.ram_used_mb}MB</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* All System Findings */}
      {findings.length > 0 && (
        <div className="card card-animated p-5">
          <h2 className="text-lg font-semibold text-white mb-4">All System Findings</h2>
          <div className="space-y-2">
            {findings.map((f) => (
              <div
                key={f.id}
                className="flex items-start gap-3 py-2 px-3 rounded-lg bg-surface-800/50"
              >
                <span
                  className={`mt-0.5 text-xs px-1.5 py-0.5 rounded font-medium ${
                    f.severity === "Critical"
                      ? "bg-red-500/20 text-red-400"
                      : f.severity === "High"
                        ? "bg-orange-500/20 text-orange-400"
                        : f.severity === "Medium"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-surface-700 text-surface-400"
                  }`}
                >
                  {f.severity}
                </span>
                <div>
                  <div className="text-sm text-white">{f.title}</div>
                  <div className="text-xs text-surface-500">{f.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DiffBadge({
  label,
  diff,
  unit,
  reverse = false,
}: {
  label: string;
  diff: number;
  unit: string;
  reverse?: boolean;
}) {
  const isPositive = reverse ? diff < 0 : diff > 0;
  const isNeutral = diff === 0;
  const color = isNeutral ? "text-surface-500" : isPositive ? "text-green-400" : "text-red-400";
  const sign = diff > 0 ? "+" : "";

  return (
    <div className={`text-xs px-2.5 py-1 rounded-lg bg-surface-800/50 ${color}`}>
      {label}: {sign}
      {diff % 1 !== 0 ? diff.toFixed(1) : diff}
      {unit}
    </div>
  );
}
