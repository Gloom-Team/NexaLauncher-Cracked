import { useState, useEffect } from "react";
import {
  Cpu,
  MemoryStick,
  Activity,
  Zap,
  Shield,
  RotateCcw,
  Gamepad2,
  Sparkles,
  Trash2,
  AlertTriangle,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  Info,
  Monitor,
  HardDrive,
  Gauge,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import StatCard from "@/components/system/StatCard";
import { useToast } from "@/components/common/Toast";
import {
  getSystemInfo,
  getActiveTweaksCount,
  applyProfile,
  undoAll,
  getProfileStatus,
  runSystemScan,
  getSystemFindings,
  getChangeLog,
  getHardwareInfo,
  getGamingReadiness,
  runPreGameCheck,
} from "@/lib/tauri";
import type {
  SystemInfoData,
  ProfileStatus,
  ScanResult,
  ScanFinding,
  ChangeEntry,
  HardwareInfo,
  ReadinessReport,
  ChangeAction,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Score ring SVG component
// ---------------------------------------------------------------------------

function ScoreRing({
  score,
  label,
  color,
  size = 100,
}: {
  score: number;
  label: string;
  color: string;
  size?: number;
}) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;
  const center = size / 2;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="-rotate-90"
          viewBox={`0 0 ${size} ${size}`}
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-surface-800"
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-white">
          {clamped}
        </span>
      </div>
      <span className="text-xs text-surface-400 mt-2 text-center">
        {label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tierColor(tier: string) {
  const t = tier.toLowerCase();
  if (t.includes("high") || t.includes("enthusiast")) return "text-accent bg-accent/15";
  if (t.includes("mid")) return "text-warning bg-warning/15";
  return "text-surface-300 bg-surface-800";
}

function scoreColor(score: number) {
  if (score >= 80) return "#22c55e";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

function formatActionLabel(action: ChangeAction): string {
  if (typeof action === "string") return action;
  if ("ProfileApplied" in action)
    return `Profile: ${action.ProfileApplied.profile_name}`;
  if ("ProfileReverted" in action)
    return `Reverted: ${action.ProfileReverted.profile_name}`;
  return "Unknown";
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ---------------------------------------------------------------------------
// Main Dashboard
// ---------------------------------------------------------------------------

export default function Dashboard() {
  const [sysInfo, setSysInfo] = useState<SystemInfoData | null>(null);
  const [activeCount, setActiveCount] = useState(0);
  const [profileStatuses, setProfileStatuses] = useState<ProfileStatus[]>([]);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [findings, setFindings] = useState<ScanFinding[]>([]);
  const [changeLog, setChangeLog] = useState<ChangeEntry[]>([]);
  const [hwInfo, setHwInfo] = useState<HardwareInfo | null>(null);
  const [readiness, setReadiness] = useState<ReadinessReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [applyingAction, setApplyingAction] = useState<string | null>(null);
  const { addToast } = useToast();
  const navigate = useNavigate();

  async function fetchData() {
    try {
      const [info, count, pStatus, hw, findings, changes] = await Promise.all([
        getSystemInfo(),
        getActiveTweaksCount(),
        getProfileStatus(),
        getHardwareInfo().catch(() => null),
        getSystemFindings().catch(() => []),
        getChangeLog().catch(() => []),
      ]);
      setSysInfo(info);
      setActiveCount(count);
      setProfileStatuses(pStatus);
      setHwInfo(hw);
      setFindings(findings);
      setChangeLog(changes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchScores() {
    setScanning(true);
    try {
      const [scan, ready] = await Promise.all([
        runSystemScan(),
        getGamingReadiness().catch(() => null),
      ]);
      setScanResult(scan);
      setReadiness(ready);
    } catch (e) {
      console.error("Scan failed:", e);
    } finally {
      setScanning(false);
    }
  }

  useEffect(() => {
    fetchData();
    fetchScores();
  }, []);

  async function handleQuickProfile(profileId: string) {
    setApplyingAction(profileId);
    try {
      const details = await applyProfile(profileId);
      addToast(`Profile applied (${details.length} changes)`, "success");
      fetchData();
      fetchScores();
    } catch (e) {
      addToast(`Failed: ${e}`, "error");
    } finally {
      setApplyingAction(null);
    }
  }

  async function handleUndoAll() {
    setApplyingAction("undo");
    try {
      const details = await undoAll();
      addToast(`All reverted (${details.length} operations)`, "success");
      fetchData();
      fetchScores();
    } catch (e) {
      addToast(`Failed: ${e}`, "error");
    } finally {
      setApplyingAction(null);
    }
  }

  async function handlePreGameCheck() {
    setApplyingAction("pregame");
    try {
      const result = await runPreGameCheck();
      if (result.overall_ready) {
        addToast(`Ready to game! Score: ${result.score}/100`, "success");
      } else {
        const warns = result.checks.filter((c) => c.status !== "Pass").length;
        addToast(`${warns} issue(s) found — score ${result.score}/100`, "info");
      }
      navigate("/gaming");
    } catch (e) {
      addToast(`Pre-game check failed: ${e}`, "error");
    } finally {
      setApplyingAction(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-accent/30 border-t-accent rounded-full" />
      </div>
    );
  }

  const gamingScore = readiness?.gaming_score ?? scanResult?.optimization_score ?? 0;
  const responsivenessScore = readiness?.responsiveness_score ?? 0;
  const annoyanceScore = readiness?.annoyance_score ?? 0;
  const optimizationScore = scanResult?.optimization_score ?? readiness?.optimization_score ?? 0;

  const topFindings = findings.slice(0, 5);
  const recentChanges = changeLog.slice(0, 5);

  return (
    <div className="max-w-6xl space-y-8 stagger-children">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            {hwInfo && (
              <span
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${tierColor(hwInfo.tier)}`}
              >
                {hwInfo.tier} Tier
              </span>
            )}
          </div>
          <p className="text-sm text-surface-400 mt-1">
            System overview and quick actions
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-xs text-surface-500">Active Tweaks</p>
            <p className="text-lg font-bold text-accent">{activeCount}</p>
          </div>
          <button
            onClick={handleUndoAll}
            disabled={applyingAction !== null || activeCount === 0}
            className="btn-danger text-sm"
          >
            <RotateCcw size={14} />
            Undo All
          </button>
        </div>
      </div>

      {/* Optimization Scores */}
      <section className="card card-animated">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Gauge size={18} className="text-accent" />
            <h2 className="text-base font-semibold text-white">
              Optimization Scores
            </h2>
          </div>
          <button
            onClick={fetchScores}
            disabled={scanning}
            className="btn-ghost text-xs"
          >
            {scanning ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <TrendingUp size={13} />
            )}
            {scanning ? "Scanning…" : "Rescan"}
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 justify-items-center">
          <ScoreRing
            score={gamingScore}
            label="Gaming"
            color={scoreColor(gamingScore)}
          />
          <ScoreRing
            score={responsivenessScore}
            label="Responsiveness"
            color={scoreColor(responsivenessScore)}
          />
          <ScoreRing
            score={annoyanceScore}
            label="Annoyance Free"
            color={scoreColor(annoyanceScore)}
          />
          <ScoreRing
            score={optimizationScore}
            label="Overall"
            color={scoreColor(optimizationScore)}
          />
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-base font-semibold text-white mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={handlePreGameCheck}
            disabled={applyingAction !== null}
            className="card-hover text-left group"
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-accent/10 text-accent">
                <Gamepad2 size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white group-hover:text-accent transition-colors">
                  Pre-Game Check
                </p>
                <p className="text-xs text-surface-500 mt-0.5">
                  Verify your system is ready for gaming
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate("/cleanup")}
            className="card-hover text-left group"
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-warning/10 text-warning">
                <Trash2 size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white group-hover:text-warning transition-colors">
                  Quick Cleanup
                </p>
                <p className="text-xs text-surface-500 mt-0.5">
                  Free up disk space and remove temp files
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleQuickProfile("gaming")}
            disabled={applyingAction !== null}
            className="card-hover text-left group"
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-success/10 text-success">
                <Sparkles size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white group-hover:text-success transition-colors">
                  Apply Recommended
                </p>
                <p className="text-xs text-surface-500 mt-0.5">
                  Apply the top optimization profile
                </p>
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* System Resources */}
      <section>
        <h2 className="text-base font-semibold text-white mb-3">
          System Resources
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="CPU"
            value={`${Math.round(sysInfo?.ram_usage_percent ?? 0)}%`}
            subtext={sysInfo?.cpu_name?.split("@")[0]?.trim()}
            icon={<Cpu size={18} />}
          />
          <StatCard
            label="RAM Usage"
            value={`${sysInfo?.used_ram_mb ?? 0} MB`}
            subtext={`of ${sysInfo?.total_ram_mb ?? 0} MB total`}
            icon={<MemoryStick size={18} />}
          />
          <StatCard
            label="GPU"
            value={hwInfo?.gpu.name?.split(" ").slice(0, 3).join(" ") ?? "—"}
            subtext={
              hwInfo?.gpu.vram_mb
                ? `${hwInfo.gpu.vram_mb} MB VRAM`
                : undefined
            }
            icon={<Monitor size={18} />}
          />
          <StatCard
            label="Power Plan"
            value={sysInfo?.power_plan ?? "Unknown"}
            subtext={`Uptime: ${Math.round(sysInfo?.uptime_hours ?? 0)}h`}
            icon={<Zap size={18} />}
          />
        </div>
      </section>

      {/* Two-column: Issues + Recent Changes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Issues */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-white">
              Top Issues Right Now
            </h2>
            {findings.length > 5 && (
              <span className="text-xs text-surface-500">
                +{findings.length - 5} more
              </span>
            )}
          </div>
          <div className="space-y-2">
            {topFindings.length > 0 ? (
              topFindings.map((f) => (
                <div
                  key={f.id}
                  className="card card-animated p-3.5 flex items-start gap-3"
                >
                  <div className="mt-0.5">
                    {f.severity === "High" || f.severity === "Critical" ? (
                      <XCircle size={16} className="text-danger" />
                    ) : f.severity === "Medium" ? (
                      <AlertTriangle size={16} className="text-warning" />
                    ) : (
                      <Info size={16} className="text-surface-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-white truncate">
                        {f.title}
                      </p>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded shrink-0 ${
                          f.severity === "High" || f.severity === "Critical"
                            ? "bg-danger/15 text-danger"
                            : f.severity === "Medium"
                              ? "bg-warning/15 text-warning"
                              : "bg-surface-700 text-surface-400"
                        }`}
                      >
                        {f.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-surface-500 mt-0.5 line-clamp-1">
                      {f.description}
                    </p>
                    {f.tweak_id && (
                      <button
                        onClick={() => navigate("/tweaks")}
                        className="text-[11px] text-accent hover:underline mt-1 inline-flex items-center gap-1"
                      >
                        Fix it
                        <ChevronRight size={10} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="card card-animated p-6 text-center">
                <CheckCircle
                  size={24}
                  className="mx-auto text-success mb-2"
                />
                <p className="text-sm text-surface-300">
                  No issues detected
                </p>
                <p className="text-xs text-surface-500 mt-0.5">
                  Your system looks good!
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Recent Changes */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-white">
              Recent Changes
            </h2>
            {changeLog.length > 5 && (
              <button
                onClick={() => navigate("/changes")}
                className="text-xs text-accent hover:underline inline-flex items-center gap-1"
              >
                View all
                <ChevronRight size={12} />
              </button>
            )}
          </div>
          <div className="space-y-0">
            {recentChanges.length > 0 ? (
              recentChanges.map((entry, i) => {
                const isApply =
                  entry.action === "Applied" ||
                  (typeof entry.action === "object" &&
                    "ProfileApplied" in entry.action);
                return (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 py-3 border-b border-surface-800/50 last:border-0"
                  >
                    <div className="relative flex flex-col items-center">
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 ${
                          isApply ? "bg-accent" : "bg-surface-500"
                        }`}
                      />
                      {i < recentChanges.length - 1 && (
                        <div className="w-px flex-1 bg-surface-800 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium text-white truncate">
                          {entry.tweak_name}
                        </p>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded ${
                            isApply
                              ? "bg-accent/15 text-accent"
                              : "bg-surface-700 text-surface-400"
                          }`}
                        >
                          {formatActionLabel(entry.action)}
                        </span>
                      </div>
                      <p className="text-[11px] text-surface-600 mt-0.5">
                        {timeAgo(entry.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="card card-animated p-6 text-center">
                <Clock size={24} className="mx-auto text-surface-600 mb-2" />
                <p className="text-sm text-surface-300">No changes yet</p>
                <p className="text-xs text-surface-500 mt-0.5">
                  Apply a profile or tweak to get started
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* System Details */}
      <section>
        <h2 className="text-base font-semibold text-white mb-3">
          System Details
        </h2>
        <div className="card card-animated">
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-surface-500">OS</span>
              <span className="text-surface-200">
                {sysInfo?.os_name} {sysInfo?.os_version}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-500">CPU</span>
              <span className="text-surface-200 truncate ml-4">
                {sysInfo?.cpu_name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-500">CPU Cores</span>
              <span className="text-surface-200">{sysInfo?.cpu_cores}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-500">GPU</span>
              <span className="text-surface-200 truncate ml-4">
                {hwInfo?.gpu.name ?? sysInfo?.gpu_info}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-500">RAM</span>
              <span className="text-surface-200">
                {sysInfo?.total_ram_mb} MB
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-500">Power Plan</span>
              <span className="text-surface-200">{sysInfo?.power_plan}</span>
            </div>
            {hwInfo && (
              <>
                <div className="flex justify-between">
                  <span className="text-surface-500">Storage</span>
                  <span className="text-surface-200">
                    {hwInfo.storage
                      .map((s) => `${s.drive_letter} ${s.storage_type}`)
                      .join(", ")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-500">Display</span>
                  <span className="text-surface-200 truncate ml-4">
                    {hwInfo.display
                      .filter((d) => d.is_primary)
                      .map((d) => `${d.resolution} @ ${d.refresh_rate}Hz`)
                      .join(", ") || "—"}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
