use serde::{Deserialize, Serialize};
use winreg::enums::*;
use winreg::RegKey;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StartupApp {
    pub id: String,
    pub name: String,
    pub path: String,
    pub location: String,
    pub publisher: Option<String>,
    pub enabled: bool,
    pub impact_estimate: String,
    pub is_game_launcher: bool,
}

pub fn get_startup_apps() -> Vec<StartupApp> {
    let mut apps = Vec::new();
    apps.extend(read_registry_startup(HKEY_CURRENT_USER, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Run", "HKCU\\Run"));
    apps.extend(read_registry_startup(HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Run", "HKLM\\Run"));
    apps.extend(read_registry_startup(HKEY_CURRENT_USER, r"SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce", "HKCU\\RunOnce"));
    apps.extend(read_registry_startup(HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce", "HKLM\\RunOnce"));
    apps.extend(read_startup_folder_apps());
    apps
}

fn read_registry_startup(hive: winreg::HKEY, path: &str, location: &str) -> Vec<StartupApp> {
    let root = RegKey::predef(hive);
    let mut apps = Vec::new();
    if let Ok(key) = root.open_subkey(path) {
        for (name, value) in key.enum_values().flatten() {
            let val_str: String = match value.vtype {
                REG_SZ | REG_EXPAND_SZ => {
                    String::from_utf16_lossy(
                        &value.bytes.chunks_exact(2)
                            .map(|c| u16::from_le_bytes([c[0], c[1]]))
                            .collect::<Vec<_>>()
                    ).trim_end_matches('\0').to_string()
                }
                _ => String::from_utf8_lossy(&value.bytes).to_string(),
            };
            let launcher_names = ["steam", "epic", "origin", "ubisoft", "riot", "battle.net", "gog", "ea desktop"];
            let is_launcher = launcher_names.iter().any(|l| val_str.to_lowercase().contains(l) || name.to_lowercase().contains(l));
            let impact = estimate_impact(&name, &val_str);
            apps.push(StartupApp {
                id: format!("{}\\{}", location, name),
                name: name.clone(),
                path: val_str,
                location: location.into(),
                publisher: None,
                enabled: true,
                impact_estimate: impact,
                is_game_launcher: is_launcher,
            });
        }
    }
    apps
}

fn read_startup_folder_apps() -> Vec<StartupApp> {
    let mut apps = Vec::new();
    if let Some(startup) = dirs::data_dir().map(|d| {
        d.parent().unwrap_or(&d).join("Roaming").join("Microsoft").join("Windows").join("Start Menu").join("Programs").join("Startup")
    }) {
        if let Ok(entries) = std::fs::read_dir(&startup) {
            for entry in entries.flatten() {
                let path = entry.path();
                let name = path.file_stem().unwrap_or_default().to_string_lossy().to_string();
                apps.push(StartupApp {
                    id: format!("StartupFolder\\{}", name),
                    name,
                    path: path.to_string_lossy().into(),
                    location: "Startup Folder".into(),
                    publisher: None,
                    enabled: true,
                    impact_estimate: "Unknown".into(),
                    is_game_launcher: false,
                });
            }
        }
    }
    apps
}

fn estimate_impact(name: &str, _path: &str) -> String {
    let lower = name.to_lowercase();
    let high_impact = ["discord", "spotify", "teams", "onedrive", "dropbox", "creative cloud", "steam", "epic"];
    let medium_impact = ["cortana", "skype", "zoom", "slack", "chrome", "edge", "firefox"];
    
    if high_impact.iter().any(|h| lower.contains(h)) { "High".into() }
    else if medium_impact.iter().any(|m| lower.contains(m)) { "Medium".into() }
    else { "Low".into() }
}

pub fn disable_startup_app(id: &str) -> anyhow::Result<()> {
    let parts: Vec<&str> = id.splitn(2, '\\').collect();
    if parts.len() < 2 { return Err(anyhow::anyhow!("Invalid startup app ID")); }
    let (location, name) = (parts[0], parts[1]);
    
    match location {
        "HKCU\\Run" => {
            let hkcu = RegKey::predef(HKEY_CURRENT_USER);
            if let Ok(key) = hkcu.open_subkey_with_flags(r"SOFTWARE\Microsoft\Windows\CurrentVersion\Run", KEY_READ | KEY_WRITE) {
                let _ = key.delete_value(name);
            }
        }
        "HKLM\\Run" => {
            let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
            if let Ok(key) = hklm.open_subkey_with_flags(r"SOFTWARE\Microsoft\Windows\CurrentVersion\Run", KEY_READ | KEY_WRITE) {
                let _ = key.delete_value(name);
            }
        }
        _ => {}
    }
    Ok(())
}

pub fn enable_startup_app(id: &str, path: &str) -> anyhow::Result<()> {
    let parts: Vec<&str> = id.splitn(2, '\\').collect();
    if parts.len() < 2 { return Err(anyhow::anyhow!("Invalid startup app ID")); }
    let (location, name) = (parts[0], parts[1]);
    
    match location {
        "HKCU\\Run" => {
            let hkcu = RegKey::predef(HKEY_CURRENT_USER);
            let (key, _) = hkcu.create_subkey(r"SOFTWARE\Microsoft\Windows\CurrentVersion\Run")?;
            key.set_value(name, &path)?;
        }
        "HKLM\\Run" => {
            let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
            let (key, _) = hklm.create_subkey(r"SOFTWARE\Microsoft\Windows\CurrentVersion\Run")?;
            key.set_value(name, &path)?;
        }
        _ => {}
    }
    Ok(())
}

pub fn get_game_launcher_startup_count() -> usize {
    get_startup_apps().iter().filter(|a| a.is_game_launcher && a.enabled).count()
}
