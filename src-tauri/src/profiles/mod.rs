pub mod battery_saver;
pub mod competitive_fps;
pub mod creative;
pub mod defaults;
pub mod everyday;
pub mod gaming;
pub mod lowend;
pub mod manager;
pub mod minimal;
pub mod performance;
pub mod privacy;
pub mod quiet;
pub mod streaming;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfileDefinition {
    pub id: String,
    pub name: String,
    pub description: String,
    pub icon: String,
    pub tweak_ids: Vec<String>,
}

pub fn all_profiles() -> Vec<ProfileDefinition> {
    vec![
        gaming::profile(),
        competitive_fps::profile(),
        streaming::profile(),
        performance::profile(),
        quiet::profile(),
        lowend::profile(),
        battery_saver::profile(),
        creative::profile(),
        everyday::profile(),
        minimal::profile(),
        privacy::profile(),
        defaults::profile(),
    ]
}

pub fn find_profile(id: &str) -> Option<ProfileDefinition> {
    all_profiles().into_iter().find(|p| p.id == id)
}
