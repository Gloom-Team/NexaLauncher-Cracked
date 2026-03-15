use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::fs;
use std::os::windows::process::CommandExt;
use std::path::PathBuf;
use sysinfo::System;
use winreg::enums::*;
use winreg::RegKey;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemSnapshot {
    pub id: String,
    pub timestamp: DateTime<Utc>,
    pub label: String,
    pub startup_app_count: usize,
    pub process_count: usize,
    pub ram_used_mb: u64,
    pub ram_total_mb: u64,
    pub cpu_usage_percent: f32,
    pub power_plan: String,
}

pub fn take_system_snapshot(label: &str) -> SystemSnapshot {
    let mut sys = System::new_all();
    sys.refresh_all();
    std::thread::sleep(std::time::Duration::from_millis(300));
    sys.refresh_all();

    SystemSnapshot {
        id: Utc::now().timestamp_millis().to_string(),
        timestamp: Utc::now(),
        label: label.to_string(),
        startup_app_count: count_startup_apps(),
        process_count: sys.processes().len(),
        ram_used_mb: sys.used_memory() / 1024 / 1024,
        ram_total_mb: sys.total_memory() / 1024 / 1024,
        cpu_usage_percent: sys.global_cpu_usage(),
        power_plan: get_power_plan_name(),
    }
}

fn count_startup_apps() -> usize {
    let mut count = 0;

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    if let Ok(key) = hkcu.open_subkey(r"SOFTWARE\Microsoft\Windows\CurrentVersion\Run") {
        count += key.enum_values().count();
    }

    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    if let Ok(key) = hklm.open_subkey(r"SOFTWARE\Microsoft\Windows\CurrentVersion\Run") {
        count += key.enum_values().count();
    }

    count
}

fn get_power_plan_name() -> String {
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

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct SnapshotStore {
    pub snapshots: Vec<SystemSnapshot>,
}

impl SnapshotStore {
    pub fn load() -> Result<Self> {
        let path = Self::store_path()?;
        if path.exists() {
            let content = fs::read_to_string(&path)?;
            Ok(serde_json::from_str(&content).unwrap_or_default())
        } else {
            Ok(Self::default())
        }
    }

    pub fn save(&self) -> Result<()> {
        let path = Self::store_path()?;
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        let content = serde_json::to_string_pretty(&self)?;
        fs::write(&path, content)?;
        Ok(())
    }

    fn store_path() -> Result<PathBuf> {
        let base = dirs::data_dir().context("Cannot find AppData directory")?;
        Ok(base.join("ReadyPC").join("snapshots.json"))
    }

    pub fn add_snapshot(&mut self, snapshot: SystemSnapshot) -> Result<()> {
        self.snapshots.push(snapshot);
        self.save()
    }
}
