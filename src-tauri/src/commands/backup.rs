use crate::engine::executor;
use crate::engine::logger::ChangeEntry;
use crate::tweaks;
use crate::AppState;
use tauri::State;

#[tauri::command]
pub fn get_change_log(state: State<'_, AppState>) -> Vec<ChangeEntry> {
    let logger = state.change_logger.lock().unwrap();
    logger.get_entries().to_vec()
}

#[tauri::command]
pub fn export_changes(state: State<'_, AppState>) -> Result<String, String> {
    let logger = state.change_logger.lock().unwrap();
    logger.export_json().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn undo_all(state: State<'_, AppState>) -> Result<Vec<String>, String> {
    let mut backup = state.backup_manager.lock().unwrap();
    let mut logger = state.change_logger.lock().unwrap();
    let mut all_details = Vec::new();

    let applied_ids = backup.all_applied_ids();

    for tweak_id in &applied_ids {
        if let Some(tweak) = tweaks::find_tweak(tweak_id) {
            match executor::revert_tweak(&tweak, &mut backup, &mut logger) {
                Ok(details) => all_details.extend(details),
                Err(e) => all_details.push(format!("Warning: {} revert failed: {}", tweak_id, e)),
            }
        }
    }

    Ok(all_details)
}

#[tauri::command]
pub fn get_active_tweaks_count(state: State<'_, AppState>) -> usize {
    let backup = state.backup_manager.lock().unwrap();
    backup.applied_count()
}
