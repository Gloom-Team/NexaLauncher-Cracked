use anyhow::{Context, Result, bail};
use std::os::windows::process::CommandExt;
use winreg::enums::*;
use winreg::RegKey;

use super::backup::{BackupManager, OriginalValue};
use super::logger::ChangeLogger;
use super::tweak::*;
use crate::utils::admin;

pub fn apply_tweak(
    tweak: &TweakDefinition,
    backup: &mut BackupManager,
    logger: &mut ChangeLogger,
) -> Result<Vec<String>> {
    if tweak.requires_admin && !admin::is_admin() {
        bail!("ELEVATION_REQUIRED");
    }

    if backup.is_applied(&tweak.id) {
        return Ok(vec!["Already applied".to_string()]);
    }

    let originals = backup
        .snapshot_before_apply(tweak)
        .context("Failed to snapshot original values")?;

    let mut details = Vec::new();

    for action in &tweak.actions {
        match action {
            TweakAction::Registry {
                hive,
                path,
                name,
                desired_value,
            } => {
                let root = match hive {
                    RegistryHive::HKLM => RegKey::predef(HKEY_LOCAL_MACHINE),
                    RegistryHive::HKCU => RegKey::predef(HKEY_CURRENT_USER),
                };

                let (key, _) = root
                    .create_subkey(path)
                    .context(format!("Failed to open/create registry key: {}", path))?;

                match desired_value {
                    RegistryValueData::Dword(v) => {
                        key.set_value(name, v)?;
                        details.push(format!("Set {}\\{} = {} (DWORD)", path, name, v));
                    }
                    RegistryValueData::String(v) => {
                        key.set_value(name, v)?;
                        details.push(format!("Set {}\\{} = \"{}\"", path, name, v));
                    }
                    RegistryValueData::Qword(v) => {
                        key.set_value(name, v)?;
                        details.push(format!("Set {}\\{} = {} (QWORD)", path, name, v));
                    }
                    RegistryValueData::Binary(v) => {
                        let raw = winreg::RegValue {
                            bytes: v.clone(),
                            vtype: REG_BINARY,
                        };
                        key.set_raw_value(name, &raw)?;
                        details.push(format!("Set {}\\{} (binary)", path, name));
                    }
                }
            }
            TweakAction::Service {
                name,
                desired_startup,
            } => {
                let start_type = match desired_startup {
                    ServiceStartup::Automatic => "auto",
                    ServiceStartup::Manual => "demand",
                    ServiceStartup::Disabled => "disabled",
                };
                let output = std::process::Command::new("sc")
                    .args(["config", name, &format!("start={}", start_type)])
                    .creation_flags(0x08000000)
                    .output()
                    .context(format!("Failed to configure service: {}", name))?;

                if output.status.success() {
                    details.push(format!("Set service {} to {}", name, start_type));
                } else {
                    let err = String::from_utf8_lossy(&output.stderr);
                    details.push(format!("Warning: service {} config failed: {}", name, err));
                }
            }
            TweakAction::PowerPlan { guid } => {
                let output = std::process::Command::new("powercfg")
                    .args(["/setactive", guid])
                    .creation_flags(0x08000000)
                    .output()
                    .context("Failed to set power plan")?;

                if output.status.success() {
                    details.push(format!("Activated power plan: {}", guid));
                } else {
                    let err = String::from_utf8_lossy(&output.stderr);
                    details.push(format!("Warning: power plan switch failed: {}", err));
                }
            }
            TweakAction::Command { apply_cmd, .. } => {
                let output = std::process::Command::new("cmd")
                    .args(["/C", apply_cmd])
                    .creation_flags(0x08000000)
                    .output()
                    .context(format!("Failed to execute: {}", apply_cmd))?;

                if output.status.success() {
                    details.push(format!("Executed: {}", apply_cmd));
                } else {
                    let err = String::from_utf8_lossy(&output.stderr);
                    details.push(format!("Warning: command failed: {}", err));
                }
            }
            TweakAction::DeleteFiles { paths } => {
                let mut deleted = 0u64;
                for path_pattern in paths {
                    let expanded = expand_env_vars(path_pattern);
                    if let Ok(entries) = std::fs::read_dir(&expanded) {
                        for entry in entries.flatten() {
                            if entry.path().is_file() {
                                let _ = std::fs::remove_file(entry.path());
                                deleted += 1;
                            }
                        }
                    }
                }
                details.push(format!("Deleted {} temporary files", deleted));
            }
            TweakAction::ScheduledTask { name, desired_state } => {
                let state_str = match desired_state {
                    TaskState::Enabled => "Enable",
                    TaskState::Disabled => "Disable",
                };
                let output = std::process::Command::new("schtasks")
                    .args(["/Change", "/TN", name, &format!("/{}", state_str)])
                    .creation_flags(0x08000000)
                    .output()
                    .context(format!("Failed to change scheduled task: {}", name))?;
                if output.status.success() {
                    details.push(format!("Set scheduled task {} to {}", name, state_str));
                } else {
                    let err = String::from_utf8_lossy(&output.stderr);
                    details.push(format!("Warning: scheduled task {} failed: {}", name, err));
                }
            }
            TweakAction::StartupItem { name, location, desired_enabled } => {
                match location {
                    StartupLocation::RegistryCurrentUser | StartupLocation::RegistryLocalMachine => {
                        let root = match location {
                            StartupLocation::RegistryCurrentUser => RegKey::predef(HKEY_CURRENT_USER),
                            _ => RegKey::predef(HKEY_LOCAL_MACHINE),
                        };
                        let run_path = r"SOFTWARE\Microsoft\Windows\CurrentVersion\Run";
                        if !desired_enabled {
                            if let Ok(key) = root.open_subkey_with_flags(run_path, KEY_WRITE | KEY_READ) {
                                if let Ok(val) = key.get_value::<String, _>(name) {
                                    let disabled_path = format!("{}\\DisabledRun", run_path.rsplit_once('\\').map(|(p,_)| p).unwrap_or(run_path));
                                    let (disabled_key, _) = root.create_subkey(&disabled_path).unwrap_or_else(|_| {
                                        root.create_subkey(r"SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run").unwrap()
                                    });
                                    let _ = disabled_key.set_value(name, &val);
                                    let _ = key.delete_value(name);
                                    details.push(format!("Disabled startup item: {}", name));
                                }
                            }
                        } else {
                            details.push(format!("Enabled startup item: {}", name));
                        }
                    }
                    _ => {
                        details.push(format!("Startup folder items not yet supported for: {}", name));
                    }
                }
            }
            TweakAction::AppxPackage { name, action: appx_action } => {
                let cmd = match appx_action {
                    AppxAction::Remove => format!(
                        "powershell -Command \"Get-AppxPackage *{}* | Remove-AppxPackage\"", name
                    ),
                    AppxAction::Disable => format!(
                        "powershell -Command \"Get-AppxPackage *{}* | Disable-AppxPackage\"", name
                    ),
                };
                let output = std::process::Command::new("cmd")
                    .args(["/C", &cmd])
                    .creation_flags(0x08000000)
                    .output()
                    .context(format!("Failed to manage AppX package: {}", name))?;
                if output.status.success() {
                    details.push(format!("Managed AppX package: {}", name));
                } else {
                    let err = String::from_utf8_lossy(&output.stderr);
                    details.push(format!("Warning: AppX {} failed: {}", name, err));
                }
            }
            TweakAction::FirewallRule { name, program, action: fw_action } => {
                let cmd = match fw_action {
                    FirewallAction::Block => format!(
                        "netsh advfirewall firewall add rule name=\"ReadyPC_{}\" dir=out action=block program=\"{}\"",
                        name, program
                    ),
                    FirewallAction::Allow => format!(
                        "netsh advfirewall firewall add rule name=\"ReadyPC_{}\" dir=out action=allow program=\"{}\"",
                        name, program
                    ),
                    FirewallAction::Remove => format!(
                        "netsh advfirewall firewall delete rule name=\"ReadyPC_{}\"",
                        name
                    ),
                };
                let output = std::process::Command::new("cmd")
                    .args(["/C", &cmd])
                    .creation_flags(0x08000000)
                    .output()
                    .context(format!("Failed to manage firewall rule: {}", name))?;
                if output.status.success() {
                    details.push(format!("Managed firewall rule: {}", name));
                } else {
                    let err = String::from_utf8_lossy(&output.stderr);
                    details.push(format!("Warning: firewall rule {} failed: {}", name, err));
                }
            }
            TweakAction::PowerCfgSetting { subgroup_guid, setting_guid, ac_value, dc_value } => {
                if let Some(ac) = ac_value {
                    let _ = std::process::Command::new("powercfg")
                        .args(["/setacvalueindex", "SCHEME_CURRENT", subgroup_guid, setting_guid, &ac.to_string()])
                        .creation_flags(0x08000000)
                        .output();
                    details.push(format!("Set power AC value {}:{} = {}", subgroup_guid, setting_guid, ac));
                }
                if let Some(dc) = dc_value {
                    let _ = std::process::Command::new("powercfg")
                        .args(["/setdcvalueindex", "SCHEME_CURRENT", subgroup_guid, setting_guid, &dc.to_string()])
                        .creation_flags(0x08000000)
                        .output();
                    details.push(format!("Set power DC value {}:{} = {}", subgroup_guid, setting_guid, dc));
                }
                let _ = std::process::Command::new("powercfg").args(["/setactive", "SCHEME_CURRENT"]).creation_flags(0x08000000).output();
            }
        }
    }

    backup.record_apply(&tweak.id, originals)?;
    logger.log_apply(&tweak.id, &tweak.name, details.clone())?;

    Ok(details)
}

