use crate::utils::admin;

#[tauri::command]
pub fn check_is_admin() -> bool {
    admin::is_admin()
}

#[tauri::command]
pub fn restart_as_admin(app: tauri::AppHandle) -> Result<(), String> {
    admin::restart_elevated()?;
    app.exit(0);
    Ok(())
}
