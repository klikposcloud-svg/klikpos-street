use rusqlite::{Connection, Result};
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;

pub fn get_db_path(app: &AppHandle) -> PathBuf {
    let mut dir = app
        .path_resolver()
        .app_data_dir()
        .unwrap_or_else(|| PathBuf::from("./"));
    if !dir.exists() {
        let _ = fs::create_dir_all(&dir);
    }
    dir.push("venematic_enterprise.sqlite");
    dir
}

pub fn initialize_database(conn: &mut Connection) -> Result<()> {
    conn.execute_batch(
        "
        PRAGMA journal_mode = WAL;
        PRAGMA synchronous = NORMAL;
        PRAGMA foreign_keys = ON;
        PRAGMA busy_timeout = 5000;

        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            barcode TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            price_usd REAL NOT NULL CHECK(price_usd >= 0),
            cost_usd REAL NOT NULL DEFAULT 0,
            stock REAL NOT NULL CHECK(stock >= 0),
            min_stock REAL NOT NULL DEFAULT 0,
            is_exempt INTEGER NOT NULL DEFAULT 0,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sales (
            id TEXT PRIMARY KEY,
            receipt_number TEXT UNIQUE NOT NULL,
            customer_name TEXT NOT NULL,
            customer_doc TEXT NOT NULL,
            bcv_rate REAL NOT NULL CHECK(bcv_rate > 0),
            total_usd REAL NOT NULL CHECK(total_usd >= 0),
            total_ves REAL NOT NULL CHECK(total_ves >= 0),
            status TEXT NOT NULL CHECK(status IN ('completed', 'voided', 'refunded')),
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sale_items (
            id TEXT PRIMARY KEY,
            sale_id TEXT NOT NULL,
            product_id TEXT NOT NULL,
            barcode TEXT NOT NULL,
            name TEXT NOT NULL,
            qty REAL NOT NULL CHECK(qty > 0),
            price_usd REAL NOT NULL CHECK(price_usd >= 0),
            total_usd REAL NOT NULL CHECK(total_usd >= 0),
            FOREIGN KEY(sale_id) REFERENCES sales(id) ON DELETE CASCADE,
            FOREIGN KEY(product_id) REFERENCES products(id)
        );

        CREATE TABLE IF NOT EXISTS kardex_audit (
            id TEXT PRIMARY KEY,
            product_id TEXT NOT NULL,
            reference_id TEXT NOT NULL,
            movement_type TEXT NOT NULL CHECK(movement_type IN ('SALE', 'ADJUSTMENT', 'PURCHASE', 'RETURN')),
            qty_delta REAL NOT NULL,
            stock_before REAL NOT NULL,
            stock_after REAL NOT NULL,
            operator_id TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            FOREIGN KEY(product_id) REFERENCES products(id)
        );

        CREATE TABLE IF NOT EXISTS sync_mutations_outbox (
            mutation_id TEXT PRIMARY KEY,
            node_id TEXT NOT NULL,
            vector_counter INTEGER NOT NULL,
            entity_type TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            operation TEXT NOT NULL CHECK(operation IN ('INSERT', 'UPDATE', 'DELETE')),
            payload_json TEXT NOT NULL,
            sync_status TEXT NOT NULL DEFAULT 'PENDING' CHECK(sync_status IN ('PENDING', 'SENT', 'FAILED')),
            created_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_kardex_prod ON kardex_audit(product_id);
        CREATE INDEX IF NOT EXISTS idx_mutations_status ON sync_mutations_outbox(sync_status, vector_counter);
        "
    )?;
    Ok(())
}
