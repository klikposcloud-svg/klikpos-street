// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Comando nativo para registrar eventos si fuera necesario
#[tauri::command]
fn get_terminal_status() -> String {
    "ONLINE_LOCAL".to_string()
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_terminal_status])
        .run(tauri::generate_context!())
        .expect("error while running venematic tauri application");
}
