use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum TweakCategory {
    Gaming,
    Annoyance,
    Performance,
    Visual,
    Startup,
    Cleanup,
    Power,
    Privacy,
    Network,
    Battery,
}

impl TweakCategory {
    pub fn label(&self) -> &str {
        match self {
            Self::Gaming => "Gaming",
            Self::Annoyance => "Annoyance Removal",
            Self::Performance => "Performance",
            Self::Visual => "Visual Effects",
            Self::Startup => "Startup",
            Self::Cleanup => "Cleanup",
            Self::Power => "Power Plan",
            Self::Privacy => "Privacy",
            Self::Network => "Network",
            Self::Battery => "Battery",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum RiskLevel {
    Safe,
    Moderate,
    Advanced,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum Recommendation {
    Recommended,
    Optional,
    Advanced,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RegistryHive {
    HKLM,
    HKCU,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RegistryValueData {
    Dword(u32),
    String(String),
    Qword(u64),
    Binary(Vec<u8>),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ServiceStartup {
    Automatic,
    Manual,
    Disabled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TaskState {
    Enabled,
    Disabled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum StartupLocation {
    RegistryCurrentUser,
    RegistryLocalMachine,
    StartupFolder,
    CommonStartupFolder,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AppxAction {
    Remove,
    Disable,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FirewallAction {
    Block,
    Allow,
    Remove,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TweakAction {
    Registry {
        hive: RegistryHive,
        path: String,
        name: String,
        desired_value: RegistryValueData,
    },
    Service {
        name: String,
        desired_startup: ServiceStartup,
    },
    PowerPlan {
        guid: String,
    },
    Command {
        apply_cmd: String,
        revert_cmd: String,
    },
    DeleteFiles {
        paths: Vec<String>,
    },
    ScheduledTask {
        name: String,
        desired_state: TaskState,
    },
    StartupItem {
        name: String,
        location: StartupLocation,
        desired_enabled: bool,
    },
    AppxPackage {
        name: String,
        action: AppxAction,
    },
    FirewallRule {
        name: String,
        program: String,
        action: FirewallAction,
    },
    PowerCfgSetting {
        subgroup_guid: String,
        setting_guid: String,
        ac_value: Option<u32>,
        dc_value: Option<u32>,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TweakDefinition {
    pub id: String,
    pub name: String,
    pub description: String,
    pub why_it_helps: String,
    pub category: TweakCategory,
    pub risk_level: RiskLevel,
    pub recommendation: Recommendation,
    pub requires_reboot: bool,
    pub requires_admin: bool,
    pub requires_signout: bool,
    pub reversible: bool,
    pub impact_estimate: String,
    pub when_not_to_use: String,
    pub how_to_undo: String,
    pub tags: Vec<String>,
    pub actions: Vec<TweakAction>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TweakStatus {
    pub tweak_id: String,
    pub applied: bool,
}
