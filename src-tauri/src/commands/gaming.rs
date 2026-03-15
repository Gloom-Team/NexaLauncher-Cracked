use crate::gaming::{launchers, games, session, overlays, readiness};
use crate::AppState;
use tauri::State;

#[tauri::command]
pub fn get_game_launchers() -> Vec<launchers::GameLauncher> {
    launchers::detect_launchers()
}

#[tauri::command]
pub fn get_installed_games() -> games::GameLibrary {
    games::GameLibrary::scan()
}

#[tauri::command]
pub fn run_pre_game_check() -> session::PreGameCheckResult {
    session::run_pre_game_check()
}

#[tauri::command]
pub fn get_overlays() -> Vec<overlays::OverlayInfo> {
    overlays::detect_overlays()
}

#[tauri::command]
pub fn get_gaming_readiness(state: State<'_, AppState>) -> readiness::ReadinessReport {
    let backup = state.backup_manager.lock().unwrap();
    let applied = backup.all_applied_ids();
    let total = crate::tweaks::all_tweaks().len();
    readiness::calculate_readiness(&applied, total)
}
