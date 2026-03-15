use crate::system::benchmark::{self, SnapshotStore, SystemSnapshot};
use crate::system::info::{self, SystemInfoData};
use crate::system::processes::{self, ProcessInfo};

#[tauri::command]
pub fn get_system_info() -> SystemInfoData {
    info::collect_system_info()
}

#[tauri::command]
pub fn get_processes() -> Vec<ProcessInfo> {
    processes::get_top_processes(30)
}

#[tauri::command]
pub fn take_snapshot(label: String) -> Result<SystemSnapshot, String> {
    let snapshot = benchmark::take_system_snapshot(&label);
    let mut store = SnapshotStore::load().map_err(|e| e.to_string())?;
    store.add_snapshot(snapshot.clone()).map_err(|e| e.to_string())?;
    Ok(snapshot)
}

#[tauri::command]
pub fn get_snapshots() -> Result<Vec<SystemSnapshot>, String> {
    let store = SnapshotStore::load().map_err(|e| e.to_string())?;
    Ok(store.snapshots)
}
