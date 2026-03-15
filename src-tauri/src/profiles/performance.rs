use super::ProfileDefinition;

pub fn profile() -> ProfileDefinition {
    ProfileDefinition {
        id: "performance".into(),
        name: "Performance Mode".into(),
        description: "Maximizes system performance by applying all Gaming Mode tweaks plus disabling unnecessary services, cleaning temp files, optimizing processor scheduling, and reducing startup overhead.".into(),
        icon: "zap".into(),
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
            "disable_sysmain".into(),
            "disable_search_indexing".into(),
            "disable_error_reporting".into(),
            "optimize_processor_scheduling".into(),
            "disable_startup_delay".into(),
            "clean_temp_files".into(),
            "disable_diagnostic_data".into(),
        ],
    }
}
