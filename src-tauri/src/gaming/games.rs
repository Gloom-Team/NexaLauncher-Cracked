use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstalledGame {
    pub id: String,
    pub name: String,
    pub launcher: String,
    pub install_path: Option<String>,
    pub executable: Option<String>,
    pub is_favorite: bool,
    pub notes: String,
    pub linked_profile_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct GameLibrary {
    pub games: Vec<InstalledGame>,
    pub manual_games: Vec<InstalledGame>,
}

impl GameLibrary {
    pub fn scan() -> Self {
        let mut games = Vec::new();
        games.extend(scan_steam_games());
        games.extend(scan_epic_games());
        GameLibrary {
            games,
            manual_games: load_manual_games().unwrap_or_default(),
        }
    }

    pub fn all_games(&self) -> Vec<&InstalledGame> {
        self.games.iter().chain(self.manual_games.iter()).collect()
    }
}

fn scan_steam_games() -> Vec<InstalledGame> {
    let mut games = Vec::new();
    let hkcu = winreg::RegKey::predef(winreg::enums::HKEY_CURRENT_USER);
    if let Ok(key) = hkcu.open_subkey(r"Software\Valve\Steam") {
        let steam_path: String = key.get_value("SteamPath").unwrap_or_default();
        if !steam_path.is_empty() {
            let vdf_path = PathBuf::from(&steam_path).join("steamapps").join("libraryfolders.vdf");
            if let Ok(content) = fs::read_to_string(&vdf_path) {
                for line in content.lines() {
                    let trimmed = line.trim();
                    if trimmed.starts_with("\"name\"") {
                        let name = trimmed.replace("\"name\"", "").replace('"', "").trim().to_string();
                        if !name.is_empty() {
                            games.push(InstalledGame {
                                id: format!("steam_{}", name.to_lowercase().replace(' ', "_")),
                                name,
                                launcher: "steam".into(),
                                install_path: None,
                                executable: None,
                                is_favorite: false,
                                notes: String::new(),
                                linked_profile_id: None,
                            });
                        }
                    }
                }
            }
            if let Ok(entries) = fs::read_dir(PathBuf::from(&steam_path).join("steamapps")) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.extension().map(|e| e == "acf").unwrap_or(false) {
                        if let Ok(content) = fs::read_to_string(&path) {
                            let mut name = String::new();
                            let mut installdir = String::new();
                            for line in content.lines() {
                                let t = line.trim();
                                if t.starts_with("\"name\"") {
                                    name = t.split('"').nth(3).unwrap_or("").to_string();
                                }
                                if t.starts_with("\"installdir\"") {
                                    installdir = t.split('"').nth(3).unwrap_or("").to_string();
                                }
                            }
                            if !name.is_empty() && name != "Steamworks Common Redistributables" {
                                games.push(InstalledGame {
                                    id: format!("steam_{}", name.to_lowercase().replace(' ', "_").replace(|c: char| !c.is_alphanumeric() && c != '_', "")),
                                    name,
                                    launcher: "steam".into(),
                                    install_path: Some(format!("{}/steamapps/common/{}", steam_path, installdir)),
                                    executable: None,
                                    is_favorite: false,
                                    notes: String::new(),
                                    linked_profile_id: None,
                                });
                            }
                        }
                    }
                }
            }
        }
    }
    games.dedup_by(|a, b| a.id == b.id);
    games
}

fn scan_epic_games() -> Vec<InstalledGame> {
    let mut games = Vec::new();
    let manifests_dir = dirs::data_local_dir()
        .map(|d| d.join("EpicGamesLauncher").join("Saved").join("Config").join("Windows"));
    if let Some(dir) = manifests_dir {
        let manifest_dir = dir.parent()
            .and_then(|p| p.parent())
            .map(|p| p.join("Manifests"));
        if let Some(mdir) = manifest_dir {
            if let Ok(entries) = fs::read_dir(mdir) {
                for entry in entries.flatten() {
                    if entry.path().extension().map(|e| e == "item").unwrap_or(false) {
                        if let Ok(content) = fs::read_to_string(entry.path()) {
                            if let Ok(val) = serde_json::from_str::<HashMap<String, serde_json::Value>>(&content) {
                                let name = val.get("DisplayName").and_then(|v| v.as_str()).unwrap_or("").to_string();
                                let install = val.get("InstallLocation").and_then(|v| v.as_str()).map(String::from);
                                if !name.is_empty() {
                                    games.push(InstalledGame {
                                        id: format!("epic_{}", name.to_lowercase().replace(' ', "_")),
                                        name,
                                        launcher: "epic".into(),
                                        install_path: install,
                                        executable: None,
                                        is_favorite: false,
                                        notes: String::new(),
                                        linked_profile_id: None,
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    games
}

fn load_manual_games() -> anyhow::Result<Vec<InstalledGame>> {
    let path = dirs::data_dir()
        .ok_or_else(|| anyhow::anyhow!("No data dir"))?
        .join("ReadyPC")
        .join("manual_games.json");
    if path.exists() {
        let content = fs::read_to_string(path)?;
        Ok(serde_json::from_str(&content)?)
    } else {
        Ok(Vec::new())
    }
}

pub fn save_manual_games(games: &[InstalledGame]) -> anyhow::Result<()> {
    let path = dirs::data_dir()
        .ok_or_else(|| anyhow::anyhow!("No data dir"))?
        .join("ReadyPC")
        .join("manual_games.json");
    let content = serde_json::to_string_pretty(games)?;
    fs::write(path, content)?;
    Ok(())
}
