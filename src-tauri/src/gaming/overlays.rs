use serde::{Deserialize, Serialize};
use sysinfo::{ProcessesToUpdate, System};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OverlayInfo {
    pub name: String,
    pub process_name: String,
    pub running: bool,
    pub impact: String,
    pub suggestion: String,
}

pub fn detect_overlays() -> Vec<OverlayInfo> {
    let mut sys = System::new();
    sys.refresh_processes(ProcessesToUpdate::All, true);

    let overlays = vec![
        ("Xbox Game Bar", "GameBar.exe", "Low-Medium", "Disable via Settings > Gaming > Game Bar"),
        ("Discord Overlay", "discord.exe", "Low", "Disable in Discord Settings > Game Overlay"),
        ("GeForce Experience", "NVIDIA Share.exe", "Medium", "Disable in-game overlay in GeForce Experience settings"),
        ("Steam Overlay", "GameOverlayUI.exe", "Low", "Disable per-game in Steam > Properties > In-Game"),
        ("MSI Afterburner/RTSS", "RTSS.exe", "Low", "Close RTSS if not using OSD"),
        ("Medal.tv", "Medal.exe", "Medium", "Close Medal.tv before gaming for best performance"),
        ("OBS Studio", "obs64.exe", "Medium-High", "Close OBS if not streaming"),
        ("AMD Radeon Software", "RadeonSoftware.exe", "Low", "Disable in-game overlay in AMD settings"),
    ];

    overlays.into_iter().map(|(name, proc, impact, suggestion)| {
        let lower = proc.to_lowercase();
        let running = sys.processes().values()
            .any(|p| p.name().to_string_lossy().to_lowercase() == lower);
        OverlayInfo {
            name: name.into(),
            process_name: proc.into(),
            running,
            impact: impact.into(),
            suggestion: suggestion.into(),
        }
    }).collect()
}
