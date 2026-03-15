use crate::engine::automation::{AutomationEngine, AutomationRule};
use crate::AppState;
use tauri::State;

#[tauri::command]
pub fn get_automation_rules(state: State<'_, AppState>) -> Vec<AutomationRule> {
    let engine = state.automation_engine.lock().unwrap();
    engine.get_rules().to_vec()
}

#[tauri::command]
pub fn add_automation_rule(rule: AutomationRule, state: State<'_, AppState>) -> Result<(), String> {
    let mut engine = state.automation_engine.lock().unwrap();
    engine.add_rule(rule).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn remove_automation_rule(id: String, state: State<'_, AppState>) -> Result<(), String> {
    let mut engine = state.automation_engine.lock().unwrap();
    engine.remove_rule(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn toggle_automation_rule(id: String, enabled: bool, state: State<'_, AppState>) -> Result<(), String> {
    let mut engine = state.automation_engine.lock().unwrap();
    engine.toggle_rule(&id, enabled).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_default_automation_rules() -> Vec<AutomationRule> {
    AutomationEngine::get_default_rules()
}
