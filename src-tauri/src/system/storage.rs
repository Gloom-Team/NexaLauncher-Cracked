use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleanupTarget {
    pub id: String,
    pub name: String,
    pub description: String,
    pub estimated_size_bytes: u64,
    pub risk: String,
    pub paths: Vec<String>,
    pub file_count: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleanupResult {
    pub cleaned_bytes: u64,
    pub files_removed: u64,
    pub errors: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LargeFile {
    pub path: String,
    pub size_bytes: u64,
    pub modified: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiskUsageEntry {
    pub path: String,
    pub size_bytes: u64,
    pub is_directory: bool,
}

pub fn scan_cleanup_targets() -> Vec<CleanupTarget> {
    let mut targets = Vec::new();
    
    targets.push(scan_directory_target(
        "temp_files", "Temporary Files", "Windows and user temp files",
        &[&expand_env("%TEMP%"), &expand_env("%WINDIR%\\Temp")],
        "Safe",
    ));
    
    targets.push(scan_directory_target(
        "recycle_bin", "Recycle Bin", "Deleted files in Recycle Bin",
        &[&expand_env("%SYSTEMDRIVE%\\$Recycle.Bin")],
        "Safe",
    ));

    targets.push(scan_directory_target(
        "browser_cache_chrome", "Chrome Cache", "Google Chrome browser cache",
        &[&expand_env("%LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default\\Cache")],
        "Safe",
    ));
    
    targets.push(scan_directory_target(
        "browser_cache_edge", "Edge Cache", "Microsoft Edge browser cache",
        &[&expand_env("%LOCALAPPDATA%\\Microsoft\\Edge\\User Data\\Default\\Cache")],
        "Safe",
    ));

    targets.push(scan_directory_target(
        "browser_cache_firefox", "Firefox Cache", "Mozilla Firefox browser cache",
        &[&expand_env("%LOCALAPPDATA%\\Mozilla\\Firefox\\Profiles")],
        "Safe",
    ));

    targets.push(scan_directory_target(
        "shader_cache_nvidia", "NVIDIA Shader Cache", "NVIDIA shader compilation cache",
        &[&expand_env("%LOCALAPPDATA%\\NVIDIA\\DXCache"), &expand_env("%LOCALAPPDATA%\\NVIDIA\\GLCache")],
        "Safe",
    ));

    targets.push(scan_directory_target(
        "shader_cache_amd", "AMD Shader Cache", "AMD shader compilation cache",
        &[&expand_env("%LOCALAPPDATA%\\AMD\\DxCache"), &expand_env("%LOCALAPPDATA%\\AMD\\GLCache")],
        "Safe",
    ));

    targets.push(scan_directory_target(
        "delivery_optimization", "Delivery Optimization", "Windows Update delivery cache",
        &[&expand_env("%WINDIR%\\SoftwareDistribution\\DeliveryOptimization")],
        "Safe",
    ));

    targets.push(scan_directory_target(
        "windows_update", "Windows Update Cache", "Downloaded Windows updates",
        &[&expand_env("%WINDIR%\\SoftwareDistribution\\Download")],
        "Moderate",
    ));

    targets.push(scan_directory_target(
        "crash_dumps", "Crash Dumps", "Application crash dump files",
        &[&expand_env("%LOCALAPPDATA%\\CrashDumps"), &expand_env("%WINDIR%\\Minidump")],
        "Safe",
    ));

    targets.push(scan_directory_target(
        "prefetch", "Prefetch Cache", "Windows prefetch files",
        &[&expand_env("%WINDIR%\\Prefetch")],
        "Moderate",
    ));

    targets.push(scan_directory_target(
        "log_files", "Log Files", "System and application log files",
        &[&expand_env("%WINDIR%\\Logs"), &expand_env("%LOCALAPPDATA%\\Temp")],
        "Safe",
    ));

    targets.into_iter().filter(|t| t.estimated_size_bytes > 0 || t.file_count > 0).collect()
}

fn scan_directory_target(id: &str, name: &str, desc: &str, paths: &[&str], risk: &str) -> CleanupTarget {
    let mut total_size = 0u64;
    let mut file_count = 0u64;
    for path in paths {
        let (s, c) = dir_size(Path::new(path));
        total_size += s;
        file_count += c;
    }
    CleanupTarget {
        id: id.into(),
        name: name.into(),
        description: desc.into(),
        estimated_size_bytes: total_size,
        risk: risk.into(),
        paths: paths.iter().map(|s| s.to_string()).collect(),
        file_count,
    }
}

fn dir_size(path: &Path) -> (u64, u64) {
    let mut size = 0u64;
    let mut count = 0u64;
    if let Ok(entries) = std::fs::read_dir(path) {
        for entry in entries.flatten() {
            if let Ok(meta) = entry.metadata() {
                if meta.is_file() {
                    size += meta.len();
                    count += 1;
                } else if meta.is_dir() {
                    let (s, c) = dir_size(&entry.path());
                    size += s;
                    count += c;
                }
            }
        }
    }
    (size, count)
}

pub fn execute_cleanup(target_ids: &[String]) -> CleanupResult {
    let targets = scan_cleanup_targets();
    let mut cleaned = 0u64;
    let mut removed = 0u64;
    let mut errors = Vec::new();

    for target in &targets {
        if target_ids.contains(&target.id) {
            for path_str in &target.paths {
                let path = Path::new(path_str);
                match clean_directory(path) {
                    Ok((bytes, files)) => { cleaned += bytes; removed += files; }
                    Err(e) => errors.push(format!("{}: {}", path_str, e)),
                }
            }
        }
    }

    CleanupResult { cleaned_bytes: cleaned, files_removed: removed, errors }
}

fn clean_directory(path: &Path) -> anyhow::Result<(u64, u64)> {
    let mut cleaned = 0u64;
    let mut removed = 0u64;
    if let Ok(entries) = std::fs::read_dir(path) {
        for entry in entries.flatten() {
            let p = entry.path();
            if p.is_file() {
                if let Ok(meta) = p.metadata() {
                    let size = meta.len();
                    if std::fs::remove_file(&p).is_ok() {
                        cleaned += size;
                        removed += 1;
                    }
                }
            }
        }
    }
    Ok((cleaned, removed))
}

pub fn scan_large_files(min_size_mb: u64, search_path: &str) -> Vec<LargeFile> {
    let min_bytes = min_size_mb * 1024 * 1024;
    let mut files = Vec::new();
    let path = Path::new(search_path);
    
    if let Ok(walker) = walkdir::WalkDir::new(path).max_depth(4).into_iter().take(10000).collect::<Result<Vec<_>, _>>() {
        for entry in walker {
            if entry.file_type().is_file() {
                if let Ok(meta) = entry.metadata() {
                    if meta.len() >= min_bytes {
                        files.push(LargeFile {
                            path: entry.path().to_string_lossy().into(),
                            size_bytes: meta.len(),
                            modified: format!("{:?}", meta.modified().unwrap_or(std::time::SystemTime::UNIX_EPOCH)),
                        });
                    }
                }
            }
        }
    }
    files.sort_by(|a, b| b.size_bytes.cmp(&a.size_bytes));
    files.truncate(100);
    files
}

pub fn get_disk_usage_map(path: &str) -> Vec<DiskUsageEntry> {
    let mut entries = Vec::new();
    let root = Path::new(path);
    if let Ok(dir_entries) = std::fs::read_dir(root) {
        for entry in dir_entries.flatten() {
            let p = entry.path();
            let (size, _) = if p.is_dir() { dir_size(&p) } else { (p.metadata().map(|m| m.len()).unwrap_or(0), 1) };
            entries.push(DiskUsageEntry {
                path: p.to_string_lossy().into(),
                size_bytes: size,
                is_directory: p.is_dir(),
            });
        }
    }
    entries.sort_by(|a, b| b.size_bytes.cmp(&a.size_bytes));
    entries
}

fn expand_env(path: &str) -> String {
    let mut result = path.to_string();
    for (var, env) in &[("%TEMP%", "TEMP"), ("%WINDIR%", "WINDIR"), ("%LOCALAPPDATA%", "LOCALAPPDATA"), ("%USERPROFILE%", "USERPROFILE"), ("%SYSTEMDRIVE%", "SYSTEMDRIVE"), ("%APPDATA%", "APPDATA")] {
        if let Ok(val) = std::env::var(env) {
            result = result.replace(var, &val);
        }
    }
    result
}
