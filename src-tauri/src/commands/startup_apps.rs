use crate::system::startup_apps::{self, StartupApp};
use crate::system::services::{self, ServiceInfo};

#[tauri::command]
pub fn get_startup_apps() -> Vec<StartupApp> {
    startup_apps::get_startup_apps()
}

#[tauri::command]
pub fn disable_startup_app(id: String) -> Result<(), String> {
    startup_apps::disable_startup_app(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn enable_startup_app(id: String, path: String) -> Result<(), String> {
    startup_apps::enable_startup_app(&id, &path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_services() -> Vec<ServiceInfo> {
    services::get_services_list()
}

#[tauri::command]
pub fn get_optional_services() -> Vec<ServiceInfo> {
    services::get_optional_services()
}
