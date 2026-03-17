use std::os::windows::process::CommandExt;
use std::path::PathBuf;
use tauri::Manager;

pub struct OptimizerRuntime {
    base_dir: PathBuf,
}

impl OptimizerRuntime {
    pub fn resolve(app: &tauri::AppHandle) -> Result<Self, String> {
        let res = app
            .path()
            .resource_dir()
            .map_err(|e| format!("Could not resolve resource directory: {e}"))?;

        let base = res.join("optimizer");

        if !base.join("cofire.exe").exists() {
            return Err(format!(
                "Optimizer runtime not found at: {}",
                base.display()
            ));
        }

        Ok(Self { base_dir: base })
    }

    pub fn launch(&self) -> Result<std::process::Child, String> {
        let exe = self.base_dir.join("cofire.exe");
        let data_dir = self.base_dir.join("data");

        std::process::Command::new(&exe)
            .current_dir(&data_dir)
            .creation_flags(0x08000000) // CREATE_NO_WINDOW
            .spawn()
            .map_err(|e| format!("Failed to start optimizer runtime: {e}"))
    }

    pub fn data_files(&self) -> Result<Vec<PathBuf>, String> {
        let data_dir = self.base_dir.join("data");
        let entries = std::fs::read_dir(&data_dir)
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
