import { useEffect, useState, useMemo } from "react";
import {
  Play,
  Square,
  AlertTriangle,
  Server,
  Gamepad2,
  Cpu,
  MemoryStick,
  Zap,
  Shield,
  Package,
  ChevronDown,
  ChevronRight,
  Loader2,
  Search,
  X,
  Power,
  Building2,
  Clock,
  ArrowUpDown,
  Ban,
} from "lucide-react";
import {
  getStartupApps,
  getServices,
  getOptionalServices,
  disableStartupApp,
  enableStartupApp,
  getProcesses,
} from "../lib/tauri";
import { useToast } from "@/components/common/Toast";
import type { StartupApp, ServiceInfo, ProcessInfo } from "../lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type ImpactLevel = "High" | "Medium" | "Low";

const IMPACT_ORDER: ImpactLevel[] = ["High", "Medium", "Low"];

const IMPACT_STYLES: Record<ImpactLevel, { bg: string; text: string; dot: string }> = {
  High: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400" },
  Medium: { bg: "bg-yellow-500/10", text: "text-yellow-400", dot: "bg-yellow-400" },
  Low: { bg: "bg-green-500/10", text: "text-green-400", dot: "bg-green-400" },
};

function impactStyle(impact: string) {
  return IMPACT_STYLES[impact as ImpactLevel] ?? IMPACT_STYLES.Low;
}

interface VendorBundle {
  vendor: string;
  apps: StartupApp[];
}

function detectVendorBundles(apps: StartupApp[]): VendorBundle[] {
  const byVendor: Record<string, StartupApp[]> = {};
  for (const app of apps) {
    const vendor = app.publisher?.trim();
    if (!vendor) continue;
    (byVendor[vendor] ??= []).push(app);
  }
  return Object.entries(byVendor)
    .filter(([, list]) => list.length >= 2)
    .map(([vendor, apps]) => ({ vendor, apps }))
    .sort((a, b) => b.apps.length - a.apps.length);
}

