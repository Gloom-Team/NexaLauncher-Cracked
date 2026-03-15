import { invoke } from "@tauri-apps/api/core";
import type {
  TweakDefinition,
  TweakStatus,
  ProfileDefinition,
  ProfileStatus,
  CustomProfile,
  SystemInfoData,
  ProcessInfo,
  SystemSnapshot,
  ChangeEntry,
  HardwareInfo,
  GameLauncher,
  GameLibrary,
  PreGameCheckResult,
  OverlayInfo,
  ReadinessReport,
  StartupApp,
  ServiceInfo,
  CleanupTarget,
  CleanupResult,
  LargeFile,
  DiskUsageEntry,
  NetworkInterface,
  WifiStatus,
  PingResult,
  AutomationRule,
  ScanResult,
  ScanFinding,
} from "./types";

// Tweaks
export async function getAllTweaks(): Promise<TweakDefinition[]> {
  return invoke("get_all_tweaks");
}

export async function getTweakStatus(): Promise<TweakStatus[]> {
  return invoke("get_tweak_status");
}

export async function applyTweak(id: string): Promise<string[]> {
  return invoke("apply_tweak", { id });
}

export async function revertTweak(id: string): Promise<string[]> {
  return invoke("revert_tweak", { id });
}

// Profiles
export async function getProfiles(): Promise<ProfileDefinition[]> {
  return invoke("get_profiles");
}

export async function getProfileStatus(): Promise<ProfileStatus[]> {
  return invoke("get_profile_status");
}

export async function applyProfile(id: string): Promise<string[]> {
  return invoke("apply_profile", { id });
}

export async function revertProfile(id: string): Promise<string[]> {
  return invoke("revert_profile", { id });
}

// Custom profiles
export async function getCustomProfiles(): Promise<CustomProfile[]> {
  return invoke("get_custom_profiles");
}

export async function createCustomProfile(profile: CustomProfile): Promise<void> {
  return invoke("create_custom_profile", { profile });
}

export async function deleteCustomProfile(id: string): Promise<void> {
  return invoke("delete_custom_profile", { id });
}

export async function exportProfile(id: string): Promise<string> {
  return invoke("export_profile", { id });
}

export async function importProfile(json: string): Promise<void> {
  return invoke("import_profile", { json });
}

// System info
export async function getSystemInfo(): Promise<SystemInfoData> {
  return invoke("get_system_info");
}

export async function getProcesses(): Promise<ProcessInfo[]> {
  return invoke("get_processes");
}

export async function takeSnapshot(label: string): Promise<SystemSnapshot> {
  return invoke("take_snapshot", { label });
}

export async function getSnapshots(): Promise<SystemSnapshot[]> {
  return invoke("get_snapshots");
}

// Hardware
export async function getHardwareInfo(): Promise<HardwareInfo> {
  return invoke("get_hardware_info");
}

// Change log / Undo
export async function getChangeLog(): Promise<ChangeEntry[]> {
  return invoke("get_change_log");
}

export async function exportChanges(): Promise<string> {
  return invoke("export_changes");
}

export async function undoAll(): Promise<string[]> {
  return invoke("undo_all");
}

export async function getActiveTweaksCount(): Promise<number> {
  return invoke("get_active_tweaks_count");
}

// Gaming
export async function getGameLaunchers(): Promise<GameLauncher[]> {
  return invoke("get_game_launchers");
}

export async function getInstalledGames(): Promise<GameLibrary> {
  return invoke("get_installed_games");
}

export async function runPreGameCheck(): Promise<PreGameCheckResult> {
  return invoke("run_pre_game_check");
}

export async function getOverlays(): Promise<OverlayInfo[]> {
  return invoke("get_overlays");
}

export async function getGamingReadiness(): Promise<ReadinessReport> {
  return invoke("get_gaming_readiness");
}

// Startup & Services
export async function getStartupApps(): Promise<StartupApp[]> {
  return invoke("get_startup_apps");
}

export async function disableStartupApp(id: string): Promise<void> {
  return invoke("disable_startup_app", { id });
}

export async function enableStartupApp(id: string, path: string): Promise<void> {
  return invoke("enable_startup_app", { id, path });
}

export async function getServices(): Promise<ServiceInfo[]> {
  return invoke("get_services");
}

export async function getOptionalServices(): Promise<ServiceInfo[]> {
  return invoke("get_optional_services");
}

// Cleanup
export async function scanCleanupTargets(): Promise<CleanupTarget[]> {
  return invoke("scan_cleanup_targets");
}

export async function executeCleanup(targetIds: string[]): Promise<CleanupResult> {
  return invoke("execute_cleanup", { targetIds });
}

export async function scanLargeFiles(minSizeMb: number, path: string): Promise<LargeFile[]> {
  return invoke("scan_large_files", { minSizeMb, path });
}

export async function getDiskUsageMap(path: string): Promise<DiskUsageEntry[]> {
  return invoke("get_disk_usage_map", { path });
}

// Network
export async function getNetworkInterfaces(): Promise<NetworkInterface[]> {
  return invoke("get_network_interfaces");
}

export async function getWifiStatus(): Promise<WifiStatus> {
  return invoke("get_wifi_status");
}

export async function runPingTest(host: string): Promise<PingResult> {
  return invoke("run_ping_test", { host });
}

// Automation
export async function getAutomationRules(): Promise<AutomationRule[]> {
  return invoke("get_automation_rules");
}

export async function addAutomationRule(rule: AutomationRule): Promise<void> {
  return invoke("add_automation_rule", { rule });
}

export async function removeAutomationRule(id: string): Promise<void> {
  return invoke("remove_automation_rule", { id });
}

export async function toggleAutomationRule(id: string, enabled: boolean): Promise<void> {
  return invoke("toggle_automation_rule", { id, enabled });
}

export async function getDefaultAutomationRules(): Promise<AutomationRule[]> {
  return invoke("get_default_automation_rules");
}

// Scanner & Recommendations
export async function runSystemScan(): Promise<ScanResult> {
  return invoke("run_system_scan");
}

export async function getSystemFindings(): Promise<ScanFinding[]> {
  return invoke("get_system_findings");
}

export async function getPerformanceBottleneck(): Promise<string> {
  return invoke("get_performance_bottleneck");
}
