use std::path::PathBuf;
use tauri::Manager;

const OPTIMIZER_ROOT: &str = "src/engine/runtime/optimizer";

pub struct OptimizerRuntime {
    pub exe_path: PathBuf,
    pub dll_path: PathBuf,
    pub data_dir: PathBuf,
}

impl OptimizerRuntime {
    pub fn resolve(app: &tauri::AppHandle) -> Result<Self, String> {
        let res = app
            .path()
            .resource_dir()
            .map_err(|e| format!("Could not resolve resource directory: {e}"))?;

        let base = res.join(OPTIMIZER_ROOT);

        Ok(Self {
            exe_path: base.join("cofire.exe"),
            dll_path: base.join("version.dll"),
            data_dir: base.join("data"),
        })
    }

    pub fn launch(&self) -> Result<std::process::Child, String> {
        if !self.exe_path.exists() {
            return Err(format!(
                "Optimizer runtime not found at: {}",
                self.exe_path.display()
            ));
        }

        std::process::Command::new(&self.exe_path)
            .current_dir(&self.data_dir)
            .env("VERSION_DLL", &self.dll_path)
            .spawn()
            .map_err(|e| format!("Failed to start optimizer runtime: {e}"))
    }

    pub fn data_files(&self) -> Result<Vec<PathBuf>, String> {
        let entries = std::fs::read_dir(&self.data_dir)
            .map_err(|e| format!("Cannot read data directory: {e}"))?;

        let mut files: Vec<PathBuf> = entries
            .filter_map(|e| e.ok())
            .map(|e| e.path())
            .filter(|p| p.extension().map(|x| x == "dat").unwrap_or(false))
            .collect();

        files.sort();
        Ok(files)
    }
}
