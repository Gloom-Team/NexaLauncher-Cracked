use std::os::windows::process::CommandExt;
use windows::Win32::UI::Shell::IsUserAnAdmin;

pub fn is_admin() -> bool {
    unsafe { IsUserAnAdmin().as_bool() }
}

pub fn require_admin() -> Result<(), String> {
    if is_admin() {
        Ok(())
    } else {
        Err("This action requires administrator privileges. Please restart as admin.".into())
    }
}

pub fn restart_elevated() -> Result<(), String> {
    let exe = std::env::current_exe()
        .map_err(|e| format!("Failed to get current exe path: {e}"))?;

    std::process::Command::new("cmd")
        .args([
            "/C", "start", "", "powershell", "-Command",
            &format!("Start-Process '{}' -Verb runAs", exe.display()),
        ])
        .creation_flags(0x08000000)
        .spawn()
        .map_err(|e| format!("Failed to launch elevated process: {e}"))?;

    Ok(())
}
