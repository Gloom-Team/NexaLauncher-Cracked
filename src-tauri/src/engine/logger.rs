use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ChangeAction {
    Applied,
    Reverted,
    ProfileApplied { profile_name: String },
    ProfileReverted { profile_name: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChangeEntry {
    pub id: u64,
    pub timestamp: DateTime<Utc>,
    pub tweak_id: String,
    pub tweak_name: String,
    pub action: ChangeAction,
    pub details: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ChangeLog {
    pub entries: Vec<ChangeEntry>,
    next_id: u64,
}

pub struct ChangeLogger {
    log_path: PathBuf,
    pub log: ChangeLog,
}

impl ChangeLogger {
    pub fn new() -> Result<Self> {
        let data_dir = dirs::data_dir()
            .context("Cannot find AppData directory")?
            .join("ReadyPC");
        fs::create_dir_all(&data_dir)?;

        let log_path = data_dir.join("changelog.json");
        let log = if log_path.exists() {
            let content = fs::read_to_string(&log_path)?;
            serde_json::from_str(&content).unwrap_or_default()
        } else {
            ChangeLog::default()
        };

        Ok(Self { log_path, log })
    }

    pub fn save(&self) -> Result<()> {
        let content = serde_json::to_string_pretty(&self.log)?;
        fs::write(&self.log_path, content)?;
        Ok(())
    }

    pub fn log_apply(&mut self, tweak_id: &str, tweak_name: &str, details: Vec<String>) -> Result<()> {
        let entry = ChangeEntry {
            id: self.log.next_id,
            timestamp: Utc::now(),
            tweak_id: tweak_id.to_string(),
            tweak_name: tweak_name.to_string(),
            action: ChangeAction::Applied,
            details,
        };
        self.log.next_id += 1;
        self.log.entries.push(entry);
        self.save()
    }

    pub fn log_revert(&mut self, tweak_id: &str, tweak_name: &str) -> Result<()> {
        let entry = ChangeEntry {
            id: self.log.next_id,
            timestamp: Utc::now(),
            tweak_id: tweak_id.to_string(),
            tweak_name: tweak_name.to_string(),
            action: ChangeAction::Reverted,
            details: vec!["Restored original values".to_string()],
        };
        self.log.next_id += 1;
        self.log.entries.push(entry);
        self.save()
    }

    pub fn log_profile_apply(&mut self, profile_name: &str, tweak_ids: &[String]) -> Result<()> {
        let entry = ChangeEntry {
            id: self.log.next_id,
            timestamp: Utc::now(),
            tweak_id: format!("profile:{}", profile_name.to_lowercase().replace(' ', "_")),
            tweak_name: format!("{} profile", profile_name),
            action: ChangeAction::ProfileApplied {
                profile_name: profile_name.to_string(),
            },
            details: tweak_ids
                .iter()
                .map(|id| format!("Applied: {}", id))
                .collect(),
        };
        self.log.next_id += 1;
        self.log.entries.push(entry);
        self.save()
    }

    pub fn log_profile_revert(&mut self, profile_name: &str) -> Result<()> {
        let entry = ChangeEntry {
            id: self.log.next_id,
            timestamp: Utc::now(),
            tweak_id: format!("profile:{}", profile_name.to_lowercase().replace(' ', "_")),
            tweak_name: format!("{} profile", profile_name),
            action: ChangeAction::ProfileReverted {
                profile_name: profile_name.to_string(),
            },
            details: vec!["All profile tweaks reverted".to_string()],
        };
        self.log.next_id += 1;
        self.log.entries.push(entry);
        self.save()
    }

    pub fn get_entries(&self) -> &[ChangeEntry] {
        &self.log.entries
    }

    pub fn export_json(&self) -> Result<String> {
        Ok(serde_json::to_string_pretty(&self.log.entries)?)
    }
}