type SortKey = "name" | "cpu" | "memory";

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function StartupBackground() {
  const [startupApps, setStartupApps] = useState<StartupApp[]>([]);
  const [optionalServices, setOptionalServices] = useState<ServiceInfo[]>([]);
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [activeTab, setActiveTab] = useState<
    "timeline" | "processes" | "services"
  >("timeline");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(),
  );
  const [disablingIds, setDisablingIds] = useState<Set<string>>(new Set());
  const [bulkDisabling, setBulkDisabling] = useState(false);
  const [processSort, setProcessSort] = useState<SortKey>("cpu");
  const [processSearch, setProcessSearch] = useState("");
  const { addToast } = useToast();

  useEffect(() => {
    getStartupApps()
      .then(setStartupApps)
      .catch(() => {});
    getOptionalServices()
      .then(setOptionalServices)
      .catch(() => {});
    getProcesses()
      .then(setProcesses)
      .catch(() => {});
  }, []);

  // --- Computed data ---

  const gameLauncherCount = useMemo(
    () => startupApps.filter((a) => a.is_game_launcher && a.enabled).length,
    [startupApps],
  );

  const impactGroups = useMemo(() => {
    const groups: Record<string, StartupApp[]> = {
      High: [],
      Medium: [],
      Low: [],
    };
    for (const app of startupApps) {
      const key = app.impact_estimate || "Low";
      (groups[key] ??= []).push(app);
    }
    return groups;
  }, [startupApps]);

  const highImpactNonEssential = useMemo(
    () =>
      startupApps.filter(
        (a) =>
          a.enabled &&
          a.impact_estimate === "High" &&
          !a.is_game_launcher,
      ),
    [startupApps],
  );

  const vendorBundles = useMemo(
    () => detectVendorBundles(startupApps),
    [startupApps],
  );

  const enabledCount = startupApps.filter((a) => a.enabled).length;
  const highCount = impactGroups.High?.length ?? 0;
  const totalCount = startupApps.length;

  const sortedProcesses = useMemo(() => {
    let list = [...processes];
    if (processSearch) {
      const q = processSearch.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      if (processSort === "cpu") return b.cpu_percent - a.cpu_percent;
      if (processSort === "memory") return b.memory_mb - a.memory_mb;
      return a.name.localeCompare(b.name);
    });
    return list.slice(0, 30);
  }, [processes, processSort, processSearch]);

  // --- Actions ---

  async function handleDisable(id: string) {
    setDisablingIds((prev) => new Set(prev).add(id));
    try {
      await disableStartupApp(id);
      setStartupApps((prev) =>
        prev.map((a) => (a.id === id ? { ...a, enabled: false } : a)),
      );
    } catch (e) {
      addToast(`Failed to disable: ${e}`, "error");
    } finally {
      setDisablingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  async function handleEnable(app: StartupApp) {
    setDisablingIds((prev) => new Set(prev).add(app.id));
    try {
      await enableStartupApp(app.id, app.path);
      setStartupApps((prev) =>
        prev.map((a) => (a.id === app.id ? { ...a, enabled: true } : a)),
      );
    } catch (e) {
      addToast(`Failed to enable: ${e}`, "error");
    } finally {
      setDisablingIds((prev) => {
        const next = new Set(prev);
        next.delete(app.id);
        return next;
      });
    }
  }

  async function handleBulkDisableHighImpact() {
    if (highImpactNonEssential.length === 0) return;
    setBulkDisabling(true);
    let count = 0;
    for (const app of highImpactNonEssential) {
      try {
        await disableStartupApp(app.id);
        setStartupApps((prev) =>
          prev.map((a) => (a.id === app.id ? { ...a, enabled: false } : a)),
        );
        count++;
      } catch {
        /* skip failures */
      }
    }
    addToast(`Disabled ${count} high-impact startup items`, "success");
    setBulkDisabling(false);
  }

  async function handleDisableVendorBundle(vendor: VendorBundle) {
    const enabled = vendor.apps.filter((a) => a.enabled);
    let count = 0;
    for (const app of enabled) {
      try {
        await disableStartupApp(app.id);
        setStartupApps((prev) =>
          prev.map((a) => (a.id === app.id ? { ...a, enabled: false } : a)),
        );
        count++;
      } catch {
        /* skip */
      }
    }
    addToast(`Disabled ${count} apps from ${vendor.vendor}`, "success");
  }

  function toggleGroup(key: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // --- Tab classes ---

  function tabCls(tab: string) {
    return `px-4 py-2 text-sm rounded-lg transition-colors ${
      activeTab === tab
        ? "bg-accent/10 text-accent"
        : "text-surface-400 hover:text-white"
    }`;
  }

  // --- Render helpers ---

  function renderStartupApp(app: StartupApp) {
    const style = impactStyle(app.impact_estimate);
    const isProcessing = disablingIds.has(app.id);

    return (
      <div
        key={app.id}
        className={`flex items-center gap-4 px-4 py-3 border-b border-surface-800/40 last:border-0 transition-colors ${
          !app.enabled ? "opacity-50" : ""
        }`}
      >
        <div className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white truncate">
              {app.name}
            </span>
            {app.is_game_launcher && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 text-accent shrink-0">
                Game Launcher
              </span>
            )}
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${style.bg} ${style.text}`}
            >
              {app.impact_estimate}
            </span>
          </div>
          <div className="text-xs text-surface-500 mt-0.5 truncate max-w-md">
            {app.publisher ? `${app.publisher} — ` : ""}
            {app.path}
          </div>
        </div>
        {app.enabled ? (
          <button
            onClick={() => handleDisable(app.id)}
            disabled={isProcessing}
            className="text-xs px-3 py-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50 shrink-0"
          >
            {isProcessing ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              "Disable"
            )}
          </button>
        ) : (
          <button
            onClick={() => handleEnable(app)}
            disabled={isProcessing}
            className="text-xs px-3 py-1.5 rounded bg-surface-700 text-surface-300 hover:bg-surface-600 transition-colors disabled:opacity-50 shrink-0"
          >
            {isProcessing ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              "Enable"
            )}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-6 stagger-children">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Startup & Background
        </h1>
        <p className="text-surface-400 text-sm mt-1">
          Manage what runs when Windows starts and what consumes resources in
          the background.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card card-animated p-4 text-center">
          <p className="text-2xl font-bold text-white">{totalCount}</p>
          <p className="text-xs text-surface-500 mt-0.5">Startup Apps</p>
        </div>
        <div className="card card-animated p-4 text-center">
          <p className="text-2xl font-bold text-accent">{enabledCount}</p>
          <p className="text-xs text-surface-500 mt-0.5">Enabled</p>
        </div>
        <div className="card card-animated p-4 text-center">
          <p className="text-2xl font-bold text-red-400">{highCount}</p>
          <p className="text-xs text-surface-500 mt-0.5">High Impact</p>
        </div>
        <div className="card card-animated p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">
            {vendorBundles.length}
          </p>
          <p className="text-xs text-surface-500 mt-0.5">Vendor Bundles</p>
        </div>
      </div>

      {/* Warnings */}
      {gameLauncherCount > 2 && (
        <div className="card card-animated p-4 border-yellow-500/30 bg-yellow-500/5 flex items-center gap-3">
          <Gamepad2 size={18} className="text-yellow-400 shrink-0" />
          <span className="text-sm text-yellow-300 flex-1">
            You have <strong>{gameLauncherCount}</strong> game launchers starting
            with Windows. Each one uses memory and CPU — consider keeping only
            your primary launcher.
          </span>
        </div>
      )}

      {/* One-Click Disable */}
      {highImpactNonEssential.length > 0 && (
        <div className="card card-animated p-4 flex items-center gap-4 border-red-500/20 bg-red-500/[0.03]">
          <div className="p-2.5 rounded-lg bg-red-500/10 text-red-400 shrink-0">
            <Zap size={20} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">
              {highImpactNonEssential.length} high-impact items can be disabled
            </p>
            <p className="text-xs text-surface-500 mt-0.5">
              These non-essential apps significantly slow your boot time.
            </p>
          </div>
          <button
            onClick={handleBulkDisableHighImpact}
            disabled={bulkDisabling}
            className="btn-danger text-sm shrink-0"
          >
            {bulkDisabling ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Ban size={14} />
            )}
            Disable All
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-surface-800 pb-2">
        <button onClick={() => setActiveTab("timeline")} className={tabCls("timeline")}>
          <span className="inline-flex items-center gap-1.5">
            <Clock size={14} />
            Startup Timeline
          </span>
        </button>
        <button onClick={() => setActiveTab("processes")} className={tabCls("processes")}>
          <span className="inline-flex items-center gap-1.5">
            <Cpu size={14} />
            Background Processes ({processes.length})
          </span>
        </button>
        <button onClick={() => setActiveTab("services")} className={tabCls("services")}>
          <span className="inline-flex items-center gap-1.5">
            <Server size={14} />
            Optional Services ({optionalServices.length})
          </span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "timeline" && (
        <div className="space-y-6">
          {/* Impact Groups */}
          {IMPACT_ORDER.map((impact) => {
            const apps = impactGroups[impact] ?? [];
            if (apps.length === 0) return null;
            const style = impactStyle(impact);
            const collapsed = collapsedGroups.has(impact);
            const enabledInGroup = apps.filter((a) => a.enabled).length;

            return (
              <div key={impact} className="card card-animated overflow-hidden">
                <button
                  onClick={() => toggleGroup(impact)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-surface-800/30 transition-colors"
                >
                  <div
                    className={`w-3 h-3 rounded-full shrink-0 ${style.dot}`}
                  />
                  <h3 className="text-sm font-semibold text-white flex-1 text-left">
                    {impact} Impact
                    <span className="font-normal text-surface-500 ml-2">
                      {apps.length} apps · {enabledInGroup} enabled
                    </span>
                  </h3>
                  {collapsed ? (
                    <ChevronRight size={16} className="text-surface-500" />
                  ) : (
                    <ChevronDown size={16} className="text-surface-500" />
                  )}
                </button>
                {!collapsed && (
                  <div className="border-t border-surface-800/50">
                    {apps.map(renderStartupApp)}
                  </div>
                )}
              </div>
            );
          })}

          {startupApps.length === 0 && (
            <div className="card card-animated text-center py-12">
              <Power size={32} className="mx-auto text-surface-600 mb-3" />
              <p className="text-sm text-surface-400">
                No startup apps detected.
              </p>
            </div>
          )}

          {/* Vendor Bundles */}
          {vendorBundles.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Building2 size={16} className="text-warning" />
                <h3 className="text-base font-semibold text-white">
                  Vendor Bundles
                </h3>
              </div>
              <p className="text-xs text-surface-500 mb-3">
                These vendors have multiple apps starting with Windows. Consider
                disabling redundant ones.
              </p>
              <div className="space-y-2">
                {vendorBundles.map((bundle) => {
                  const enabledApps = bundle.apps.filter((a) => a.enabled);
                  return (
                    <div
                      key={bundle.vendor}
                      className="card card-animated p-4 flex items-center gap-4"
                    >
                      <Package size={18} className="text-surface-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">
                          {bundle.vendor}
                        </p>
                        <p className="text-xs text-surface-500 mt-0.5">
                          {bundle.apps.length} apps ·{" "}
                          {enabledApps.length} enabled:{" "}
                          {bundle.apps.map((a) => a.name).join(", ")}
                        </p>
                      </div>
                      {enabledApps.length > 0 && (
                        <button
                          onClick={() => handleDisableVendorBundle(bundle)}
                          className="text-xs px-3 py-1.5 rounded bg-warning/10 text-warning hover:bg-warning/20 transition-colors shrink-0"
                        >
                          Disable All
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* What Launched at Sign In */}
          {startupApps.some((a) => a.enabled) && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Play size={16} className="text-accent" />
                <h3 className="text-base font-semibold text-white">
                  What Launched When You Signed In
                </h3>
              </div>
              <div className="card card-animated overflow-hidden">
                <div className="divide-y divide-surface-800/40">
                  {startupApps
                    .filter((a) => a.enabled)
                    .map((app) => {
                      const style = impactStyle(app.impact_estimate);
                      return (
                        <div
                          key={app.id}
                          className="flex items-center gap-3 px-4 py-2.5"
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${style.dot}`}
                          />
                          <span className="text-xs text-white flex-1 truncate">
                            {app.name}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded ${style.bg} ${style.text}`}
                          >
                            {app.impact_estimate}
                          </span>
                          {app.is_game_launcher && (
                            <Gamepad2
                              size={12}
                              className="text-accent shrink-0"
                            />
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            </section>
          )}
        </div>
      )}

      {activeTab === "processes" && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500"
              />
              <input
                value={processSearch}
                onChange={(e) => setProcessSearch(e.target.value)}
                placeholder="Filter processes..."
                className="w-full pl-8 pr-3 py-2 text-sm bg-surface-900 border border-surface-800 rounded-lg text-surface-200 placeholder:text-surface-600 focus:outline-none focus:border-accent/50"
              />
              {processSearch && (
                <button
                  onClick={() => setProcessSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex gap-1 text-xs">
              {(["cpu", "memory", "name"] as SortKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setProcessSort(key)}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    processSort === key
                      ? "bg-accent/10 text-accent"
                      : "text-surface-400 hover:text-white bg-surface-800/50"
                  }`}
                >
                  {key === "cpu"
                    ? "CPU"
                    : key === "memory"
                      ? "Memory"
                      : "Name"}
                </button>
              ))}
            </div>
          </div>

          {/* Top consumers summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card card-animated p-4">
              <div className="flex items-center gap-2 mb-3">
                <Cpu size={16} className="text-accent" />
                <h4 className="text-xs font-semibold text-surface-300">
                  Top CPU Consumers
                </h4>
              </div>
              <div className="space-y-2">
                {processes
                  .slice()
                  .sort((a, b) => b.cpu_percent - a.cpu_percent)
                  .slice(0, 5)
                  .map((p) => (
                    <div
                      key={p.pid}
                      className="flex items-center justify-between"
                    >
                      <span className="text-xs text-surface-300 truncate flex-1 mr-2">
                        {p.name}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-16 h-1.5 rounded-full bg-surface-800">
                          <div
className="h-full rounded-full bg-accent progress-animated"
                                            style={{
                                              width: `${Math.min(100, p.cpu_percent)}%`,
                                            }}
                          />
                        </div>
                        <span className="text-[11px] text-surface-400 w-10 text-right">
                          {p.cpu_percent.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            <div className="card card-animated p-4">
              <div className="flex items-center gap-2 mb-3">
                <MemoryStick size={16} className="text-warning" />
                <h4 className="text-xs font-semibold text-surface-300">
                  Top RAM Consumers
                </h4>
              </div>
              <div className="space-y-2">
                {processes
                  .slice()
                  .sort((a, b) => b.memory_mb - a.memory_mb)
                  .slice(0, 5)
                  .map((p) => (
                    <div
                      key={p.pid}
                      className="flex items-center justify-between"
                    >
                      <span className="text-xs text-surface-300 truncate flex-1 mr-2">
                        {p.name}
                      </span>
                      <span className="text-[11px] text-surface-400 shrink-0">
                        {p.memory_mb.toFixed(0)} MB
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Full process table */}
          <div className="card card-animated overflow-hidden">
            <div className="grid grid-cols-[1fr_80px_80px_60px] gap-2 px-4 py-2.5 bg-surface-800/30 text-xs font-semibold text-surface-400 border-b border-surface-800">
              <span>Process</span>
              <span className="text-right">CPU %</span>
              <span className="text-right">Memory</span>
              <span className="text-right">PID</span>
            </div>
            <div className="max-h-96 overflow-y-auto divide-y divide-surface-800/30">
              {sortedProcesses.map((p) => (
                <div
                  key={`${p.pid}-${p.name}`}
                  className="grid grid-cols-[1fr_80px_80px_60px] gap-2 px-4 py-2.5 text-xs hover:bg-surface-800/20 transition-colors"
                >
                  <span className="text-surface-200 truncate">{p.name}</span>
                  <span
                    className={`text-right ${
                      p.cpu_percent > 10
                        ? "text-red-400 font-medium"
                        : p.cpu_percent > 3
                          ? "text-yellow-400"
                          : "text-surface-400"
                    }`}
                  >
                    {p.cpu_percent.toFixed(1)}%
                  </span>
                  <span className="text-right text-surface-400">
                    {p.memory_mb.toFixed(0)} MB
                  </span>
                  <span className="text-right text-surface-600">{p.pid}</span>
                </div>
              ))}
              {sortedProcesses.length === 0 && (
                <p className="text-xs text-surface-500 text-center py-8">
                  No processes found.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "services" && (
        <div className="space-y-2">
          {optionalServices.map((svc) => (
            <div key={svc.name} className="card card-animated p-4">
              <div className="flex items-center gap-2">
                <Server size={14} className="text-surface-400" />
                <span className="text-sm font-medium text-white">
                  {svc.display_name}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded ${
                    svc.status === "Running"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-surface-700 text-surface-400"
                  }`}
                >
                  {svc.status}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-700 text-surface-500">
                  {svc.startup_type}
                </span>
              </div>
              <p className="text-xs text-surface-500 mt-1">
                {svc.disable_reason || svc.description}
              </p>
            </div>
          ))}
          {optionalServices.length === 0 && (
            <div className="card card-animated text-center py-12">
              <Server size={32} className="mx-auto text-surface-600 mb-3" />
              <p className="text-sm text-surface-400">
                No optional services detected.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
