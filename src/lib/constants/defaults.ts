/**
 * VENEMATIC POS - Constantes y Valores Predeterminados Centralizados
 * Fuente única de la verdad para valores por defecto de la aplicación.
 */

export const SYSTEM_DEFAULTS = {
  // Impuestos oficiales de Venezuela (SENIAT)
  IVA_RATE: 0.16, // 16% Alícuota General
  IGTF_RATE: 0.03, // 3% Impuesto a Grandes Transacciones Financieras en divisas

  // Tasa de cambio BCV de contingencia (se actualiza automáticamente al iniciar la app)
  DEFAULT_BCV_RATE: 857.01,

  // Información fiscal y comercial por defecto
  DEFAULT_STORE: {
    name: 'Mi Comercio Venematic',
    rif: 'J-00000000-0',
    address: 'Dirección Comercial, Venezuela',
    phone: '+58 000-0000000',
    currency: 'USD',
  },

  // Puertos y red
  DEFAULT_PORT: 3002,
  DEFAULT_WEBHOOK_SECRET: 'venematic-pm-2026-sec',
};

export default SYSTEM_DEFAULTS;
