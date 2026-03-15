use super::ProfileDefinition;

pub fn profile() -> ProfileDefinition {
    ProfileDefinition {
        id: "battery_saver".into(),
        name: "Laptop Battery Saver Mode".into(),
        description: "Extends battery life by reducing background activity, visual effects, and unnecessary services. Great for when you need your laptop to last.".into(),
        icon: "battery".into(),
        tweak_ids: vec![
            "disable_transparency".into(),
            "disable_animations".into(),
            "disable_background_apps".into(),
            "disable_sysmain".into(),
            "disable_search_indexing".into(),
            "disable_tips_suggestions".into(),
            "disable_widgets".into(),
        ],
    }
}
