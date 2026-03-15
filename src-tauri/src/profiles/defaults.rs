use super::ProfileDefinition;

pub fn profile() -> ProfileDefinition {
    ProfileDefinition {
        id: "restore_defaults".into(),
        name: "Restore Windows Defaults".into(),
        description: "Reverts all ReadyPC changes and restores Windows to its default settings. Use this if you want to undo everything.".into(),
        icon: "rotate-ccw".into(),
        tweak_ids: vec![],
    }
}
