use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Impact {
    High,
    Medium,
    Low,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Recommendation {
    pub id: String,
    pub title: String,
    pub description: String,
    pub impact: Impact,
    pub category: String,
    pub tweak_id: Option<String>,
    pub is_quick_win: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanResult {
    pub recommendations: Vec<Recommendation>,
    pub easiest_wins: Vec<Recommendation>,
    pub highest_impact: Vec<Recommendation>,
    pub optimization_score: u32,
}

pub fn run_system_scan(applied_ids: &[String]) -> ScanResult {
    let mut recommendations = Vec::new();

    let sys = sysinfo::System::new_all();
    let total_ram = sys.total_memory() / 1024 / 1024;
    let used_ram = sys.used_memory() / 1024 / 1024;
    let ram_pct = (used_ram as f32 / total_ram as f32) * 100.0;

    if ram_pct > 80.0 {
        recommendations.push(Recommendation {
            id: "high_ram_usage".into(),
            title: "High RAM Usage".into(),
            description: format!("Your RAM is {:.0}% full. Close unnecessary apps or disable background processes.", ram_pct),
            impact: Impact::High,
            category: "Performance".into(),
            tweak_id: Some("disable_background_apps".into()),
            is_quick_win: true,
        });
    }

    let startup_count = crate::system::startup_apps::get_startup_apps().len();
    if startup_count > 10 {
        recommendations.push(Recommendation {
            id: "too_many_startup".into(),
            title: "Too Many Startup Apps".into(),
            description: format!("You have {} startup apps. Consider disabling unnecessary ones.", startup_count),
            impact: Impact::High,
            category: "Startup".into(),
            tweak_id: None,
            is_quick_win: true,
        });
    }

    let launcher_count = crate::system::startup_apps::get_game_launcher_startup_count();
    if launcher_count > 2 {
        recommendations.push(Recommendation {
            id: "too_many_launchers".into(),
            title: "Multiple Game Launchers at Startup".into(),
            description: format!("{} game launchers start with Windows. Consider disabling most of them.", launcher_count),
            impact: Impact::Medium,
            category: "Gaming".into(),
            tweak_id: None,
            is_quick_win: true,
        });
    }

    let gaming_tweaks = ["disable_game_bar", "disable_game_dvr", "disable_fullscreen_optimizations", "disable_mouse_acceleration", "high_performance_power"];
    for tweak_id in gaming_tweaks {
        if !applied_ids.contains(&tweak_id.to_string()) {
            recommendations.push(Recommendation {
                id: format!("apply_{}", tweak_id),
                title: format!("Apply: {}", tweak_id.replace('_', " ")),
                description: "This recommended gaming tweak is not yet applied.".into(),
                impact: Impact::Medium,
                category: "Gaming".into(),
                tweak_id: Some(tweak_id.into()),
                is_quick_win: true,
            });
        }
    }

    let easiest_wins: Vec<_> = recommendations.iter().filter(|r| r.is_quick_win).cloned().collect();
    let highest_impact: Vec<_> = recommendations.iter().filter(|r| matches!(r.impact, Impact::High)).cloned().collect();
    let score = if recommendations.is_empty() { 100 } else { (100 - (recommendations.len() * 5).min(80)) as u32 };

    ScanResult { recommendations, easiest_wins, highest_impact, optimization_score: score }
}
