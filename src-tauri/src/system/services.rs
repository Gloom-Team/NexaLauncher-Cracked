use serde::{Deserialize, Serialize};
use std::os::windows::process::CommandExt;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceInfo {
    pub name: String,
    pub display_name: String,
    pub status: String,
    pub startup_type: String,
    pub description: String,
    pub is_safe_to_disable: bool,
    pub disable_reason: String,
}

pub fn get_services_list() -> Vec<ServiceInfo> {
    let output = std::process::Command::new("powershell")
        .args(["-Command", "Get-Service | Select-Object Name,DisplayName,Status,StartType | ConvertTo-Json"])
        .creation_flags(0x08000000)
        .output();

    match output {
        Ok(out) => {
            let text = String::from_utf8_lossy(&out.stdout);
            if let Ok(services) = serde_json::from_str::<Vec<serde_json::Value>>(&text) {
                services.iter().map(|s| {
                    let name = s["Name"].as_str().unwrap_or("").to_string();
                    let display = s["DisplayName"].as_str().unwrap_or("").to_string();
                    let status_val = s["Status"].as_u64().unwrap_or(0);
                    let status = match status_val { 4 => "Running", 1 => "Stopped", _ => "Unknown" }.to_string();
                    let start_val = s["StartType"].as_u64().unwrap_or(0);
                    let startup = match start_val { 2 => "Automatic", 3 => "Manual", 4 => "Disabled", _ => "Unknown" }.to_string();
                    let (safe, reason) = check_service_safety(&name);
                    ServiceInfo {
                        name,
                        display_name: display,
                        status,
                        startup_type: startup,
                        description: String::new(),
                        is_safe_to_disable: safe,
                        disable_reason: reason,
                    }
                }).collect()
            } else {
                Vec::new()
            }
        }
        Err(_) => Vec::new(),
    }
}

fn check_service_safety(name: &str) -> (bool, String) {
    let safe_to_disable = [
        ("SysMain", "Superfetch/SysMain can cause disk thrashing on HDDs"),
        ("WSearch", "Windows Search indexing uses CPU and disk"),
        ("DiagTrack", "Telemetry service sends diagnostic data"),
        ("WerSvc", "Windows Error Reporting, not essential"),
        ("Fax", "Fax service, rarely needed"),
        ("MapsBroker", "Downloaded Maps Manager, rarely needed"),
        ("RetailDemo", "Retail Demo service, not needed"),
        ("XblAuthManager", "Xbox Live Auth, not needed if not using Xbox"),
        ("XblGameSave", "Xbox Live Game Save, not needed if not using Xbox"),
        ("XboxNetApiSvc", "Xbox Live Networking, not needed if not using Xbox"),
    ];

    for (svc, reason) in &safe_to_disable {
        if name.eq_ignore_ascii_case(svc) {
            return (true, reason.to_string());
        }
    }
    (false, String::new())
}

pub fn get_optional_services() -> Vec<ServiceInfo> {
    get_services_list().into_iter().filter(|s| s.is_safe_to_disable).collect()
}
