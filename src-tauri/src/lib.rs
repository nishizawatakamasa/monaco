use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

fn note_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("note.txt"))
}

#[tauri::command]
fn load_note(app: AppHandle) -> Result<String, String> {
    let path = note_path(&app)?;
    if !path.exists() {
        fs::write(&path, "").map_err(|e| e.to_string())?;
        return Ok(String::new());
    }
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_note(app: AppHandle, content: String) -> Result<(), String> {
    let path = note_path(&app)?;
    fs::write(&path, content).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![load_note, save_note])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
