use super::ProfileDefinition;

pub fn profile() -> ProfileDefinition {
    ProfileDefinition {
        id: "gaming".into(),
        name: "Gaming Mode".into(),
        description: "Optimizes your PC for gaming by disabling overlays, reducing background noise, enabling high performance power, and preventing keyboard interruptions. Safe and fully reversible.".into(),
        icon: "gamepad-2".into(),
        tweak_ids: vec![
            "disable_game_bar".into(),
            "disable_game_dvr".into(),
            "disable_fullscreen_optimizations".into(),
            "disable_mouse_acceleration".into(),
            "gpu_high_performance".into(),
            "disable_sticky_keys".into(),
            "disable_filter_keys".into(),
            "disable_background_apps".into(),
            "disable_notification_sounds".into(),
            "high_performance_power".into(),
            "disable_transparency".into(),
            "disable_game_mode".into(),
        ],
    }
}
