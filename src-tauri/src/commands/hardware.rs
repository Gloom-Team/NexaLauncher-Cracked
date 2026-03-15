use crate::system::hardware::{self, HardwareInfo};

#[tauri::command]
pub fn get_hardware_info() -> HardwareInfo {
    hardware::collect_hardware_info()
}
