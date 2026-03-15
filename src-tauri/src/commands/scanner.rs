use crate::engine::recommendations::{self, ScanResult};
use crate::engine::scanner::{self, ScanFinding};
use crate::AppState;
use tauri::State;

#[tauri::command]
pub fn run_system_scan(state: State<'_, AppState>) -> ScanResult {
    let backup = state.backup_manager.lock().unwrap();
    let applied = backup.all_applied_ids();
    recommendations::run_system_scan(&applied)
}

#[tauri::command]
pub fn get_system_findings() -> Vec<ScanFinding> {
    scanner::scan_system()
}

#[tauri::command]
pub fn get_performance_bottleneck() -> String {
    scanner::get_performance_bottleneck()
}
