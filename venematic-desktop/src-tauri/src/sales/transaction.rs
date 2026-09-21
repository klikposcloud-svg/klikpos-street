use rusqlite::{params, Connection, Transaction};
use serde::{Deserialize, Serialize};
use thiserror::Error;
use uuid::Uuid;
use chrono::Utc;

#[derive(Error, Debug)]
pub enum TransactionError {
    #[error("Error de Base de Datos SQLite: {0}")]
    Sqlite(#[from] rusqlite::Error),
    #[error("Stock insuficiente para el producto [{barcode}] {name}. Requerido: {requested}, Actual: {available}")]
    InsufficientStock {
        barcode: String,
        name: String,
        requested: f64,
        available: f64,
    },
    #[error("Producto no encontrado en catálogo local: {0}")]
    ProductNotFound(String),
    #[error("Serialización de Outbox falló: {0}")]
    Serialization(#[from] serde_json::Error),
}

#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct SaleItemPayload {
    pub product_id: String,
    pub barcode: String,
    pub name: String,
    pub qty: f64,
    pub price_usd: f64,
    pub total_usd: f64,
}

#[derive(Deserialize, Serialize, Debug)]
pub struct CreateSalePayload {
    pub receipt_number: String,
    pub customer_name: String,
    pub customer_doc: String,
    pub bcv_rate: f64,
    pub total_usd: f64,
    pub total_ves: f64,
    pub operator_id: String,
    pub node_id: String,
    pub items: Vec<SaleItemPayload>,
}

#[derive(Serialize, Debug)]
pub struct TransactionSuccess {
    pub sale_id: String,
    pub receipt_number: String,
    pub items_processed: usize,
    pub committed_at: String,
}

pub fn execute_atomic_sale(
    conn: &mut Connection,
    payload: CreateSalePayload,
) -> Result<TransactionSuccess, TransactionError> {
    let tx: Transaction = conn.transaction()?;
    let sale_id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    // 1. Insertar Cabecera de Venta
    tx.execute(
        "INSERT INTO sales (id, receipt_number, customer_name, customer_doc, bcv_rate, total_usd, total_ves, status, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'completed', ?8)",
        params![
            sale_id,
            payload.receipt_number,
            payload.customer_name,
            payload.customer_doc,
            payload.bcv_rate,
            payload.total_usd,
            payload.total_ves,
            now,
        ],
    )?;

    // 2. Procesar cada ítem: Descuento atómico de inventario + Kardex
    for item in &payload.items {
        let item_id = Uuid::new_v4().to_string();

        tx.execute(
            "INSERT INTO sale_items (id, sale_id, product_id, barcode, name, qty, price_usd, total_usd)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                item_id,
                sale_id,
                item.product_id,
                item.barcode,
                item.name,
                item.qty,
                item.price_usd,
                item.total_usd,
            ],
        )?;

        // Verificar stock actual con bloqueo dentro de la transacción
        let mut stmt = tx.prepare(
            "SELECT stock, name, barcode FROM products WHERE id = ?1"
        )?;
        let mut rows = stmt.query(params![item.product_id])?;

        if let Some(row) = rows.next()? {
            let current_stock: f64 = row.get(0)?;
            let prod_name: String = row.get(1)?;
            let prod_barcode: String = row.get(2)?;

            if current_stock < item.qty {
                return Err(TransactionError::InsufficientStock {
                    barcode: prod_barcode,
                    name: prod_name,
                    requested: item.qty,
                    available: current_stock,
                });
            }

            let new_stock = current_stock - item.qty;

            // Actualizar inventario
            tx.execute(
                "UPDATE products SET stock = ?1, updated_at = ?2 WHERE id = ?3",
                params![new_stock, now, item.product_id],
            )?;

            // 3. Registrar auditoría Kardex inmutable
            let kardex_id = Uuid::new_v4().to_string();
            tx.execute(
                "INSERT INTO kardex_audit (id, product_id, reference_id, movement_type, qty_delta, stock_before, stock_after, operator_id, timestamp)
                 VALUES (?1, ?2, ?3, 'SALE', ?4, ?5, ?6, ?7, ?8)",
                params![
                    kardex_id,
                    item.product_id,
                    sale_id,
                    -item.qty,
                    current_stock,
                    new_stock,
                    payload.operator_id,
                    now,
                ],
            )?;
        } else {
            return Err(TransactionError::ProductNotFound(item.product_id.clone()));
        }
    }

    // 4. Registro en Outbox Log (Vector Clock atómico)
    let next_counter: i64 = tx
        .query_row(
            "SELECT COALESCE(MAX(vector_counter), 0) + 1 FROM sync_mutations_outbox WHERE node_id = ?1",
            params![payload.node_id],
            |r| r.get(0),
        )?;

    let outbox_payload = serde_json::to_string(&payload)?;
    tx.execute(
        "INSERT INTO sync_mutations_outbox (mutation_id, node_id, vector_counter, entity_type, entity_id, operation, payload_json, sync_status, created_at)
         VALUES (?1, ?2, ?3, 'sale', ?4, 'INSERT', ?5, 'PENDING', ?6)",
        params![
            Uuid::new_v4().to_string(),
            payload.node_id,
            next_counter,
            sale_id,
            outbox_payload,
            now,
        ],
    )?;

    // Confirmación ACID completa
    tx.commit()?;

    Ok(TransactionSuccess {
        sale_id,
        receipt_number: payload.receipt_number,
        items_processed: payload.items.len(),
        committed_at: now,
    })
}
