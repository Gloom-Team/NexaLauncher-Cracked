use crate::system::network::{self, NetworkInterface, WifiStatus, PingResult};

#[tauri::command]
pub fn get_network_interfaces() -> Vec<NetworkInterface> {
    network::get_network_interfaces()
}

#[tauri::command]
pub fn get_wifi_status() -> WifiStatus {
    network::get_wifi_status()
}

#[tauri::command]
pub fn run_ping_test(host: String) -> PingResult {
    network::run_ping_test(&host)
}
