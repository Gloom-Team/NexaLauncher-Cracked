use super::ProfileDefinition;

pub fn profile() -> ProfileDefinition {
    ProfileDefinition {
        id: "competitive_fps".into(),
        name: "Competitive FPS Mode".into(),
        description: "Maximum performance for competitive shooters. Disables all overlays, sets highest performance power plan, reduces input lag, and optimizes network settings.".into(),
        icon: "crosshair".into(),
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
            "disable_transparency".into(),
            "disable_game_mode".into(),
            "disable_nagle".into(),
            "disable_sysmain".into(),
            "disable_search_indexing".into(),
            "ultimate_performance_power".into(),
            "disable_animations".into(),
            "disable_tips_suggestions".into(),
        ],
    }
}
