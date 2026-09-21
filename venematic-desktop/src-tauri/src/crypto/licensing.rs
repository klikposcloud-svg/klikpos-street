use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use ed25519_dalek::{Signature, Verifier, VerifyingKey};
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum LicenseVerificationError {
    #[error("Formato de licencia inválido (se requiere PAYLOAD.SIGNATURE)")]
    InvalidTokenFormat,
    #[error("Fallo decodificando Base64: {0}")]
    Base64Decode(#[from] base64::DecodeError),
    #[error("Clave pública inválida (longitud o encoding incorrecto): {0}")]
    InvalidPublicKey(#[from] ed25519_dalek::SignatureError),
    #[error("Decodificación Hex falló: {0}")]
    HexDecode(#[from] hex::FromHexError),
    #[error("Deserialización de payload JSON falló: {0}")]
    JsonParse(#[from] serde_json::Error),
    #[error("Hardware ID no coincide (Licencia para: {expected}, Hardware actual: {actual})")]
    HwidMismatch { expected: String, actual: String },
    #[error("La licencia se encuentra vencida. Fecha límite: {expiry}")]
    Expired { expiry: String },
    #[error("Firma criptográfica Ed25519 inválida. Licencia alterada o apócrifa")]
    InvalidSignature,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct LicensePayload {
    pub hw_id: String,
    pub business_name: String,
    pub rif: String,
    pub tier: String,          // 'perpetual' | 'annual' | 'enterprise'
    pub expires_at: i64,       // Unix Timestamp en segundos (0 para perpetua)
    pub issued_at: i64,
}

pub fn verify_license_token(
    current_hw_id: &str,
    token: &str,
    public_key_hex: &str,
) -> Result<LicensePayload, LicenseVerificationError> {
    let parts: Vec<&str> = token.split('.').collect();
    if parts.len() != 2 {
        return Err(LicenseVerificationError::InvalidTokenFormat);
    }

    let payload_b64 = parts[0];
    let signature_hex = parts[1];

    // 1. Parsear clave pública del desarrollador (32 bytes Ed25519)
    let pubkey_bytes = hex::decode(public_key_hex)?;
    if pubkey_bytes.len() != 32 {
        return Err(LicenseVerificationError::InvalidTokenFormat);
    }
    let pubkey_array: [u8; 32] = pubkey_bytes
        .as_slice()
        .try_into()
        .map_err(|_| LicenseVerificationError::InvalidTokenFormat)?;
    let verifying_key = VerifyingKey::from_bytes(&pubkey_array)?;

    // 2. Parsear firma (64 bytes Ed25519)
    let sig_bytes = hex::decode(signature_hex)?;
    if sig_bytes.len() != 64 {
        return Err(LicenseVerificationError::InvalidTokenFormat);
    }
    let sig_array: [u8; 64] = sig_bytes
        .as_slice()
        .try_into()
        .map_err(|_| LicenseVerificationError::InvalidTokenFormat)?;
    let signature = Signature::from_bytes(&sig_array);

    // 3. Verificar firma asimétrica contra el payload en Base64
    verifying_key
        .verify(payload_b64.as_bytes(), &signature)
        .map_err(|_| LicenseVerificationError::InvalidSignature)?;

    // 4. Decodificar y validar contenido del payload
    let raw_json = BASE64.decode(payload_b64)?;
    let payload: LicensePayload = serde_json::from_slice(&raw_json)?;

    // 5. Validar enlace de hardware (Anti-piratería)
    if payload.hw_id.trim().to_uppercase() != current_hw_id.trim().to_uppercase() {
        return Err(LicenseVerificationError::HwidMismatch {
            expected: payload.hw_id,
            actual: current_hw_id.to_string(),
        });
    }

    // 6. Validar vigencia temporal
    if payload.expires_at > 0 {
        let now = chrono::Utc::now().timestamp();
        if now > payload.expires_at {
            return Err(LicenseVerificationError::Expired {
                expiry: chrono::DateTime::from_timestamp(payload.expires_at, 0)
                    .map(|d| d.to_rfc3339())
                    .unwrap_or_else(|| "UNKNOWN".to_string()),
            });
        }
    }

    Ok(payload)
}
