use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReadinessReport {
    pub gaming_score: u32,
    pub responsiveness_score: u32,
    pub annoyance_score: u32,
    pub optimization_score: u32,
    pub findings: Vec<ReadinessFinding>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReadinessFinding {
    pub category: String,
    pub severity: Severity,
    pub title: String,
    pub description: String,
    pub fix_tweak_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Severity {
    Critical,
    High,
    Medium,
    Low,
    Info,
}

pub fn calculate_readiness(applied_tweak_ids: &[String], total_tweak_count: usize) -> ReadinessReport {
    let optimization_score = if total_tweak_count > 0 {
        ((applied_tweak_ids.len() as f32 / total_tweak_count as f32) * 100.0) as u32
    } else {
        0
    };

    ReadinessReport {
        gaming_score: super::session::get_gaming_readiness_score(),
        responsiveness_score: optimization_score.min(100),
        annoyance_score: optimization_score.min(100),
        optimization_score,
        findings: Vec::new(),
    }
}
