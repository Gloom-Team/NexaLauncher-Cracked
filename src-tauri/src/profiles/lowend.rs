use super::ProfileDefinition;

pub fn profile() -> ProfileDefinition {
    ProfileDefinition {
        id: "lowend".into(),
        name: "Low-End PC Mode".into(),
        description: "Aggressive optimization for older or budget hardware. Applies all performance and visual tweaks, disables all unnecessary services, strips all animations, and removes every known annoyance. Maximum performance at the cost of visual polish.".into(),
        icon: "cpu".into(),
        tweak_ids: vec![
            // Gaming
            "disable_game_bar".into(),
            "disable_game_dvr".into(),
            "disable_fullscreen_optimizations".into(),
            "disable_mouse_acceleration".into(),
            "gpu_high_performance".into(),
            "disable_game_mode".into(),
            "enable_hags".into(),
            // Annoyances
            "disable_tips_suggestions".into(),
            "disable_finish_setup_nag".into(),
            "disable_web_search".into(),
            "disable_widgets".into(),
            "disable_copilot".into(),
            "disable_sticky_keys".into(),
            "disable_filter_keys".into(),
            "disable_notification_sounds".into(),
            "disable_autoplay".into(),
            "disable_explorer_ads".into(),
            "disable_lock_screen_tips".into(),
            "disable_suggested_apps".into(),
            "reduce_telemetry".into(),
            "disable_feedback_prompts".into(),
            "clean_taskbar".into(),
            // Performance
            "disable_background_apps".into(),
            "disable_sysmain".into(),
            "disable_search_indexing".into(),
            "disable_error_reporting".into(),
            "disable_remote_assistance".into(),
            "optimize_processor_scheduling".into(),
            "disable_connected_experiences".into(),
            "disable_activity_history".into(),
            "disable_app_launch_tracking".into(),
            "disable_diagnostic_data".into(),
            // Visual
            "disable_transparency".into(),
            "disable_animations".into(),
            "disable_shadows".into(),
            "disable_smooth_scrolling".into(),
            "disable_fade_effects".into(),
            "disable_aero_peek".into(),
            // Startup & Cleanup
            "disable_startup_delay".into(),
            "clean_temp_files".into(),
            // Power
            "high_performance_power".into(),
        ],
    }
}
