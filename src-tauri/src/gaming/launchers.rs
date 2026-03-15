use serde::{Deserialize, Serialize};
use std::os::windows::process::CommandExt;
use winreg::enums::*;
use winreg::RegKey;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameLauncher {
    pub id: String,
    pub name: String,
    pub installed: bool,
    pub install_path: Option<String>,
    pub running: bool,
    pub process_name: String,
    pub icon: String,
}

pub fn detect_launchers() -> Vec<GameLauncher> {
    vec![
        detect_steam(),
        detect_epic(),
        detect_ea(),
        detect_ubisoft(),
        detect_riot(),
        detect_battlenet(),
        detect_xbox(),
        detect_gog(),
    ]
}

fn detect_steam() -> GameLauncher {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let (installed, path) = match hkcu.open_subkey(r"Software\Valve\Steam") {
        Ok(key) => {
            let p: String = key.get_value("SteamPath").unwrap_or_default();
            (!p.is_empty(), Some(p))
        }
        Err(_) => (false, None),
    };
    GameLauncher {
        id: "steam".into(),
        name: "Steam".into(),
        installed,
        install_path: path,
        running: is_process_running("steam.exe"),
        process_name: "steam.exe".into(),
        icon: "flame".into(),
    }
}

fn detect_epic() -> GameLauncher {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let (installed, path) = match hkcu.open_subkey(r"Software\Epic Games\EOS") {
        Ok(key) => {
            let p: String = key.get_value("ModSdkCommand").unwrap_or_default();
            (!p.is_empty(), Some(p))
        }
        Err(_) => (false, None),
    };
    GameLauncher {
        id: "epic".into(),
        name: "Epic Games Launcher".into(),
        installed,
        install_path: path,
        running: is_process_running("EpicGamesLauncher.exe"),
        process_name: "EpicGamesLauncher.exe".into(),
        icon: "shopping-bag".into(),
    }
}

fn detect_ea() -> GameLauncher {
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    let installed = hklm.open_subkey(r"SOFTWARE\Electronic Arts\EA Desktop").is_ok()
        || hklm.open_subkey(r"SOFTWARE\WOW6432Node\Electronic Arts\EA Desktop").is_ok();
    GameLauncher {
        id: "ea".into(),
        name: "EA App".into(),
        installed,
        install_path: None,
        running: is_process_running("EADesktop.exe"),
        process_name: "EADesktop.exe".into(),
        icon: "gamepad".into(),
    }
}

fn detect_ubisoft() -> GameLauncher {
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    let (installed, path) = match hklm.open_subkey(r"SOFTWARE\WOW6432Node\Ubisoft\Launcher") {
        Ok(key) => {
            let p: String = key.get_value("InstallDir").unwrap_or_default();
            (!p.is_empty(), Some(p))
        }
        Err(_) => (false, None),
    };
    GameLauncher {
        id: "ubisoft".into(),
        name: "Ubisoft Connect".into(),
        installed,
        install_path: path,
        running: is_process_running("UbisoftConnect.exe"),
        process_name: "UbisoftConnect.exe".into(),
        icon: "trophy".into(),
    }
}

fn detect_riot() -> GameLauncher {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let installed = hkcu.open_subkey(r"Software\Riot Games").is_ok();
    GameLauncher {
        id: "riot".into(),
        name: "Riot Client".into(),
        installed,
        install_path: None,
        running: is_process_running("RiotClientServices.exe"),
        process_name: "RiotClientServices.exe".into(),
        icon: "swords".into(),
    }
}

fn detect_battlenet() -> GameLauncher {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let installed = hkcu.open_subkey(r"Software\Blizzard Entertainment\Battle.net").is_ok();
    GameLauncher {
        id: "battlenet".into(),
        name: "Battle.net".into(),
        installed,
        install_path: None,
        running: is_process_running("Battle.net.exe"),
        process_name: "Battle.net.exe".into(),
        icon: "shield".into(),
    }
}

fn detect_xbox() -> GameLauncher {
    let output = std::process::Command::new("powershell")
        .args(["-Command", "Get-AppxPackage Microsoft.GamingApp 2>$null | Select-Object -ExpandProperty InstallLocation"])
        .creation_flags(0x08000000)
        .output();
    let installed = match output {
        Ok(out) => !String::from_utf8_lossy(&out.stdout).trim().is_empty(),
        Err(_) => false,
    };
    GameLauncher {
        id: "xbox".into(),
        name: "Xbox App".into(),
        installed,
        install_path: None,
        running: is_process_running("XboxApp.exe") || is_process_running("GameBar.exe"),
        process_name: "XboxApp.exe".into(),
        icon: "monitor".into(),
    }
}

fn detect_gog() -> GameLauncher {
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    let (installed, path) = match hklm.open_subkey(r"SOFTWARE\WOW6432Node\GOG.com\GalaxyClient") {
        Ok(key) => {
            let p: String = key.get_value("clientExecutable").unwrap_or_default();
            (!p.is_empty(), Some(p))
        }
        Err(_) => (false, None),
    };
    GameLauncher {
        id: "gog".into(),
        name: "GOG Galaxy".into(),
        installed,
        install_path: path,
        running: is_process_running("GalaxyClient.exe"),
        process_name: "GalaxyClient.exe".into(),
        icon: "globe".into(),
    }
}

fn is_process_running(name: &str) -> bool {
    let mut sys = sysinfo::System::new();
    sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);
    let lower = name.to_lowercase();
    sys.processes().values().any(|p| p.name().to_string_lossy().to_lowercase() == lower)
}

pub fn get_running_launcher_count() -> usize {
    detect_launchers().iter().filter(|l| l.running).count()
}
