use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanFinding {
    pub id: String,
    pub severity: FindingSeverity,
    pub category: String,
    pub title: String,
    pub description: String,
    pub recommended_fix: Option<String>,
    pub tweak_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Ord, PartialOrd, Eq)]
pub enum FindingSeverity {
    Critical,
    High,
    Medium,
    Low,
    Info,
}

pub fn scan_system() -> Vec<ScanFinding> {
    let mut findings = Vec::new();

    let mut sys = sysinfo::System::new_all();
    sys.refresh_all();

    let ram_pct = (sys.used_memory() as f64 / sys.total_memory() as f64) * 100.0;
    if ram_pct > 85.0 {
        findings.push(ScanFinding {
            id: "high_ram".into(),
            severity: FindingSeverity::High,
            category: "Performance".into(),
            title: "High RAM Usage".into(),
            description: format!("RAM usage is at {:.0}%. Consider closing unnecessary applications.", ram_pct),
            recommended_fix: Some("Close browser tabs and unnecessary apps".into()),
            tweak_id: Some("disable_background_apps".into()),
        });
    }

    let process_count = sys.processes().len();
    if process_count > 150 {
        findings.push(ScanFinding {
            id: "many_processes".into(),
            severity: FindingSeverity::Medium,
            category: "Performance".into(),
            title: "Many Background Processes".into(),
            description: format!("{} processes running. This may impact performance.", process_count),
            recommended_fix: Some("Review startup apps and disable unnecessary services".into()),
            tweak_id: None,
        });
    }

    let storage_info = crate::system::hardware::collect_hardware_info();
    for drive in &storage_info.storage {
        if drive.free_gb < 10.0 && drive.total_gb > 0.0 {
            findings.push(ScanFinding {
                id: format!("low_space_{}", drive.drive_letter),
                severity: FindingSeverity::High,
                category: "Storage".into(),
                title: format!("Low Disk Space on {}", drive.drive_letter),
                description: format!("Only {:.1} GB free. This can cause stuttering and slowdowns.", drive.free_gb),
                recommended_fix: Some("Run cleanup or move files to another drive".into()),
                tweak_id: None,
            });
        }
    }

    if !storage_info.power.is_plugged_in && storage_info.power.has_battery {
        findings.push(ScanFinding {
            id: "on_battery".into(),
            severity: FindingSeverity::Medium,
            category: "Power".into(),
            title: "Running on Battery".into(),
            description: "Performance may be limited while on battery power.".into(),
            recommended_fix: Some("Plug in for best performance".into()),
            tweak_id: None,
        });
    }

    findings.sort_by(|a, b| a.severity.cmp(&b.severity));
    findings
}

pub fn get_performance_bottleneck() -> String {
    let mut sys = sysinfo::System::new_all();
    sys.refresh_all();
    
    let ram_pct = (sys.used_memory() as f64 / sys.total_memory() as f64) * 100.0;
    let cpu_avg: f32 = sys.cpus().iter().map(|c| c.cpu_usage()).sum::<f32>() / sys.cpus().len() as f32;

    if ram_pct > 85.0 { "RAM-bound".into() }
    else if cpu_avg > 80.0 { "CPU-bound".into() }
    else { "Balanced".into() }
}
