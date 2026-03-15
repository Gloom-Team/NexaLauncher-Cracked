use crate::engine::executor;
use crate::profiles::{self, ProfileDefinition};
use crate::tweaks;
use crate::AppState;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfileStatus {
    pub profile_id: String,
    pub applied_count: usize,
    pub total_count: usize,
    pub fully_applied: bool,
}

#[tauri::command]
pub fn get_profiles() -> Vec<ProfileDefinition> {
    profiles::all_profiles()
}

#[tauri::command]
pub fn get_profile_status(state: State<'_, AppState>) -> Vec<ProfileStatus> {
    let backup = state.backup_manager.lock().unwrap();
    profiles::all_profiles()
        .iter()
        .map(|p| {
            let applied_count = p.tweak_ids.iter().filter(|id| backup.is_applied(id)).count();
            ProfileStatus {
                profile_id: p.id.clone(),
                applied_count,
                total_count: p.tweak_ids.len(),
                fully_applied: applied_count == p.tweak_ids.len(),
            }
        })
        .collect()
}

#[tauri::command]
pub fn apply_profile(id: String, state: State<'_, AppState>) -> Result<Vec<String>, String> {
    let profile =
        profiles::find_profile(&id).ok_or_else(|| format!("Profile not found: {}", id))?;

    let mut backup = state.backup_manager.lock().unwrap();
    let mut logger = state.change_logger.lock().unwrap();
    let mut all_details = Vec::new();

    for tweak_id in &profile.tweak_ids {
        if let Some(tweak) = tweaks::find_tweak(tweak_id) {
            match executor::apply_tweak(&tweak, &mut backup, &mut logger) {
                Ok(details) => all_details.extend(details),
                Err(e) => all_details.push(format!("Warning: {} failed: {}", tweak_id, e)),
            }
        }
    }

    let _ = logger.log_profile_apply(&profile.name, &profile.tweak_ids);

    Ok(all_details)
}

#[tauri::command]
pub fn revert_profile(id: String, state: State<'_, AppState>) -> Result<Vec<String>, String> {
    let profile =
        profiles::find_profile(&id).ok_or_else(|| format!("Profile not found: {}", id))?;

    let mut backup = state.backup_manager.lock().unwrap();
    let mut logger = state.change_logger.lock().unwrap();
    let mut all_details = Vec::new();

    for tweak_id in &profile.tweak_ids {
        if let Some(tweak) = tweaks::find_tweak(tweak_id) {
            if backup.is_applied(tweak_id) {
                match executor::revert_tweak(&tweak, &mut backup, &mut logger) {
                    Ok(details) => all_details.extend(details),
                    Err(e) => all_details.push(format!("Warning: {} revert failed: {}", tweak_id, e)),
                }
            }
        }
    }

    let _ = logger.log_profile_revert(&profile.name);

    Ok(all_details)
}
