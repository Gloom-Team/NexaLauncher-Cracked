use super::ProfileDefinition;

pub fn profile() -> ProfileDefinition {
    ProfileDefinition {
        id: "minimal".into(),
        name: "Minimal Distraction Mode".into(),
        description: "Removes all Windows distractions, notifications, tips, and suggestions. Perfect for focused work sessions.".into(),
        icon: "eye-off".into(),
        tweak_ids: vec![
            "disable_tips_suggestions".into(),
            "disable_web_search".into(),
            "disable_widgets".into(),
            "disable_notification_sounds".into(),
            "disable_copilot".into(),
            "disable_lock_screen_tips".into(),
            "disable_suggested_apps".into(),
            "disable_explorer_ads".into(),
            "disable_finish_setup_nag".into(),
            "disable_feedback_prompts".into(),
        ],
    }
}
