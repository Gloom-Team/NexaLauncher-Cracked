use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutomationRule {
    pub id: String,
    pub name: String,
    pub enabled: bool,
    pub trigger: AutomationTrigger,
    pub actions: Vec<AutomationAction>,
    pub revert_actions: Vec<AutomationAction>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AutomationTrigger {
    Schedule { cron: String },
    ProcessLaunched { process_name: String },
    ProcessClosed { process_name: String },
    PowerSourceChanged { on_battery: bool },
    FullscreenDetected,
    Manual,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AutomationAction {
    ApplyProfile { profile_id: String },
    RevertProfile { profile_id: String },
    ApplyTweak { tweak_id: String },
    RevertTweak { tweak_id: String },
    RunCleanup { target_ids: Vec<String> },
    SuspendProcesses { names: Vec<String> },
    SetPowerPlan { guid: String },
    EnableDND,
    DisableDND,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct AutomationState {
    pub rules: Vec<AutomationRule>,
}

pub struct AutomationEngine {
    state_path: PathBuf,
    pub state: AutomationState,
}

impl AutomationEngine {
    pub fn new() -> anyhow::Result<Self> {
        let data_dir = dirs::data_dir()
            .ok_or_else(|| anyhow::anyhow!("No data dir"))?
            .join("ReadyPC");
        fs::create_dir_all(&data_dir)?;
        let state_path = data_dir.join("automation.json");
        let state = if state_path.exists() {
            let content = fs::read_to_string(&state_path)?;
            serde_json::from_str(&content).unwrap_or_default()
        } else {
            AutomationState::default()
        };
        Ok(Self { state_path, state })
    }

    pub fn save(&self) -> anyhow::Result<()> {
        let content = serde_json::to_string_pretty(&self.state)?;
        fs::write(&self.state_path, content)?;
        Ok(())
    }

    pub fn add_rule(&mut self, rule: AutomationRule) -> anyhow::Result<()> {
        self.state.rules.push(rule);
        self.save()
    }

    pub fn remove_rule(&mut self, id: &str) -> anyhow::Result<()> {
        self.state.rules.retain(|r| r.id != id);
        self.save()
    }

    pub fn toggle_rule(&mut self, id: &str, enabled: bool) -> anyhow::Result<()> {
        if let Some(rule) = self.state.rules.iter_mut().find(|r| r.id == id) {
            rule.enabled = enabled;
        }
        self.save()
    }

    pub fn get_rules(&self) -> &[AutomationRule] {
        &self.state.rules
    }

    pub fn get_default_rules() -> Vec<AutomationRule> {
        vec![
            AutomationRule {
                id: "auto_gaming_mode".into(),
                name: "Auto Gaming Mode on Game Launch".into(),
                enabled: false,
                trigger: AutomationTrigger::ProcessLaunched { process_name: "*.exe".into() },
                actions: vec![AutomationAction::ApplyProfile { profile_id: "gaming".into() }],
                revert_actions: vec![AutomationAction::RevertProfile { profile_id: "gaming".into() }],
            },
            AutomationRule {
                id: "battery_mode_on_unplug".into(),
                name: "Battery Mode When Unplugged".into(),
                enabled: false,
                trigger: AutomationTrigger::PowerSourceChanged { on_battery: true },
                actions: vec![AutomationAction::ApplyProfile { profile_id: "battery_saver".into() }],
                revert_actions: vec![AutomationAction::RevertProfile { profile_id: "battery_saver".into() }],
            },
            AutomationRule {
                id: "auto_dnd_fullscreen".into(),
                name: "Do Not Disturb in Fullscreen".into(),
                enabled: false,
                trigger: AutomationTrigger::FullscreenDetected,
                actions: vec![AutomationAction::EnableDND],
                revert_actions: vec![AutomationAction::DisableDND],
            },
        ]
    }
}
