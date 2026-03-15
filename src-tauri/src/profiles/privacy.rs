use super::ProfileDefinition;

pub fn profile() -> ProfileDefinition {
    ProfileDefinition {
        id: "privacy_mode".into(),
        name: "Privacy Mode".into(),
        description: "Minimizes Windows data collection and tracking while keeping all features functional. Every change is safe and reversible.".into(),
        icon: "lock".into(),
        tweak_ids: vec![
            "disable_advertising_id".into(),
            "disable_activity_history".into(),
            "reduce_telemetry".into(),
            "disable_app_launch_tracking".into(),
            "disable_tailored_experiences".into(),
            "disable_feedback_prompts".into(),
            "disable_speech_recognition".into(),
            "disable_inking_personalization".into(),
            "disable_clipboard_history".into(),
            "disable_location_tracking".into(),
        ],
    }
}
