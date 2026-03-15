use serde::{Deserialize, Serialize};
use sysinfo::System;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessInfo {
    pub name: String,
    pub pid: u32,
    pub cpu_percent: f32,
    pub memory_mb: u64,
}

pub fn get_top_processes(limit: usize) -> Vec<ProcessInfo> {
    let mut sys = System::new_all();
    sys.refresh_all();
    std::thread::sleep(std::time::Duration::from_millis(200));
    sys.refresh_all();

    let mut procs: Vec<ProcessInfo> = sys
        .processes()
        .iter()
        .map(|(pid, proc_info)| ProcessInfo {
            name: proc_info.name().to_string_lossy().to_string(),
            pid: pid.as_u32(),
            cpu_percent: proc_info.cpu_usage(),
            memory_mb: proc_info.memory() / 1024 / 1024,
        })
        .filter(|p| p.cpu_percent > 0.0 || p.memory_mb > 10)
        .collect();

    procs.sort_by(|a, b| {
        b.cpu_percent
            .partial_cmp(&a.cpu_percent)
            .unwrap_or(std::cmp::Ordering::Equal)
    });
    procs.truncate(limit);
    procs
}

pub fn get_process_count() -> usize {
    let mut sys = System::new();
    sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);
    sys.processes().len()
}

pub fn get_cpu_usage() -> f32 {
    let mut sys = System::new();
    sys.refresh_cpu_usage();
    std::thread::sleep(std::time::Duration::from_millis(200));
    sys.refresh_cpu_usage();
    sys.global_cpu_usage()
}
