use crate::profiles::manager::CustomProfile;
use crate::AppState;
use tauri::State;

#[tauri::command]
pub fn get_custom_profiles(state: State<'_, AppState>) -> Vec<CustomProfile> {
    let mgr = state.profile_manager.lock().unwrap();
    mgr.get_all().to_vec()
}

#[tauri::command]
pub fn create_custom_profile(
    profile: CustomProfile,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut mgr = state.profile_manager.lock().unwrap();
    mgr.save_profile(profile).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_custom_profile(id: String, state: State<'_, AppState>) -> Result<(), String> {
    let mut mgr = state.profile_manager.lock().unwrap();
    mgr.delete_profile(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn export_profile(id: String, state: State<'_, AppState>) -> Result<String, String> {
    let mgr = state.profile_manager.lock().unwrap();
    mgr.export_profile(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn import_profile(json: String, state: State<'_, AppState>) -> Result<(), String> {
    let mut mgr = state.profile_manager.lock().unwrap();
    mgr.import_profile(&json).map_err(|e| e.to_string())
}
