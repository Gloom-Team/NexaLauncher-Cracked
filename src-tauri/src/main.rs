#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::os::windows::process::CommandExt;

fn main() {
    if !readypc_lib::utils::admin::is_admin() {
        let exe = std::env::current_exe().expect("Failed to get current exe path");
        let result = std::process::Command::new("cmd")
            .args(["/C", "start", "", "powershell", "-Command",
                &format!("Start-Process '{}' -Verb runAs", exe.display())])
            .creation_flags(0x08000000) // CREATE_NO_WINDOW
            .spawn();

        if result.is_ok() {
            std::process::exit(0);
        }
    }

    readypc_lib::run()
}
