import { useState, useEffect } from "react";
import {
  Cpu,
  MemoryStick,
  Activity,
  Zap,
  MonitorSmartphone,
  Camera,
  RefreshCw,
} from "lucide-react";
import StatCard from "@/components/system/StatCard";
import BeforeAfter from "@/components/system/BeforeAfter";
import { useSystemInfo, useProcesses } from "@/hooks/useSystem";
import { takeSnapshot, getSnapshots } from "@/lib/tauri";
import { useToast } from "@/components/common/Toast";
import type { SystemSnapshot } from "@/lib/types";

export default function SystemInfo() {
  const { info, loading: infoLoading, refresh: refreshInfo } = useSystemInfo();
  const {
    processes,
    loading: procsLoading,
    refresh: refreshProcs,
  } = useProcesses();
  const [snapshots, setSnapshots] = useState<SystemSnapshot[]>([]);
  const [takingSnapshot, setTakingSnapshot] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    getSnapshots()
      .then(setSnapshots)
      .catch(() => {});
  }, []);

  async function handleTakeSnapshot(label: string) {
    setTakingSnapshot(true);
    try {
      const snap = await takeSnapshot(label);
      setSnapshots((prev) => [...prev, snap]);
      addToast(`Snapshot "${label}" captured`, "success");
    } catch (e) {
      addToast(`Snapshot failed: ${e}`, "error");
    } finally {
      setTakingSnapshot(false);
    }
  }

  async function handleRefreshAll() {
    await Promise.all([refreshInfo(), refreshProcs()]);
    addToast("System info refreshed", "info");
  }

  const loading = infoLoading || procsLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-accent/30 border-t-accent rounded-full" />
      </div>
    );
  }

  const lastTwo = snapshots.slice(-2);

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">System Info</h1>
          <p className="text-sm text-surface-400 mt-1">
            Real-time system metrics and benchmark-lite snapshots
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleRefreshAll} className="btn-ghost text-sm">
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard
          label="CPU"
          value={info?.cpu_name?.split("@")[0]?.trim() ?? "Unknown"}
          subtext={`${info?.cpu_cores ?? 0} cores`}
          icon={<Cpu size={18} />}
        />
        <StatCard
          label="RAM Usage"
          value={`${Math.round(info?.ram_usage_percent ?? 0)}%`}
          subtext={`${info?.used_ram_mb ?? 0} / ${info?.total_ram_mb ?? 0} MB`}
          icon={<MemoryStick size={18} />}
        />
        <StatCard
          label="GPU"
          value={info?.gpu_info?.split(" ").slice(0, 3).join(" ") ?? "Unknown"}
          icon={<MonitorSmartphone size={18} />}
        />
        <StatCard
          label="Power Plan"
          value={info?.power_plan ?? "Unknown"}
          subtext={`Uptime: ${Math.round(info?.uptime_hours ?? 0)}h`}
          icon={<Zap size={18} />}
        />
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">
          Benchmark-Lite Snapshots
        </h2>
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => handleTakeSnapshot("Before optimization")}
            disabled={takingSnapshot}
            className="btn-secondary text-sm"
          >
            <Camera size={14} />
            Snapshot "Before"
          </button>
          <button
            onClick={() => handleTakeSnapshot("After optimization")}
            disabled={takingSnapshot}
            className="btn-primary text-sm"
          >
            <Camera size={14} />
            Snapshot "After"
          </button>
        </div>

        {snapshots.length > 0 && (
          <div className="card mb-4">
            <h3 className="text-sm font-semibold text-white mb-3">
              Saved Snapshots
            </h3>
            <div className="space-y-2">
              {snapshots.map((snap) => (
                <div
                  key={snap.id}
                  className="flex items-center justify-between py-2 border-b border-surface-800 last:border-0 text-sm"
                >
                  <div>
                    <span className="text-surface-200 font-medium">
                      {snap.label}
                    </span>
                    <span className="text-surface-500 ml-2 text-xs">
                      {new Date(snap.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-surface-400">
                    <span>{snap.process_count} procs</span>
                    <span>{snap.ram_used_mb} MB RAM</span>
                    <span>{Math.round(snap.cpu_usage_percent)}% CPU</span>
                    <span>{snap.startup_app_count} startup apps</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {lastTwo.length === 2 && (
          <BeforeAfter before={lastTwo[0]} after={lastTwo[1]} />
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white mb-4">
          Top Processes
        </h2>
        <div className="card">
          <div className="grid grid-cols-4 gap-4 text-xs font-medium text-surface-500 uppercase tracking-wider mb-2 px-1">
            <span>Process</span>
            <span>PID</span>
            <span>CPU</span>
            <span>Memory</span>
          </div>
          <div className="space-y-0">
            {processes.slice(0, 15).map((proc) => (
              <div
                key={`${proc.pid}-${proc.name}`}
                className="grid grid-cols-4 gap-4 py-2 border-b border-surface-800/50 last:border-0 text-sm"
              >
                <span className="text-surface-200 truncate">{proc.name}</span>
                <span className="text-surface-500 font-mono">{proc.pid}</span>
                <span
                  className={`font-mono ${proc.cpu_percent > 10 ? "text-warning" : "text-surface-400"}`}
                >
                  {proc.cpu_percent.toFixed(1)}%
                </span>
                <span className="text-surface-400 font-mono">
                  {proc.memory_mb} MB
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