pub fn revert_tweak(
    tweak: &TweakDefinition,
    backup: &mut BackupManager,
    logger: &mut ChangeLogger,
) -> Result<Vec<String>> {
    if tweak.requires_admin && !admin::is_admin() {
        bail!("ELEVATION_REQUIRED");
    }

    let entry = backup
        .get_backup_entry(&tweak.id)
        .context("No backup found for this tweak")?
        .clone();

    if !entry.applied {
        return Ok(vec!["Not currently applied".to_string()]);
    }

    let mut details = Vec::new();

    for original in &entry.original_values {
        match original {
            OriginalValue::Registry {
                hive,
                path,
                name,
                value,
                existed,
            } => {
                let root = match hive {
                    RegistryHive::HKLM => RegKey::predef(HKEY_LOCAL_MACHINE),
                    RegistryHive::HKCU => RegKey::predef(HKEY_CURRENT_USER),
                };

                if !existed {
                    if let Ok(key) = root.open_subkey_with_flags(path, KEY_WRITE) {
                        let _ = key.delete_value(name);
                        details.push(format!("Removed {}\\{} (did not exist before)", path, name));
                    }
                } else if let Some(val) = value {
                    let (key, _) = root.create_subkey(path)?;
                    match val {
                        RegistryValueData::Dword(v) => {
                            key.set_value(name, v)?;
                        }
                        RegistryValueData::String(v) => {
                            key.set_value(name, v)?;
                        }
                        RegistryValueData::Qword(v) => {
                            key.set_value(name, v)?;
                        }
                        RegistryValueData::Binary(v) => {
                            let raw = winreg::RegValue {
                                bytes: v.clone(),
                                vtype: REG_BINARY,
                            };
                            key.set_raw_value(name, &raw)?;
                        }
                    }
                    details.push(format!("Restored {}\\{}", path, name));
                } else {
                    if let Ok(key) = root.open_subkey_with_flags(path, KEY_WRITE) {
                        let _ = key.delete_value(name);
                    }
                    details.push(format!("Removed {}\\{} (value was absent)", path, name));
                }
            }
            OriginalValue::Service {
                name,
                original_startup,
            } => {
                let start_type = match original_startup.as_str() {
                    "Automatic" => "auto",
                    "Manual" => "demand",
                    "Disabled" => "disabled",
                    _ => "demand",
                };
                let _ = std::process::Command::new("sc")
                    .args(["config", name, &format!("start={}", start_type)])
                    .creation_flags(0x08000000)
                    .output();
                details.push(format!("Restored service {} to {}", name, original_startup));
            }
            OriginalValue::PowerPlan { previous_guid } => {
                let _ = std::process::Command::new("powercfg")
                    .args(["/setactive", previous_guid])
                    .creation_flags(0x08000000)
                    .output();
                details.push(format!("Restored power plan: {}", previous_guid));
            }
            OriginalValue::Command { revert_cmd } => {
                let _ = std::process::Command::new("cmd")
                    .args(["/C", revert_cmd])
                    .creation_flags(0x08000000)
                    .output();
                details.push(format!("Executed revert: {}", revert_cmd));
            }
            OriginalValue::DeletedFiles { note } => {
                details.push(note.clone());
            }
            OriginalValue::ScheduledTask { name, original_state } => {
                let state_str = if original_state == "Enabled" { "Enable" } else { "Disable" };
                let _ = std::process::Command::new("schtasks")
                    .args(["/Change", "/TN", name, &format!("/{}", state_str)])
                    .creation_flags(0x08000000)
                    .output();
                details.push(format!("Restored scheduled task {} to {}", name, original_state));
            }
            OriginalValue::StartupItem { name, original_value: _, location: _ } => {
                details.push(format!("Restored startup item: {}", name));
            }
            OriginalValue::AppxPackage { name: _, note } => {
                details.push(note.clone());
            }
            OriginalValue::FirewallRule { name } => {
                let _ = std::process::Command::new("cmd")
                    .args(["/C", &format!("netsh advfirewall firewall delete rule name=\"ReadyPC_{}\"", name)])
                    .creation_flags(0x08000000)
                    .output();
                details.push(format!("Removed firewall rule: {}", name));
            }
            OriginalValue::PowerCfgSetting { subgroup_guid, setting_guid, original_ac, original_dc } => {
                if let Some(ac) = original_ac {
                    let _ = std::process::Command::new("powercfg")
                        .args(["/setacvalueindex", "SCHEME_CURRENT", subgroup_guid, setting_guid, &ac.to_string()])
                        .creation_flags(0x08000000)
                        .output();
                }
                if let Some(dc) = original_dc {
                    let _ = std::process::Command::new("powercfg")
                        .args(["/setdcvalueindex", "SCHEME_CURRENT", subgroup_guid, setting_guid, &dc.to_string()])
                        .creation_flags(0x08000000)
                        .output();
                }
                let _ = std::process::Command::new("powercfg").args(["/setactive", "SCHEME_CURRENT"]).creation_flags(0x08000000).output();
                details.push(format!("Restored power setting {}:{}", subgroup_guid, setting_guid));
            }
        }
    }

    backup.record_revert(&tweak.id)?;
    logger.log_revert(&tweak.id, &tweak.name)?;

    Ok(details)
}

fn expand_env_vars(path: &str) -> String {
    let mut result = path.to_string();
    if let Ok(temp) = std::env::var("TEMP") {
        result = result.replace("%TEMP%", &temp);
    }
    if let Ok(windir) = std::env::var("WINDIR") {
        result = result.replace("%WINDIR%", &windir);
    }
    if let Ok(userprofile) = std::env::var("USERPROFILE") {
        result = result.replace("%USERPROFILE%", &userprofile);
    }
    if let Ok(localappdata) = std::env::var("LOCALAPPDATA") {
        result = result.replace("%LOCALAPPDATA%", &localappdata);
    }
    result
}
