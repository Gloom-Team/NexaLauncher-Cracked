use serde::{Deserialize, Serialize};
use std::os::windows::process::CommandExt;
use sysinfo::System;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemInfoData {
    pub os_name: String,
    pub os_version: String,
    pub cpu_name: String,
    pub cpu_cores: usize,
    pub total_ram_mb: u64,
    pub used_ram_mb: u64,
    pub ram_usage_percent: f32,
    pub gpu_info: String,
    pub power_plan: String,
    pub uptime_hours: f64,
}

pub fn collect_system_info() -> SystemInfoData {
    let mut sys = System::new_all();
    sys.refresh_all();

    let os_name = System::name().unwrap_or_else(|| "Windows".into());
    let os_version = System::os_version().unwrap_or_else(|| "Unknown".into());

    let cpu_name = sys
        .cpus()
        .first()
        .map(|c| c.brand().to_string())
        .unwrap_or_else(|| "Unknown CPU".into());
    let cpu_cores = sys.cpus().len();

    let total_ram_mb = sys.total_memory() / 1024 / 1024;
    let used_ram_mb = sys.used_memory() / 1024 / 1024;
    let ram_usage_percent = if total_ram_mb > 0 {
        (used_ram_mb as f32 / total_ram_mb as f32) * 100.0
    } else {
        0.0
    };

    let gpu_info = get_gpu_info();
    let power_plan = get_current_power_plan();

    let uptime_secs = System::uptime();
    let uptime_hours = uptime_secs as f64 / 3600.0;

    SystemInfoData {
        os_name,
        os_version,
        cpu_name,
        cpu_cores,
        total_ram_mb,
        used_ram_mb,
        ram_usage_percent,
        gpu_info,
        power_plan,
        uptime_hours,
    }
}

fn get_gpu_info() -> String {
    let output = std::process::Command::new("wmic")
        .args(["path", "win32_videocontroller", "get", "name"])
        .creation_flags(0x08000000)
        .output();

    match output {
        Ok(out) => {
            let text = String::from_utf8_lossy(&out.stdout);
            text.lines()
                .skip(1)
                .find(|l| !l.trim().is_empty())
                .map(|l| l.trim().to_string())
                .unwrap_or_else(|| "Unknown GPU".into())
        }
        Err(_) => "Unknown GPU".into(),
    }
}

fn get_current_power_plan() -> String {
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
