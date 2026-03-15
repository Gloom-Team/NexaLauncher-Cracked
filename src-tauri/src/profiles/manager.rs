use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomProfile {
    pub id: String,
    pub name: String,
    pub description: String,
    pub icon: String,
    pub tweak_ids: Vec<String>,
    pub created_at: DateTime<Utc>,
    pub modified_at: DateTime<Utc>,
    pub is_favorite: bool,
    pub tags: Vec<String>,
    pub linked_app: Option<String>,
    pub linked_game: Option<String>,
    pub schedule: Option<ProfileSchedule>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfileSchedule {
    pub cron: String,
    pub enabled: bool,
}

pub struct ProfileManager {
    profiles_dir: PathBuf,
    profiles: HashMap<String, CustomProfile>,
}

impl ProfileManager {
    pub fn new() -> Result<Self> {
        let data_dir = dirs::data_dir()
            .context("Cannot find AppData directory")?
            .join("ReadyPC")
            .join("profiles");
        fs::create_dir_all(&data_dir)?;

        let mut profiles = HashMap::new();
        if let Ok(entries) = fs::read_dir(&data_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().map(|e| e == "json").unwrap_or(false) {
                    if let Ok(content) = fs::read_to_string(&path) {
                        if let Ok(profile) = serde_json::from_str::<CustomProfile>(&content) {
                            profiles.insert(profile.id.clone(), profile);
                        }
                    }
                }
            }
        }

        Ok(Self {
            profiles_dir: data_dir,
            profiles,
        })
    }

    pub fn get_all(&self) -> Vec<CustomProfile> {
        self.profiles.values().cloned().collect()
    }

    pub fn get_profile(&self, id: &str) -> Option<&CustomProfile> {
        self.profiles.get(id)
    }

    pub fn save_profile(&mut self, profile: CustomProfile) -> Result<()> {
        let path = self.profiles_dir.join(format!("{}.json", profile.id));
        let content = serde_json::to_string_pretty(&profile)?;
        fs::write(&path, content)?;
        self.profiles.insert(profile.id.clone(), profile);
        Ok(())
    }

    pub fn delete_profile(&mut self, id: &str) -> Result<()> {
        let path = self.profiles_dir.join(format!("{}.json", id));
        if path.exists() {
            fs::remove_file(&path)?;
        }
        self.profiles.remove(id);
        Ok(())
    }

    pub fn export_profile(&self, id: &str) -> Result<String> {
        let profile = self
            .profiles
            .get(id)
            .context("Profile not found")?;
        Ok(serde_json::to_string_pretty(profile)?)
    }

    pub fn import_profile(&mut self, json: &str) -> Result<()> {
        let profile: CustomProfile = serde_json::from_str(json)?;
        self.save_profile(profile)
    }
}
