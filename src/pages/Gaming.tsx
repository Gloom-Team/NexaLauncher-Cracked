import { useEffect, useState } from "react";
import {
  Gamepad2,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  BatteryCharging,
  Battery,
  MonitorPlay,
  X,
  ChevronDown,
  ChevronUp,
  List,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import {
  getGameLaunchers,
  runPreGameCheck,
  getOverlays,
  getGamingReadiness,
  getHardwareInfo,
  getInstalledGames,
} from "../lib/tauri";
import type {
  GameLauncher,
  PreGameCheckResult,
  OverlayInfo,
  ReadinessReport,
  HardwareInfo,
  GameLibrary,
} from "../lib/types";

export default function Gaming() {
  const [launchers, setLaunchers] = useState<GameLauncher[]>([]);
  const [checkResult, setCheckResult] = useState<PreGameCheckResult | null>(null);
  const [overlays, setOverlays] = useState<OverlayInfo[]>([]);
  const [readiness, setReadiness] = useState<ReadinessReport | null>(null);
  const [hardwareInfo, setHardwareInfo] = useState<HardwareInfo | null>(null);
  const [gameLibrary, setGameLibrary] = useState<GameLibrary | null>(null);
  const [checking, setChecking] = useState(false);
  const [showAllGames, setShowAllGames] = useState(false);

  useEffect(() => {
    getGameLaunchers().then(setLaunchers).catch(() => {});
    getOverlays().then(setOverlays).catch(() => {});
    getGamingReadiness().then(setReadiness).catch(() => {});
    getHardwareInfo().then(setHardwareInfo).catch(() => {});
    getInstalledGames().then(setGameLibrary).catch(() => {});
  }, []);

  const handlePreGameCheck = async () => {
    setChecking(true);
    try {
      const result = await runPreGameCheck();
      setCheckResult(result);
    } finally {
      setChecking(false);
    }
  };

  const statusIcon = (status: string) => {
    if (status === "Pass") return <CheckCircle size={16} className="text-green-400" />;
    if (status === "Warning") return <AlertTriangle size={16} className="text-yellow-400" />;
    return <XCircle size={16} className="text-red-400" />;
  };

  const allGames = gameLibrary ? [...gameLibrary.games, ...gameLibrary.manual_games] : [];
  const displayedGames = showAllGames ? allGames : allGames.slice(0, 8);
  const runningLaunchers = launchers.filter((l) => l.running);

  return (
    <div className="max-w-6xl space-y-6 stagger-children">
      <div>
        <h1 className="text-2xl font-bold text-white">Gaming Optimization</h1>
        <p className="text-surface-400 text-sm mt-1">
          Optimize your PC for the best gaming experience
        </p>
      </div>

      {readiness && (
        <div className="grid grid-cols-4 gap-4">
          <div className="card card-animated p-4 text-center">
            <div className="text-3xl font-bold text-accent">{readiness.gaming_score}</div>
            <div className="text-xs text-surface-400 mt-1">Gaming Score</div>
          </div>
          <div className="card card-animated p-4 text-center">
            <div className="text-3xl font-bold text-green-400">{readiness.responsiveness_score}</div>
            <div className="text-xs text-surface-400 mt-1">Responsiveness</div>
          </div>
          <div className="card card-animated p-4 text-center">
            <div className="text-3xl font-bold text-yellow-400">{readiness.annoyance_score}</div>
            <div className="text-xs text-surface-400 mt-1">Annoyance Score</div>
          </div>
          <div className="card card-animated p-4 text-center">
            <div className="text-3xl font-bold text-purple-400">{readiness.optimization_score}</div>
            <div className="text-xs text-surface-400 mt-1">Optimization</div>
          </div>
        </div>
      )}

      {/* System Gaming Status */}
      {hardwareInfo && (
        <div className="card card-animated p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={18} className="text-accent" />
            <h2 className="text-lg font-semibold text-white">System Gaming Status</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <div
              className={`flex items-start gap-3 p-3 rounded-lg ${hardwareInfo.os.vbs_enabled ? "bg-red-500/10 border border-red-500/20" : "bg-green-500/10 border border-green-500/20"}`}
            >
              <div className={`p-1.5 rounded-lg ${hardwareInfo.os.vbs_enabled ? "bg-red-500/20" : "bg-green-500/20"}`}>
                {hardwareInfo.os.vbs_enabled ? (
                  <ShieldAlert size={16} className="text-red-400" />
                ) : (
                  <ShieldCheck size={16} className="text-green-400" />
                )}
              </div>
              <div>
                <div className="text-sm font-medium text-white">VBS (Virtualization-Based Security)</div>
                <div className={`text-xs ${hardwareInfo.os.vbs_enabled ? "text-red-400" : "text-green-400"}`}>
                  {hardwareInfo.os.vbs_enabled
                    ? "Enabled — reduces gaming performance by 5-10%"
                    : "Disabled — no performance penalty"}
                </div>
              </div>
            </div>

            <div
              className={`flex items-start gap-3 p-3 rounded-lg ${hardwareInfo.os.memory_integrity ? "bg-yellow-500/10 border border-yellow-500/20" : "bg-green-500/10 border border-green-500/20"}`}
            >
              <div className={`p-1.5 rounded-lg ${hardwareInfo.os.memory_integrity ? "bg-yellow-500/20" : "bg-green-500/20"}`}>
                {hardwareInfo.os.memory_integrity ? (
                  <ShieldAlert size={16} className="text-yellow-400" />
                ) : (
                  <ShieldCheck size={16} className="text-green-400" />
                )}
              </div>
              <div>
                <div className="text-sm font-medium text-white">Memory Integrity (HVCI)</div>
                <div className={`text-xs ${hardwareInfo.os.memory_integrity ? "text-yellow-400" : "text-green-400"}`}>
                  {hardwareInfo.os.memory_integrity
                    ? "Enabled — may cause stuttering in some games"
                    : "Disabled — better gaming performance"}
                </div>
              </div>
            </div>

            <div
              className={`flex items-start gap-3 p-3 rounded-lg ${hardwareInfo.os.hags_enabled ? "bg-green-500/10 border border-green-500/20" : "bg-yellow-500/10 border border-yellow-500/20"}`}
            >
              <div className={`p-1.5 rounded-lg ${hardwareInfo.os.hags_enabled ? "bg-green-500/20" : "bg-yellow-500/20"}`}>
                <Zap size={16} className={hardwareInfo.os.hags_enabled ? "text-green-400" : "text-yellow-400"} />
              </div>
              <div>
                <div className="text-sm font-medium text-white">Hardware-Accelerated GPU Scheduling</div>
                <div className={`text-xs ${hardwareInfo.os.hags_enabled ? "text-green-400" : "text-yellow-400"}`}>
                  {hardwareInfo.os.hags_enabled
                    ? "Enabled — reduces latency and improves frame pacing"
                    : "Disabled — enable for better frame times"}
                </div>
              </div>
            </div>

            {hardwareInfo.display.length > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-800/50 border border-surface-700">
                <div className="p-1.5 rounded-lg bg-accent/20">
                  <MonitorPlay size={16} className="text-accent" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">
                    Monitor: {hardwareInfo.display[0].name}
                  </div>
                  <div className="text-xs text-surface-400">
                    {hardwareInfo.display[0].resolution} @{" "}
                    <span className="text-accent font-medium">
                      {hardwareInfo.display[0].refresh_rate}Hz
                    </span>
                    {hardwareInfo.display[0].refresh_rate >= 144
                      ? " — Great for gaming"
                      : hardwareInfo.display[0].refresh_rate >= 75
                        ? " — Decent for gaming"
                        : " — Consider a higher refresh rate monitor"}
                  </div>
                </div>
              </div>
            )}

            <div
              className={`flex items-start gap-3 p-3 rounded-lg ${hardwareInfo.power.is_plugged_in ? "bg-green-500/10 border border-green-500/20" : "bg-orange-500/10 border border-orange-500/20"}`}
            >
              <div className={`p-1.5 rounded-lg ${hardwareInfo.power.is_plugged_in ? "bg-green-500/20" : "bg-orange-500/20"}`}>
                {hardwareInfo.power.is_plugged_in ? (
                  <BatteryCharging size={16} className="text-green-400" />
                ) : (
                  <Battery size={16} className="text-orange-400" />
                )}
              </div>
              <div>
                <div className="text-sm font-medium text-white">
                  Power: {hardwareInfo.power.current_power_plan}
                </div>
                <div className={`text-xs ${hardwareInfo.power.is_plugged_in ? "text-green-400" : "text-orange-400"}`}>
                  {hardwareInfo.power.is_plugged_in
                    ? "Plugged in — full performance available"
                    : "On battery — CPU/GPU may be throttled. Plug in for best performance."}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pre-Game Check */}
      <div className="card card-animated p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Zap size={20} className="text-accent" />
            <h2 className="text-lg font-semibold text-white">Pre-Game Check</h2>
          </div>
          <button
            onClick={handlePreGameCheck}
            disabled={checking}
            className="btn-primary btn-animated px-4 py-2 text-sm"
          >
            {checking ? "Checking..." : "Run Pre-Game Check"}
          </button>
        </div>
        {checkResult ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`text-lg font-bold ${checkResult.overall_ready ? "text-green-400" : "text-yellow-400"}`}
              >
                {checkResult.overall_ready ? "Ready to Game!" : "Some Issues Found"}
              </span>
              <span className="text-surface-500 text-sm">Score: {checkResult.score}/100</span>
            </div>
            {checkResult.checks.map((check) => (
              <div
                key={check.id}
                className="flex items-center gap-3 py-2 px-3 rounded-lg bg-surface-800/50"
              >
                {statusIcon(check.status)}
                <span className="text-sm text-white flex-1">{check.name}</span>
                <span className="text-xs text-surface-400">{check.message}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-surface-500 text-sm">
            Run a pre-game check to see if your PC is ready for gaming.
          </p>
        )}
      </div>

      {/* FPS Impact Checklist */}
      <div className="card card-animated p-5">
        <div className="flex items-center gap-2 mb-4">
          <List size={18} className="text-accent" />
          <h2 className="text-lg font-semibold text-white">FPS Impact Checklist</h2>
        </div>
        <div className="space-y-2">
          {[
            {
              label: "VBS disabled",
              ok: hardwareInfo ? !hardwareInfo.os.vbs_enabled : null,
              impact: "5-10% FPS gain",
            },
            {
              label: "Memory Integrity disabled",
              ok: hardwareInfo ? !hardwareInfo.os.memory_integrity : null,
              impact: "Reduces micro-stutters",
            },
            {
              label: "HAGS enabled",
              ok: hardwareInfo?.os.hags_enabled ?? null,
              impact: "Better frame pacing",
            },
            {
              label: "Power plugged in",
              ok: hardwareInfo?.power.is_plugged_in ?? null,
              impact: "No power throttling",
            },
            {
              label: "No unnecessary overlays",
              ok:
                overlays.length > 0
                  ? overlays.filter((o) => o.running).length === 0
                  : null,
              impact: "1-5% FPS gain",
            },
            {
              label: "Background launchers closed",
              ok: runningLaunchers.length <= 1,
              impact: "Frees RAM & CPU",
            },
            {
              label: "High refresh rate monitor",
              ok: hardwareInfo?.display[0]?.refresh_rate
                ? hardwareInfo.display[0].refresh_rate >= 120
                : null,
              impact: "Smoother gameplay",
            },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-surface-800/50">
              {item.ok === null ? (
                <div className="w-4 h-4 rounded-full bg-surface-700 shrink-0" />
              ) : item.ok ? (
                <CheckCircle size={16} className="text-green-400 shrink-0" />
              ) : (
                <XCircle size={16} className="text-red-400 shrink-0" />
              )}
              <span className="text-sm text-white flex-1">{item.label}</span>
              <span className="text-xs text-surface-500">{item.impact}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Game Launchers */}
        <div className="card card-animated p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Gamepad2 size={18} className="text-accent" />
              <h2 className="text-lg font-semibold text-white">Game Launchers</h2>
            </div>
            {runningLaunchers.length > 1 && (
              <button className="text-xs px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors flex items-center gap-1.5">
                <X size={12} />
                Close Other Launchers
              </button>
            )}
          </div>
          <div className="space-y-2">
            {launchers
              .filter((l) => l.installed)
              .map((launcher) => (
                <div
                  key={launcher.id}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg bg-surface-800/50"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${launcher.running ? "bg-green-400" : "bg-surface-600"}`}
                  />
                  <span className="text-sm text-white flex-1">{launcher.name}</span>
                  <span className="text-xs text-surface-500">
                    {launcher.running ? "Running" : "Installed"}
                  </span>
                </div>
              ))}
            {launchers.filter((l) => l.installed).length === 0 && (
              <p className="text-surface-500 text-sm">No game launchers detected.</p>
            )}
          </div>
        </div>

        {/* Overlay Detection */}
        <div className="card card-animated p-5">
          <div className="flex items-center gap-2 mb-4">
            <Eye size={18} className="text-accent" />
            <h2 className="text-lg font-semibold text-white">Overlay Detection</h2>
          </div>
          <div className="space-y-2">
            {overlays.map((overlay) => (
              <div
                key={overlay.process_name}
                className="flex items-center gap-3 py-2 px-3 rounded-lg bg-surface-800/50"
              >
                <span
                  className={`w-2 h-2 rounded-full ${overlay.running ? "bg-yellow-400" : "bg-surface-600"}`}
                />
                <span className="text-sm text-white flex-1">{overlay.name}</span>
                <span className="text-xs text-surface-500">Impact: {overlay.impact}</span>
              </div>
            ))}
            {overlays.length === 0 && (
              <p className="text-surface-500 text-sm">No overlays detected.</p>
            )}
          </div>
        </div>
      </div>

      {/* Installed Games */}
      <div className="card card-animated p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Gamepad2 size={18} className="text-accent" />
            <h2 className="text-lg font-semibold text-white">Installed Games</h2>
            {allGames.length > 0 && (
              <span className="text-xs text-surface-500">({allGames.length} found)</span>
            )}
          </div>
        </div>
        {allGames.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              {displayedGames.map((game) => (
                <div
                  key={game.id}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg bg-surface-800/50"
                >
                  <Gamepad2 size={14} className="text-surface-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-white truncate">{game.name}</div>
                    <div className="text-[11px] text-surface-500">{game.launcher}</div>
                  </div>
                  {game.linked_profile_id && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/15 text-accent shrink-0">
                      Profile linked
                    </span>
                  )}
                </div>
              ))}
            </div>
            {allGames.length > 8 && (
              <button
                onClick={() => setShowAllGames(!showAllGames)}
                className="btn-ghost text-xs mt-3 mx-auto flex items-center gap-1"
              >
                {showAllGames ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {showAllGames ? "Show Less" : `Show All (${allGames.length})`}
              </button>
            )}
          </>
        ) : (
          <p className="text-surface-500 text-sm text-center py-6">
            No installed games detected. Install games through Steam, Epic, or other launchers.
          </p>
        )}
      </div>
    </div>
  );
}
