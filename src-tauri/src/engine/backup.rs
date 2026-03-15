use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::os::windows::process::CommandExt;
use std::path::PathBuf;
use winreg::enums::*;
use winreg::RegKey;

use super::tweak::{RegistryHive, RegistryValueData, StartupLocation, TweakAction, TweakDefinition};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum OriginalValue {
    Registry {
        hive: RegistryHive,
        path: String,
        name: String,
        value: Option<RegistryValueData>,
        existed: bool,
    },
    Service {
        name: String,
        original_startup: String,
    },
    PowerPlan {
        previous_guid: String,
    },
    Command {
        revert_cmd: String,
    },
    DeletedFiles {
        note: String,
    },
    ScheduledTask {
        name: String,
        original_state: String,
    },
    StartupItem {
        name: String,
        original_value: Option<String>,
        location: String,
    },
    AppxPackage {
        name: String,
        note: String,
    },
    FirewallRule {
        name: String,
    },
    PowerCfgSetting {
        subgroup_guid: String,
        setting_guid: String,
        original_ac: Option<u32>,
        original_dc: Option<u32>,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupEntry {
    pub tweak_id: String,
    pub timestamp: DateTime<Utc>,
    pub original_values: Vec<OriginalValue>,
    pub applied: bool,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct BackupState {
    pub entries: HashMap<String, BackupEntry>,
}

pub struct BackupManager {
    state_path: PathBuf,
    pub state: BackupState,
}

impl BackupManager {
    pub fn new() -> Result<Self> {
        let data_dir = Self::data_dir()?;
        fs::create_dir_all(&data_dir).context("Failed to create ReadyPC data directory")?;

        let state_path = data_dir.join("state.json");
        let state = if state_path.exists() {
            let content = fs::read_to_string(&state_path)?;
            serde_json::from_str(&content).unwrap_or_default()
        } else {
            BackupState::default()
        };

        Ok(Self { state_path, state })
    }

    fn data_dir() -> Result<PathBuf> {
        let base = dirs::data_dir().context("Cannot find AppData directory")?;
        Ok(base.join("ReadyPC"))
    }

    pub fn save(&self) -> Result<()> {
        let content = serde_json::to_string_pretty(&self.state)?;
        fs::write(&self.state_path, content)?;
        Ok(())
    }

    pub fn snapshot_before_apply(&mut self, tweak: &TweakDefinition) -> Result<Vec<OriginalValue>> {
        let mut originals = Vec::new();

        for action in &tweak.actions {
            match action {
                TweakAction::Registry {
                    hive, path, name, ..
                } => {
                    let root = match hive {
                        RegistryHive::HKLM => RegKey::predef(HKEY_LOCAL_MACHINE),
                        RegistryHive::HKCU => RegKey::predef(HKEY_CURRENT_USER),
                    };

                    let (existed, value) = match root.open_subkey(path) {
                        Ok(key) => match key.get_raw_value(name) {
                            Ok(raw) => {
                                let val = match raw.vtype {
                                    REG_DWORD => {
                                        let bytes = raw.bytes;
                                        if bytes.len() >= 4 {
                                            let v = u32::from_le_bytes([
                                                bytes[0], bytes[1], bytes[2], bytes[3],
                                            ]);
                                            Some(RegistryValueData::Dword(v))
                                        } else {
                                            None
                                        }
                                    }
                                    REG_SZ | REG_EXPAND_SZ => {
                                        let s: String = key.get_value(name).unwrap_or_default();
                                        Some(RegistryValueData::String(s))
                                    }
                                    REG_QWORD => {
                                        let bytes = raw.bytes;
                                        if bytes.len() >= 8 {
                                            let v = u64::from_le_bytes([
                                                bytes[0], bytes[1], bytes[2], bytes[3],
                                                bytes[4], bytes[5], bytes[6], bytes[7],
                                            ]);
                                            Some(RegistryValueData::Qword(v))
                                        } else {
                                            None
                                        }
                                    }
                                    _ => Some(RegistryValueData::Binary(raw.bytes)),
                                };
                                (true, val)
                            }
                            Err(_) => (true, None),
                        },
                        Err(_) => (false, None),
                    };

                    originals.push(OriginalValue::Registry {
                        hive: hive.clone(),
                        path: path.clone(),
                        name: name.clone(),
                        value,
                        existed,
                    });
                }
                TweakAction::Service { name, .. } => {
                    let output = std::process::Command::new("sc")
                        .args(["qc", name])
                        .creation_flags(0x08000000)
                        .output();
                    let startup = match output {
                        Ok(out) => {
                            let text = String::from_utf8_lossy(&out.stdout);
                            if text.contains("AUTO_START") {
                                "Automatic".to_string()
                            } else if text.contains("DEMAND_START") {
                                "Manual".to_string()
                            } else if text.contains("DISABLED") {
                                "Disabled".to_string()
                            } else {
                                "Unknown".to_string()
                            }
                        }
                        Err(_) => "Unknown".to_string(),
                    };
                    originals.push(OriginalValue::Service {
                        name: name.clone(),
                        original_startup: startup,
                    });
                }
                TweakAction::PowerPlan { .. } => {
                    let output = std::process::Command::new("powercfg")
                        .args(["/getactivescheme"])
                        .creation_flags(0x08000000)
                        .output();
                    let guid = match output {
                        Ok(out) => {
                            let text = String::from_utf8_lossy(&out.stdout);
                            text.split_whitespace()
                                .find(|s| s.contains('-'))
                                .unwrap_or("381b4222-f694-41f0-9685-ff5bb260df2e")
                                .to_string()
                        }
                        Err(_) => "381b4222-f694-41f0-9685-ff5bb260df2e".to_string(),
                    };
                    originals.push(OriginalValue::PowerPlan {
                        previous_guid: guid,
                    });
                }
                TweakAction::Command { revert_cmd, .. } => {
                    originals.push(OriginalValue::Command {
                        revert_cmd: revert_cmd.clone(),
                    });
                }
                TweakAction::DeleteFiles { .. } => {
                    originals.push(OriginalValue::DeletedFiles {
                        note: "Deleted files cannot be restored".to_string(),
                    });
                }
                TweakAction::ScheduledTask { name, .. } => {
                    let output = std::process::Command::new("schtasks")
                        .args(["/Query", "/TN", name, "/FO", "LIST"])
                        .creation_flags(0x08000000)
                        .output();
                    let state = match output {
                        Ok(out) => {
                            let text = String::from_utf8_lossy(&out.stdout);
                            if text.contains("Disabled") {
                                "Disabled".to_string()
                            } else {
                                "Enabled".to_string()
                            }
                        }
                        Err(_) => "Unknown".to_string(),
                    };
                    originals.push(OriginalValue::ScheduledTask {
                        name: name.clone(),
                        original_state: state,
                    });
                }
                TweakAction::StartupItem { name, location, .. } => {
                    let loc_str = match location {
                        StartupLocation::RegistryCurrentUser => "RegistryCurrentUser",
                        StartupLocation::RegistryLocalMachine => "RegistryLocalMachine",
                        StartupLocation::StartupFolder => "StartupFolder",
                        StartupLocation::CommonStartupFolder => "CommonStartupFolder",
                    };
                    originals.push(OriginalValue::StartupItem {
                        name: name.clone(),
                        original_value: None,
                        location: loc_str.to_string(),
                    });
                }
                TweakAction::AppxPackage { name, .. } => {
                    originals.push(OriginalValue::AppxPackage {
                        name: name.clone(),
                        note: "AppX packages cannot be easily reinstalled once removed".to_string(),
                    });
                }
                TweakAction::FirewallRule { name, .. } => {
                    originals.push(OriginalValue::FirewallRule {
                        name: name.clone(),
                    });
                }
                TweakAction::PowerCfgSetting { subgroup_guid, setting_guid, .. } => {
                    originals.push(OriginalValue::PowerCfgSetting {
                        subgroup_guid: subgroup_guid.clone(),
                        setting_guid: setting_guid.clone(),
                        original_ac: None,
                        original_dc: None,
                    });
                }
            }
        }

        Ok(originals)
    }

    pub fn record_apply(&mut self, tweak_id: &str, originals: Vec<OriginalValue>) -> Result<()> {
        let entry = BackupEntry {
            tweak_id: tweak_id.to_string(),
            timestamp: Utc::now(),
            original_values: originals,
            applied: true,
        };
        self.state.entries.insert(tweak_id.to_string(), entry);
        self.save()
    }

    pub fn record_revert(&mut self, tweak_id: &str) -> Result<()> {
        if let Some(entry) = self.state.entries.get_mut(tweak_id) {
            entry.applied = false;
        }
        self.save()
    }

    pub fn is_applied(&self, tweak_id: &str) -> bool {
        self.state
            .entries
            .get(tweak_id)
            .map(|e| e.applied)
            .unwrap_or(false)
    }

    pub fn get_backup_entry(&self, tweak_id: &str) -> Option<&BackupEntry> {
        self.state.entries.get(tweak_id)
    }

    pub fn applied_count(&self) -> usize {
        self.state.entries.values().filter(|e| e.applied).count()
    }

    pub fn all_applied_ids(&self) -> Vec<String> {
        self.state
            .entries
            .iter()
            .filter(|(_, e)| e.applied)
            .map(|(id, _)| id.clone())
            .collect()
    }
}
