use crate::engine::executor;
use crate::engine::tweak::{TweakDefinition, TweakStatus};
use crate::tweaks;
use crate::AppState;
use tauri::State;

#[tauri::command]
pub fn get_all_tweaks() -> Vec<TweakDefinition> {
    tweaks::all_tweaks()
}

#[tauri::command]
pub fn get_tweak_status(state: State<'_, AppState>) -> Vec<TweakStatus> {
    let backup = state.backup_manager.lock().unwrap();
    tweaks::all_tweaks()
        .iter()
        .map(|t| TweakStatus {
            tweak_id: t.id.clone(),
            applied: backup.is_applied(&t.id),
        })
        .collect()
}

#[tauri::command]
pub fn apply_tweak(id: String, state: State<'_, AppState>) -> Result<Vec<String>, String> {
    let tweak = tweaks::find_tweak(&id).ok_or_else(|| format!("Tweak not found: {}", id))?;

    let mut backup = state.backup_manager.lock().unwrap();
    let mut logger = state.change_logger.lock().unwrap();

    executor::apply_tweak(&tweak, &mut backup, &mut logger).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn revert_tweak(id: String, state: State<'_, AppState>) -> Result<Vec<String>, String> {
    let tweak = tweaks::find_tweak(&id).ok_or_else(|| format!("Tweak not found: {}", id))?;

    let mut backup = state.backup_manager.lock().unwrap();
    let mut logger = state.change_logger.lock().unwrap();

    executor::revert_tweak(&tweak, &mut backup, &mut logger).map_err(|e| e.to_string())
}
