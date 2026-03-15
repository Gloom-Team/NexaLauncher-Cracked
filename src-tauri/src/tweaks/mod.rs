pub mod annoyances;
pub mod battery;
pub mod cleanup;
pub mod gaming;
pub mod network;
pub mod performance;
pub mod power;
pub mod privacy;
pub mod startup;
pub mod visual;

use crate::engine::tweak::TweakDefinition;

pub fn all_tweaks() -> Vec<TweakDefinition> {
    let mut tweaks = Vec::new();
    tweaks.extend(gaming::tweaks());
    tweaks.extend(annoyances::tweaks());
    tweaks.extend(performance::tweaks());
    tweaks.extend(visual::tweaks());
    tweaks.extend(startup::tweaks());
    tweaks.extend(cleanup::tweaks());
    tweaks.extend(power::tweaks());
    tweaks.extend(privacy::tweaks());
    tweaks.extend(network::tweaks());
    tweaks.extend(battery::tweaks());
    tweaks
}

pub fn find_tweak(id: &str) -> Option<TweakDefinition> {
    all_tweaks().into_iter().find(|t| t.id == id)
}
