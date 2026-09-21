#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod crypto;
mod db;
mod sales;

use crypto::licensing::{verify_license_token, LicensePayload, EMBEDDED_PUBLIC_KEY_HEX};
use sales::transaction::{execute_atomic_sale, CreateSalePayload, TransactionSuccess};
use std::sync::Mutex;
use tauri::State;

struct AppState {
    db_conn: Mutex<rusqlite::Connection>,
}

#[tauri::command]
fn check_license(hw_id: String, token: String) -> Result<LicensePayload, String> {
    verify_license_token(&hw_id, &token, EMBEDDED_PUBLIC_KEY_HEX).map_err(|e| e.to_string())
}

#[tauri::command]
fn create_sale_transaction(
    state: State<'_, AppState>,
    payload: CreateSalePayload,
) -> Result<TransactionSuccess, String> {
    let mut conn = state
        .db_conn
        .lock()
        .map_err(|_| "Error adquiriendo lock de base de datos".to_string())?;

    execute_atomic_sale(&mut conn, payload).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_terminal_status() -> String {
    "ONLINE_LOCAL".to_string()
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let path = db::get_db_path(&app.handle());
            let mut conn = rusqlite::Connection::open(path)
                .expect("FATAL: No se pudo abrir conexión con SQLite");
            db::initialize_database(&mut conn)
                .expect("FATAL: No se pudo inicializar esquema SQLite");

            app.manage(AppState {
                db_conn: Mutex::new(conn),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_terminal_status,
            check_license,
            create_sale_transaction
        ])
        .run(tauri::generate_context!())
        .expect("Error ejecutando runtime de Tauri");
}
