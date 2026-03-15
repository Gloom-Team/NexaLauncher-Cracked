use super::ProfileDefinition;

pub fn profile() -> ProfileDefinition {
    ProfileDefinition {
        id: "quiet".into(),
        name: "Quiet / Focus Mode".into(),
        description: "Creates a distraction-free environment by silencing notifications, removing visual clutter, disabling telemetry noise, and blocking promotional content from Microsoft.".into(),
        icon: "moon".into(),
        tweak_ids: vec![
            "disable_tips_suggestions".into(),
            "disable_finish_setup_nag".into(),
            "disable_notification_sounds".into(),
            "disable_widgets".into(),
            "disable_copilot".into(),
            "reduce_telemetry".into(),
            "disable_feedback_prompts".into(),
            "disable_suggested_apps".into(),
            "disable_lock_screen_tips".into(),
            "disable_explorer_ads".into(),
        ],
    }
}
