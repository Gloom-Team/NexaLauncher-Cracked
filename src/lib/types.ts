export type TweakCategory =
  | "Gaming"
  | "Annoyance"
  | "Performance"
  | "Visual"
  | "Startup"
  | "Cleanup"
  | "Power"
  | "Privacy"
  | "Network"
  | "Battery";

export type RiskLevel = "Safe" | "Moderate" | "Advanced";
export type Recommendation = "Recommended" | "Optional" | "Advanced";

export interface TweakDefinition {
  id: string;
  name: string;
  description: string;
  why_it_helps: string;
  category: TweakCategory;
  risk_level: RiskLevel;
  recommendation: Recommendation;
  requires_reboot: boolean;
  requires_admin: boolean;
  requires_signout: boolean;
  reversible: boolean;
  impact_estimate: string;
  when_not_to_use: string;
  how_to_undo: string;
  tags: string[];
  actions: unknown[];
}

export interface TweakStatus {
  tweak_id: string;
  applied: boolean;
}

export interface ProfileDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  tweak_ids: string[];
}

export interface ProfileStatus {
  profile_id: string;
  applied_count: number;
  total_count: number;
  fully_applied: boolean;
}

export interface CustomProfile {
  id: string;
  name: string;
  description: string;
  icon: string;
  tweak_ids: string[];
  created_at: string;
  modified_at: string;
  is_favorite: boolean;
  tags: string[];
  linked_app: string | null;
  linked_game: string | null;
  schedule: ProfileSchedule | null;
}

export interface ProfileSchedule {
  cron: string;
  enabled: boolean;
}

export interface SystemInfoData {
  os_name: string;
  os_version: string;
  cpu_name: string;
  cpu_cores: number;
  total_ram_mb: number;
  used_ram_mb: number;
  ram_usage_percent: number;
  gpu_info: string;
  power_plan: string;
  uptime_hours: number;
}

export interface ProcessInfo {
  name: string;
  pid: number;
  cpu_percent: number;
  memory_mb: number;
}

export interface SystemSnapshot {
  id: string;
  timestamp: string;
  label: string;
  startup_app_count: number;
  process_count: number;
  ram_used_mb: number;
  ram_total_mb: number;
  cpu_usage_percent: number;
  power_plan: string;
}

export interface ChangeEntry {
  id: number;
  timestamp: string;
  tweak_id: string;
  tweak_name: string;
  action: ChangeAction;
  details: string[];
}

export type ChangeAction =
  | "Applied"
  | "Reverted"
  | { ProfileApplied: { profile_name: string } }
  | { ProfileReverted: { profile_name: string } };

// Hardware detection types

export interface HardwareInfo {
  cpu: CpuInfo;
  gpu: GpuInfo;
  ram: RamInfo;
  storage: StorageInfo[];
  display: DisplayInfo[];
  power: PowerInfo;
  network: NetworkHwInfo;
  os: OsInfo;
  tier: string;
}

export interface CpuInfo {
  name: string;
  cores: number;
  threads: number;
  base_clock_mhz: number | null;
}

export interface GpuInfo {
  name: string;
  vram_mb: number | null;
  is_integrated: boolean;
  has_discrete: boolean;
}

export interface RamInfo {
  total_mb: number;
  speed_mhz: number | null;
  slots_used: number | null;
}

export interface StorageInfo {
  drive_letter: string;
  total_gb: number;
  free_gb: number;
  storage_type: string;
  is_system_drive: boolean;
}

export interface DisplayInfo {
  name: string;
  resolution: string;
  refresh_rate: number;
  is_primary: boolean;
}

export interface PowerInfo {
  is_laptop: boolean;
  has_battery: boolean;
  is_plugged_in: boolean;
  battery_percent: number | null;
  current_power_plan: string;
}

export interface NetworkHwInfo {
  has_wifi: boolean;
  has_ethernet: boolean;
  active_connection: string;
}

export interface OsInfo {
  name: string;
  version: string;
  build: string;
  vbs_enabled: boolean;
  memory_integrity: boolean;
  hags_enabled: boolean;
}

// Gaming types

export interface GameLauncher {
  id: string;
  name: string;
  installed: boolean;
  install_path: string | null;
  running: boolean;
  process_name: string;
  icon: string;
}

export interface InstalledGame {
  id: string;
  name: string;
  launcher: string;
  install_path: string | null;
  executable: string | null;
  is_favorite: boolean;
  notes: string;
  linked_profile_id: string | null;
}

