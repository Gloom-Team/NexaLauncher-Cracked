use super::ProfileDefinition;

pub fn profile() -> ProfileDefinition {
    ProfileDefinition {
        id: "creative".into(),
        name: "Creative Workstation Mode".into(),
        description: "Optimized for creative work like video editing, 3D rendering, and graphic design. Maximizes CPU and GPU performance with stable power delivery.".into(),
        icon: "palette".into(),
        tweak_ids: vec![
            "high_performance_power".into(),
            "gpu_high_performance".into(),
            "disable_background_apps".into(),
            "disable_sysmain".into(),
            "disable_tips_suggestions".into(),
            "disable_notification_sounds".into(),
        ],
    }
}
