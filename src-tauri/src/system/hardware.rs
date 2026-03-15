use serde::{Deserialize, Serialize};
use std::os::windows::process::CommandExt;
use sysinfo::System;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareInfo {
    pub cpu: CpuInfo,
    pub gpu: GpuInfo,
    pub ram: RamInfo,
    pub storage: Vec<StorageInfo>,
    pub display: Vec<DisplayInfo>,
    pub power: PowerInfo,
    pub network: NetworkHwInfo,
    pub os: OsInfo,
    pub tier: HardwareTier,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CpuInfo {
    pub name: String,
    pub cores: usize,
    pub threads: usize,
    pub base_clock_mhz: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GpuInfo {
    pub name: String,
    pub vram_mb: Option<u64>,
    pub is_integrated: bool,
    pub has_discrete: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RamInfo {
    pub total_mb: u64,
    pub speed_mhz: Option<u64>,
    pub slots_used: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageInfo {
    pub drive_letter: String,
    pub total_gb: f64,
    pub free_gb: f64,
    pub storage_type: StorageType,
    pub is_system_drive: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum StorageType {
    SSD,
    HDD,
    NVMe,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DisplayInfo {
    pub name: String,
    pub resolution: String,
    pub refresh_rate: u32,
    pub is_primary: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PowerInfo {
    pub is_laptop: bool,
    pub has_battery: bool,
    pub is_plugged_in: bool,
    pub battery_percent: Option<u32>,
    pub current_power_plan: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkHwInfo {
    pub has_wifi: bool,
    pub has_ethernet: bool,
    pub active_connection: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OsInfo {
    pub name: String,
    pub version: String,
    pub build: String,
    pub vbs_enabled: bool,
    pub memory_integrity: bool,
    pub hags_enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum HardwareTier {
    Low,
    Mid,
    High,
    Enthusiast,
}

pub fn collect_hardware_info() -> HardwareInfo {
    let mut sys = System::new_all();
    sys.refresh_all();

    let cpu = collect_cpu_info(&sys);
    let gpu = collect_gpu_info();
    let ram = collect_ram_info(&sys);
    let storage = collect_storage_info();
    let display = collect_display_info();
    let power = collect_power_info();
    let network = collect_network_hw_info();
    let os = collect_os_info();
    let tier = determine_tier(&cpu, &gpu, &ram);

    HardwareInfo { cpu, gpu, ram, storage, display, power, network, os, tier }
}

fn collect_cpu_info(sys: &System) -> CpuInfo {
    let name = sys.cpus().first().map(|c| c.brand().to_string()).unwrap_or("Unknown".into());
    let cores = sys.physical_core_count().unwrap_or(0);
    let threads = sys.cpus().len();
    let base_clock_mhz = sys.cpus().first().map(|c| c.frequency());
    CpuInfo { name, cores, threads, base_clock_mhz }
}

fn collect_gpu_info() -> GpuInfo {
    let output = std::process::Command::new("wmic")
        .args(["path", "win32_videocontroller", "get", "name,AdapterRAM"])
        .creation_flags(0x08000000)
        .output();
    let (name, vram) = match output {
        Ok(out) => {
            let text = String::from_utf8_lossy(&out.stdout);
            let line = text.lines().skip(1).find(|l| !l.trim().is_empty()).unwrap_or("").trim().to_string();
            let parts: Vec<&str> = line.splitn(2, "  ").collect();
            let vram_bytes: Option<u64> = parts.first().and_then(|p| p.trim().parse().ok());
            let gpu_name = parts.last().unwrap_or(&"Unknown GPU").trim().to_string();
            (gpu_name, vram_bytes.map(|b| b / 1024 / 1024))
        }
        Err(_) => ("Unknown GPU".into(), None),
    };
    let is_integrated = name.to_lowercase().contains("intel") && name.to_lowercase().contains("uhd")
        || name.to_lowercase().contains("iris")
        || name.to_lowercase().contains("vega");
    GpuInfo { name, vram_mb: vram, is_integrated, has_discrete: !is_integrated }
}

fn collect_ram_info(sys: &System) -> RamInfo {
    let total_mb = sys.total_memory() / 1024 / 1024;
    let speed_output = std::process::Command::new("wmic")
        .args(["memorychip", "get", "Speed"])
        .creation_flags(0x08000000)
        .output();
    let speed = speed_output.ok().and_then(|o| {
        String::from_utf8_lossy(&o.stdout).lines().skip(1)
            .find_map(|l| l.trim().parse::<u64>().ok())
    });
    RamInfo { total_mb, speed_mhz: speed, slots_used: None }
}

fn collect_storage_info() -> Vec<StorageInfo> {
    let mut drives = Vec::new();
    let output = std::process::Command::new("wmic")
        .args(["logicaldisk", "get", "DeviceID,Size,FreeSpace,MediaType"])
        .creation_flags(0x08000000)
        .output();
    if let Ok(out) = output {
        let text = String::from_utf8_lossy(&out.stdout);
        for line in text.lines().skip(1) {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 3 {
                let letter = parts[0].to_string();
                let free: f64 = parts[1].parse::<u64>().unwrap_or(0) as f64 / 1_073_741_824.0;
                let _media = parts.get(2).unwrap_or(&"");
                let total: f64 = parts.get(3).and_then(|p| p.parse::<u64>().ok()).unwrap_or(0) as f64 / 1_073_741_824.0;

                drives.push(StorageInfo {
                    drive_letter: letter.clone(),
                    total_gb: total,
                    free_gb: free,
                    storage_type: detect_drive_type(&letter),
                    is_system_drive: letter.starts_with("C"),
                });
            }
        }
    }
    if drives.is_empty() {
        drives.push(StorageInfo {
            drive_letter: "C:".into(),
            total_gb: 0.0,
            free_gb: 0.0,
            storage_type: StorageType::Unknown,
            is_system_drive: true,
        });
    }
    drives
}

fn detect_drive_type(letter: &str) -> StorageType {
    let output = std::process::Command::new("powershell")
        .args(["-Command", &format!(
            "Get-PhysicalDisk | ForEach-Object {{ $_ | Get-Disk | Get-Partition | Where-Object DriveLetter -eq '{}' | ForEach-Object {{ (Get-PhysicalDisk -DeviceNumber $_.DiskNumber).MediaType }} }}",
            letter.replace(":", "")
        )])
        .creation_flags(0x08000000)
        .output();
    match output {
        Ok(out) => {
            let text = String::from_utf8_lossy(&out.stdout).trim().to_lowercase();
            if text.contains("ssd") { StorageType::SSD }
            else if text.contains("hdd") || text.contains("unspecified") { StorageType::HDD }
            else if text.contains("nvme") || text.contains("pcie") { StorageType::NVMe }
            else { StorageType::Unknown }
        }
        Err(_) => StorageType::Unknown,
    }
}

fn collect_display_info() -> Vec<DisplayInfo> {
    let output = std::process::Command::new("wmic")
        .args(["path", "Win32_VideoController", "get", "CurrentHorizontalResolution,CurrentVerticalResolution,CurrentRefreshRate"])
        .creation_flags(0x08000000)
        .output();
    match output {
        Ok(out) => {
            let text = String::from_utf8_lossy(&out.stdout);
            text.lines().skip(1).filter(|l| !l.trim().is_empty()).enumerate().map(|(i, line)| {
                let parts: Vec<&str> = line.split_whitespace().collect();
                let h: u32 = parts.first().and_then(|p| p.parse().ok()).unwrap_or(1920);
                let rate: u32 = parts.get(1).and_then(|p| p.parse().ok()).unwrap_or(60);
                let v: u32 = parts.get(2).and_then(|p| p.parse().ok()).unwrap_or(1080);
                DisplayInfo {
                    name: format!("Display {}", i + 1),
                    resolution: format!("{}x{}", h, v),
                    refresh_rate: rate,
                    is_primary: i == 0,
                }
            }).collect()
        }
        Err(_) => vec![DisplayInfo {
            name: "Primary Display".into(),
            resolution: "Unknown".into(),
            refresh_rate: 60,
            is_primary: true,
        }],
    }
}

fn collect_power_info() -> PowerInfo {
    let output = std::process::Command::new("wmic")
        .args(["path", "Win32_Battery", "get", "BatteryStatus,EstimatedChargeRemaining"])
        .creation_flags(0x08000000)
        .output();
    let (has_battery, is_plugged, battery_pct) = match output {
        Ok(out) => {
            let text = String::from_utf8_lossy(&out.stdout);
            let line = text.lines().skip(1).find(|l| !l.trim().is_empty());
            match line {
                Some(l) => {
                    let parts: Vec<&str> = l.split_whitespace().collect();
                    let status: u32 = parts.first().and_then(|p| p.parse().ok()).unwrap_or(0);
                    let pct: u32 = parts.get(1).and_then(|p| p.parse().ok()).unwrap_or(0);
                    (true, status == 2 || status == 6, Some(pct))
                }
                None => (false, true, None),
            }
        }
        Err(_) => (false, true, None),
    };

    let plan_output = std::process::Command::new("powercfg").args(["/getactivescheme"]).creation_flags(0x08000000).output();
    let plan = plan_output.ok().map(|o| {
        let t = String::from_utf8_lossy(&o.stdout);
        t.find('(').and_then(|s| t.find(')').map(|e| t[s+1..e].to_string())).unwrap_or("Unknown".into())
    }).unwrap_or("Unknown".into());

    PowerInfo {
        is_laptop: has_battery,
        has_battery,
        is_plugged_in: is_plugged,
        battery_percent: battery_pct,
        current_power_plan: plan,
    }
}

fn collect_network_hw_info() -> NetworkHwInfo {
    let output = std::process::Command::new("netsh")
        .args(["wlan", "show", "interfaces"])
        .creation_flags(0x08000000)
        .output();
    let has_wifi = output.ok().map(|o| !String::from_utf8_lossy(&o.stdout).contains("no wireless")).unwrap_or(false);
    
    let eth_output = std::process::Command::new("wmic")
        .args(["nic", "where", "NetConnectionStatus=2", "get", "Name"])
        .creation_flags(0x08000000)
        .output();
    let has_ethernet = eth_output.ok().map(|o| {
        String::from_utf8_lossy(&o.stdout).to_lowercase().contains("ethernet")
    }).unwrap_or(false);

    let active = if has_ethernet { "Ethernet" } else if has_wifi { "Wi-Fi" } else { "Unknown" };

    NetworkHwInfo {
        has_wifi,
        has_ethernet,
        active_connection: active.into(),
    }
}

fn collect_os_info() -> OsInfo {
    let name = System::name().unwrap_or("Windows".into());
    let version = System::os_version().unwrap_or("Unknown".into());

    let vbs = check_registry_dword(
        winreg::enums::HKEY_LOCAL_MACHINE,
        r"SYSTEM\CurrentControlSet\Control\DeviceGuard",
        "EnableVirtualizationBasedSecurity",
    ).unwrap_or(0) == 1;

    let memory_integrity = check_registry_dword(
        winreg::enums::HKEY_LOCAL_MACHINE,
        r"SYSTEM\CurrentControlSet\Control\DeviceGuard\Scenarios\HypervisorEnforcedCodeIntegrity",
        "Enabled",
    ).unwrap_or(0) == 1;

    let hags = check_registry_dword(
        winreg::enums::HKEY_LOCAL_MACHINE,
        r"SYSTEM\CurrentControlSet\Control\GraphicsDrivers",
        "HwSchMode",
    ).unwrap_or(1) == 2;

    OsInfo { name, version, build: "".into(), vbs_enabled: vbs, memory_integrity, hags_enabled: hags }
}

fn check_registry_dword(hive: winreg::HKEY, path: &str, name: &str) -> Option<u32> {
    let root = winreg::RegKey::predef(hive);
    root.open_subkey(path).ok()?.get_value::<u32, _>(name).ok()
}

fn determine_tier(cpu: &CpuInfo, gpu: &GpuInfo, ram: &RamInfo) -> HardwareTier {
    let mut score = 0;
    if ram.total_mb >= 32768 { score += 3; }
    else if ram.total_mb >= 16384 { score += 2; }
    else if ram.total_mb >= 8192 { score += 1; }

    if cpu.threads >= 16 { score += 3; }
    else if cpu.threads >= 8 { score += 2; }
    else if cpu.threads >= 4 { score += 1; }

    if !gpu.is_integrated { score += 2; }
    if gpu.vram_mb.unwrap_or(0) >= 8192 { score += 2; }
    else if gpu.vram_mb.unwrap_or(0) >= 4096 { score += 1; }

    match score {
        0..=3 => HardwareTier::Low,
        4..=6 => HardwareTier::Mid,
        7..=9 => HardwareTier::High,
        _ => HardwareTier::Enthusiast,
    }
}
