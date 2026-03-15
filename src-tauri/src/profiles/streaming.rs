use super::ProfileDefinition;

pub fn profile() -> ProfileDefinition {
    ProfileDefinition {
        id: "streaming".into(),
        name: "Streaming Mode".into(),
        description: "Optimized for live streaming. Keeps recording capabilities active while reducing background noise and maximizing CPU/GPU headroom.".into(),
        icon: "video".into(),
        tweak_ids: vec![
            "disable_fullscreen_optimizations".into(),
            "gpu_high_performance".into(),
            "high_performance_power".into(),
            "disable_background_apps".into(),
            "disable_sysmain".into(),
            "disable_tips_suggestions".into(),
            "disable_notification_sounds".into(),
            "disable_sticky_keys".into(),
            "disable_filter_keys".into(),
            "disable_transparency".into(),
        ],
    }
}
