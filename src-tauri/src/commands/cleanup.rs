use crate::system::storage::{self, CleanupTarget, CleanupResult, LargeFile, DiskUsageEntry};

#[tauri::command]
pub fn scan_cleanup_targets() -> Vec<CleanupTarget> {
    storage::scan_cleanup_targets()
}

#[tauri::command]
pub fn execute_cleanup(target_ids: Vec<String>) -> CleanupResult {
    storage::execute_cleanup(&target_ids)
}

#[tauri::command]
pub fn scan_large_files(min_size_mb: u64, path: String) -> Vec<LargeFile> {
    storage::scan_large_files(min_size_mb, &path)
}

#[tauri::command]
pub fn get_disk_usage_map(path: String) -> Vec<DiskUsageEntry> {
    storage::get_disk_usage_map(&path)
}
