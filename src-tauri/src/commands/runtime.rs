use crate::engine::runtime::OptimizerRuntime;
use tauri::AppHandle;

#[tauri::command]
pub async fn run_optimizer_runtime(app: AppHandle) -> Result<(), String> {
    let runtime = OptimizerRuntime::resolve(&app)?;
    runtime.launch()?;
    Ok(())
}

#[tauri::command]
pub async fn get_optimizer_data_files(app: AppHandle) -> Result<Vec<String>, String> {
    let runtime = OptimizerRuntime::resolve(&app)?;
    let files = runtime.data_files()?;
    Ok(files
        .iter()
        .filter_map(|p| p.file_name())
        .map(|n| n.to_string_lossy().into_owned())
        .collect())
}
