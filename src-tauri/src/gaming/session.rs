use serde::{Deserialize, Serialize};
use std::os::windows::process::CommandExt;
use sysinfo::System;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PreGameCheckResult {
    pub checks: Vec<CheckItem>,
    pub overall_ready: bool,
    pub score: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CheckItem {
    pub id: String,
    pub name: String,
    pub status: CheckStatus,
    pub message: String,
    pub can_fix: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum CheckStatus {
    Pass,
    Warning,
    Fail,
}

pub fn run_pre_game_check() -> PreGameCheckResult {
    let mut checks = Vec::new();
    let mut sys = System::new_all();
    sys.refresh_all();

    let total_ram = sys.total_memory() / 1024 / 1024;
    let used_ram = sys.used_memory() / 1024 / 1024;
    let ram_pct = (used_ram as f32 / total_ram as f32) * 100.0;
    checks.push(CheckItem {
        id: "ram_pressure".into(),
        name: "RAM Pressure".into(),
        status: if ram_pct > 85.0 { CheckStatus::Fail } else if ram_pct > 70.0 { CheckStatus::Warning } else { CheckStatus::Pass },
        message: format!("{:.0}% RAM used ({} / {} MB)", ram_pct, used_ram, total_ram),
        can_fix: true,
    });

    let process_count = sys.processes().len();
    checks.push(CheckItem {
        id: "process_count".into(),
        name: "Background Processes".into(),
        status: if process_count > 200 { CheckStatus::Warning } else { CheckStatus::Pass },
        message: format!("{} processes running", process_count),
        can_fix: true,
    });

    let power_plan = get_power_plan();
    let is_high_perf = power_plan.to_lowercase().contains("high") || power_plan.to_lowercase().contains("ultimate");
    checks.push(CheckItem {
        id: "power_plan".into(),
        name: "Power Plan".into(),
        status: if is_high_perf { CheckStatus::Pass } else { CheckStatus::Warning },
        message: format!("Current: {}", power_plan),
        can_fix: true,
    });

    let disk_space = get_free_disk_space_gb();
    checks.push(CheckItem {
        id: "disk_space".into(),
        name: "Free Disk Space".into(),
        status: if disk_space < 10.0 { CheckStatus::Fail } else if disk_space < 30.0 { CheckStatus::Warning } else { CheckStatus::Pass },
        message: format!("{:.1} GB free on system drive", disk_space),
        can_fix: true,
    });

    let overlays = detect_running_overlays(&sys);
    checks.push(CheckItem {
        id: "overlays".into(),
        name: "Overlay Software".into(),
        status: if overlays.is_empty() { CheckStatus::Pass } else { CheckStatus::Warning },
        message: if overlays.is_empty() { "No overlays detected".into() } else { format!("Running: {}", overlays.join(", ")) },
        can_fix: false,
    });

    let launcher_count = super::launchers::get_running_launcher_count();
    checks.push(CheckItem {
        id: "launchers".into(),
        name: "Game Launchers".into(),
        status: if launcher_count > 2 { CheckStatus::Warning } else { CheckStatus::Pass },
        message: format!("{} launchers running", launcher_count),
        can_fix: true,
    });

    let pass_count = checks.iter().filter(|c| c.status == CheckStatus::Pass).count();
    let score = ((pass_count as f32 / checks.len() as f32) * 100.0) as u32;
    let overall_ready = checks.iter().all(|c| c.status != CheckStatus::Fail);

    PreGameCheckResult { checks, overall_ready, score }
}

fn get_power_plan() -> String {
    let output = std::process::Command::new("powercfg")
        .args(["/getactivescheme"])
        .creation_flags(0x08000000)
        .output();
    match output {
        Ok(out) => {
            let text = String::from_utf8_lossy(&out.stdout);
            if let Some(start) = text.find('(') {
                if let Some(end) = text.find(')') {
                    return text[start + 1..end].to_string();
                }
            }
            "Unknown".into()
        }
        Err(_) => "Unknown".into(),
    }
}

fn get_free_disk_space_gb() -> f64 {
    let output = std::process::Command::new("wmic")
        .args(["logicaldisk", "where", "DeviceID='C:'", "get", "FreeSpace"])
        .creation_flags(0x08000000)
        .output();
    match output {
        Ok(out) => {
            let text = String::from_utf8_lossy(&out.stdout);
            text.lines()
                .skip(1)
                .find_map(|l| l.trim().parse::<u64>().ok())
                .map(|b| b as f64 / 1_073_741_824.0)
                .unwrap_or(0.0)
        }
        Err(_) => 0.0,
    }
}

fn detect_running_overlays(sys: &System) -> Vec<String> {
    let overlay_processes = [
        ("Discord", "discord.exe"),
        ("GeForce Experience", "nvcontainer.exe"),
        ("Steam Overlay", "gameoverlayui.exe"),
        ("MSI Afterburner", "MSIAfterburner.exe"),
        ("RivaTuner", "RTSS.exe"),
        ("Xbox Game Bar", "GameBar.exe"),
        ("Medal.tv", "Medal.exe"),
    ];

    let mut found = Vec::new();
    for (name, proc_name) in &overlay_processes {
        let lower = proc_name.to_lowercase();
        if sys.processes().values().any(|p| p.name().to_string_lossy().to_lowercase() == lower) {
            found.push(name.to_string());
        }
    }
    found
}

pub fn get_gaming_readiness_score() -> u32 {
    run_pre_game_check().score
}
