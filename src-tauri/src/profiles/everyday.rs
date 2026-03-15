use super::ProfileDefinition;

pub fn profile() -> ProfileDefinition {
    ProfileDefinition {
        id: "everyday".into(),
        name: "Everyday Speed Mode".into(),
        description: "A balanced set of safe tweaks that make Windows faster and more responsive for daily use without any downsides.".into(),
        icon: "zap".into(),
        tweak_ids: vec![
            "disable_startup_delay".into(),
            "disable_background_apps".into(),
            "disable_tips_suggestions".into(),
            "disable_web_search".into(),
            "disable_widgets".into(),
            "disable_transparency".into(),
            "disable_notification_sounds".into(),
        ],
    }
}
