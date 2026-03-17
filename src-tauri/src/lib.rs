pub mod commands;
pub mod engine;
pub mod gaming;
pub mod profiles;
pub mod system;
pub mod tweaks;
pub mod utils;

use commands::{
    admin as admin_cmds, automation as automation_cmds, backup as backup_cmds,
    cleanup as cleanup_cmds, gaming as gaming_cmds, hardware as hardware_cmds,
    network as network_cmds, profiles as profile_cmds, profiles_v2 as profiles_v2_cmds,
    runtime as runtime_cmds, scanner as scanner_cmds, startup_apps as startup_cmds,
    system as system_cmds, tweaks as tweak_cmds,
};
use engine::automation::AutomationEngine;
use engine::backup::BackupManager;
use engine::logger::ChangeLogger;
use profiles::manager::ProfileManager;
use std::sync::Mutex;

pub struct AppState {
    pub backup_manager: Mutex<BackupManager>,
    pub change_logger: Mutex<ChangeLogger>,
    pub profile_manager: Mutex<ProfileManager>,
    pub automation_engine: Mutex<AutomationEngine>,
}

pub fn run() {
    env_logger::init();

    let backup_manager = BackupManager::new().expect("Failed to initialize backup manager");
    let change_logger = ChangeLogger::new().expect("Failed to initialize change logger");
    let profile_manager = ProfileManager::new().expect("Failed to initialize profile manager");
    let automation_engine =
        AutomationEngine::new().expect("Failed to initialize automation engine");

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState {
            backup_manager: Mutex::new(backup_manager),
            change_logger: Mutex::new(change_logger),
            profile_manager: Mutex::new(profile_manager),
            automation_engine: Mutex::new(automation_engine),
        })
        .invoke_handler(tauri::generate_handler![
            // Admin
            admin_cmds::check_is_admin,
            admin_cmds::restart_as_admin,
            // Tweaks
            tweak_cmds::get_all_tweaks,
            tweak_cmds::get_tweak_status,
            tweak_cmds::apply_tweak,
            tweak_cmds::revert_tweak,
            // Profiles (preset)
            profile_cmds::get_profiles,
            profile_cmds::apply_profile,
            profile_cmds::revert_profile,
            profile_cmds::get_profile_status,
            // Profiles (custom)
            profiles_v2_cmds::get_custom_profiles,
            profiles_v2_cmds::create_custom_profile,
            profiles_v2_cmds::delete_custom_profile,
            profiles_v2_cmds::export_profile,
            profiles_v2_cmds::import_profile,
            // System
            system_cmds::get_system_info,
            system_cmds::get_processes,
            system_cmds::take_snapshot,
            system_cmds::get_snapshots,
            // Hardware
            hardware_cmds::get_hardware_info,
            // Backup / Undo
            backup_cmds::get_change_log,
            backup_cmds::export_changes,
            backup_cmds::undo_all,
            backup_cmds::get_active_tweaks_count,
            // Gaming
            gaming_cmds::get_game_launchers,
            gaming_cmds::get_installed_games,
            gaming_cmds::run_pre_game_check,
            gaming_cmds::get_overlays,
            gaming_cmds::get_gaming_readiness,
            // Startup & Services
            startup_cmds::get_startup_apps,
            startup_cmds::disable_startup_app,
            startup_cmds::enable_startup_app,
            startup_cmds::get_services,
            startup_cmds::get_optional_services,
            // Cleanup
            cleanup_cmds::scan_cleanup_targets,
            cleanup_cmds::execute_cleanup,
            cleanup_cmds::scan_large_files,
            cleanup_cmds::get_disk_usage_map,
            // Network
            network_cmds::get_network_interfaces,
            network_cmds::get_wifi_status,
            network_cmds::run_ping_test,
            // Automation
            automation_cmds::get_automation_rules,
            automation_cmds::add_automation_rule,
            automation_cmds::remove_automation_rule,
            automation_cmds::toggle_automation_rule,
            automation_cmds::get_default_automation_rules,
            // Scanner & Recommendations
            scanner_cmds::run_system_scan,
            scanner_cmds::get_system_findings,
            scanner_cmds::get_performance_bottleneck,
            // Optimizer Runtime
            runtime_cmds::run_optimizer_runtime,
            runtime_cmds::get_optimizer_data_files,
        ])
        .run(tauri::generate_context!())
        .expect("error while running ReadyPC");
}