export interface GameLibrary {
  games: InstalledGame[];
  manual_games: InstalledGame[];
}

export interface PreGameCheckResult {
  checks: CheckItem[];
  overall_ready: boolean;
  score: number;
}

export interface CheckItem {
  id: string;
  name: string;
  status: "Pass" | "Warning" | "Fail";
  message: string;
  can_fix: boolean;
}

export interface OverlayInfo {
  name: string;
  process_name: string;
  running: boolean;
  impact: string;
  suggestion: string;
}

export interface ReadinessReport {
  gaming_score: number;
  responsiveness_score: number;
  annoyance_score: number;
  optimization_score: number;
  findings: ReadinessFinding[];
}

export interface ReadinessFinding {
  category: string;
  severity: string;
  title: string;
  description: string;
  fix_tweak_id: string | null;
}

// Startup and services types

export interface StartupApp {
  id: string;
  name: string;
  path: string;
  location: string;
  publisher: string | null;
  enabled: boolean;
  impact_estimate: string;
  is_game_launcher: boolean;
}

export interface ServiceInfo {
  name: string;
  display_name: string;
  status: string;
  startup_type: string;
  description: string;
  is_safe_to_disable: boolean;
  disable_reason: string;
}

// Cleanup types

export interface CleanupTarget {
  id: string;
  name: string;
  description: string;
  estimated_size_bytes: number;
  risk: string;
  paths: string[];
  file_count: number;
}

export interface CleanupResult {
  cleaned_bytes: number;
  files_removed: number;
  errors: string[];
}

export interface LargeFile {
  path: string;
  size_bytes: number;
  modified: string;
}

export interface DiskUsageEntry {
  path: string;
  size_bytes: number;
  is_directory: boolean;
}

// Network types

export interface NetworkInterface {
  name: string;
  interface_type: string;
  connected: boolean;
  speed_mbps: number | null;
  ip_address: string | null;
}

export interface WifiStatus {
  connected: boolean;
  ssid: string | null;
  signal_strength: number | null;
  channel: number | null;
  band: string | null;
}

export interface PingResult {
  host: string;
  avg_ms: number | null;
  min_ms: number | null;
  max_ms: number | null;
  packet_loss_pct: number;
  success: boolean;
}

// Automation types

export interface AutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  trigger: AutomationTrigger;
  actions: AutomationAction[];
  revert_actions: AutomationAction[];
}

export type AutomationTrigger =
  | { Schedule: { cron: string } }
  | { ProcessLaunched: { process_name: string } }
  | { ProcessClosed: { process_name: string } }
  | { PowerSourceChanged: { on_battery: boolean } }
  | "FullscreenDetected"
  | "Manual";

export type AutomationAction =
  | { ApplyProfile: { profile_id: string } }
  | { RevertProfile: { profile_id: string } }
  | { ApplyTweak: { tweak_id: string } }
  | { RevertTweak: { tweak_id: string } }
  | { RunCleanup: { target_ids: string[] } }
  | { SuspendProcesses: { names: string[] } }
  | { SetPowerPlan: { guid: string } }
  | "EnableDND"
  | "DisableDND";

// Scan and recommendations types

export interface ScanResult {
  recommendations: RecommendationItem[];
  easiest_wins: RecommendationItem[];
  highest_impact: RecommendationItem[];
  optimization_score: number;
}

export interface RecommendationItem {
  id: string;
  title: string;
  description: string;
  impact: string;
  category: string;
  tweak_id: string | null;
  is_quick_win: boolean;
}

export interface ScanFinding {
  id: string;
  severity: string;
  category: string;
  title: string;
  description: string;
  recommended_fix: string | null;
  tweak_id: string | null;
}

// Constants

export const CATEGORY_ORDER: TweakCategory[] = [
  "Gaming",
  "Annoyance",
  "Performance",
  "Visual",
  "Startup",
  "Cleanup",
  "Power",
  "Privacy",
  "Network",
  "Battery",
];

export const CATEGORY_LABELS: Record<TweakCategory, string> = {
  Gaming: "Gaming",
  Annoyance: "Annoyance Removal",
  Performance: "Performance",
  Visual: "Visual Effects",
  Startup: "Startup",
  Cleanup: "Cleanup",
  Power: "Power Plan",
  Privacy: "Privacy",
  Network: "Network",
  Battery: "Battery",
};
