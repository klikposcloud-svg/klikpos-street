/**
 * MARCO LEGAL, CONTRATO DE PRESTACIÓN DE SERVICIOS TECNOLÓGICOS,
 * LICENCIAMIENTO DE USUARIO FINAL (EULA), NORMAS ANTIPIRATERÍA Y TRATAMIENTO DE DATOS
 * KLIKPOS ENTERPRISE / KLIKPOS CLOUD
 * 
 * Basado en la Legislación Venezolana:
 * - Ley sobre el Derecho de Autor (Gaceta Oficial N° 4.638 Extraordinario)
 * - Ley Especial contra los Delitos Informáticos (Gaceta Oficial N° 37.313)
 * - Ley de Mensajes de Datos y Firmas Electrónicas (Gaceta Oficial N° 37.148)
 * - Código de Comercio de Venezuela (Contratos de Servicios Mercantiles)
 * 
 * Y Convenios Internacionales:
 * - Convenio de Berna para la Protección de las Obras Literarias y Artísticas
 * - Tratado de la OMPI sobre Derecho de Autor (WIPO Copyright Treaty - WCT)
 * - Digital Millennium Copyright Act (DMCA) - Protección contra Elusión Tecnológica
 */

export interface LegalDocument {
  id: 'eula' | 'terms' | 'privacy' | 'security_anti_piracy' | 'saas_service';
  title: string;
  shortTitle: string;
  badge: string;
  lastUpdated: string;
  sections: {
    title: string;
    content: string;
    highlight?: boolean;
  }[];
}

export const LEGAL_DOCUMENTS: Record<string, LegalDocument> = {
  eula: {
    id: 'eula',
    title: 'Contrato de Licencia de Uso y Servicios Tecnológicos (EULA)',
    shortTitle: 'Licencia EULA',
    badge: 'Propiedad Intelectual',
    lastUpdated: 'Septiembre 2026',
    sections: [
      {
        title: '1. Naturaleza del Contrato: Prestación de Servicio Tecnológico y Licencia de Uso (No Venta)',
        content: `El presente instrumento regula la relación entre EL PROVEEDOR TECNOLÓGICO y el titular del establecimiento comercial o persona natural/jurídica (en adelante, "EL LICENCIATARIO / USUARIO").
        
SE DECLARA Y ESTIPULA DE FORMA EXPRESA E INEQUÍVOCA QUE BAJO NINGÚN CONCEPTO SE EFECTÚA LA VENTA, TRANSFERENCIA DE DOMINIO NI CESIÓN DE DERECHOS PATRIMONIALES DEL SOFTWARE O CÓDIGO FUENTE. 

El objeto contractual consiste única y exclusivamente en la PRESTACIÓN DE UN SERVICIO DIGITAL DE GESTIÓN COMERCIAL y el otorgamiento de una LICENCIA DE USO temporal, limitada, no exclusiva, intransferible y revocable para operar la plataforma KLIKPOS en los puestos de trabajo autorizados. EL PROVEEDOR conserva en todo momento la titularidad total de la propiedad intelectual, algoritmos, bases de datos y marcas registradas al amparo de la Ley sobre el Derecho de Autor y el Convenio de Berna.`,
        highlight: true,
      },
      {
        title: '2. Cláusula de Secreto Comercial y Protección del Ecosistema Omnicanal',
        content: `EL LICENCIATARIO reconoce que la arquitectura interna del sistema, los mecanismos de sincronización en segundo plano (Silent Background Sync), los protocolos de enrutamiento omnicanal, los algoritmos de liquidación multimoneda y la red de interconexión con pasarelas y plataformas de pedidos digitales constituyen SECRETOS COMERCIALES E INDUSTRIALES (Trade Secrets) protegidos legalmente.
        
Queda terminantemente prohibido a EL LICENCIATARIO, sus dependientes, desarrolladores o terceros vinculados:
a) Intentar replicar, clonar, reproducir o imitar la lógica de interconexión de pedidos o el modelo de red omnicanal de EL PROVEEDOR.
b) Descompilar, desensamblar, interceptar tráfico de red de las API propietarias o realizar ingeniería inversa sobre el software.
c) Divulgar a competidores directos o indirectos cualquier especificación técnica interna de la plataforma.

Cualquier infracción a esta cláusula facultará a EL PROVEEDOR para iniciar inmediatamente las acciones penales tipificadas en la Ley Especial contra los Delitos Informáticos (Espionaje Informático, Revelación Indebida de Datos y Sabotaje) y demandas civiles por resarcimiento de daños y perjuicios comerciales.`,
        highlight: true,
      },
      {
        title: '3. Interoperabilidad Segura con el Ecosistema de Pedidos y Delivery',
        content: `Como parte del servicio de valor agregado para el comercio, EL SOFTWARE cuenta con capacidades de sincronización de catálogo de productos públicos, precios de venta y disponibilidad de inventario con el Ecosistema Digital de Enrutamiento de Pedidos de EL PROVEEDOR.
        
Dicha interconexión se ejecuta de forma cifrada y confidencial, garantizando en todo momento que los costos de adquisición, márgenes internos de ganancia, saldos de caja y datos contables privados NUNCA sean expuestos a terceros. EL LICENCIATARIO autoriza dicha interoperabilidad orientada al impulso y captación de ventas de su propio establecimiento comercial.`,
      },
      {
        title: '4. Alcance por Puesto / Estación de Trabajo (HWID)',
        content: `Cada licencia emitida se encuentra unívocamente vinculada a la huella criptográfica de hardware (Hardware ID / HWID) de la terminal registrada. La activación es intransferible entre diferentes computadores físicos. El intento de clonación de seriales o suplantación de identidad de hardware activará automáticamente los mecanismos de defensa tecnológica del sistema.`,
      },
    ],
  },

  security_anti_piracy: {
    id: 'security_anti_piracy',
    title: 'Normativa de Seguridad, Anti-Piratería y Medidas Tecnológicas de Protección',
    shortTitle: 'Seguridad & Anti-Piratería',
    badge: 'Protección Criptográfica',
    lastUpdated: 'Septiembre 2026',
    sections: [
      {
        title: '1. Medidas Tecnológicas de Protección (TPM) y Anti-Tampering',
        content: `De conformidad con los tratados internacionales de la OMPI y el marco legal sobre ciberseguridad, EL SOFTWARE incorpora Medidas Tecnológicas Efectivas de Protección Criptográfica (TPM), firmas digitales HMAC-SHA256 y detección activa de manipulación (Anti-Tampering).
        
Cualquier intento de:
a) Alterar la fecha y hora del sistema operativo (Time-Tampering) con la intención de burlar los periodos de vigencia de las licencias;
b) Modificar binarios compilados, inyectar librerías dinámicas o puentear la validación de activación;
c) Ejecutar ataques de fuerza bruta contra el generador de claves o servicios de validación;

Dará lugar al BLOQUEO INMEDIATO Y PREVENTIVO de la terminal y de la dirección IP de origen, con revocación automática del acceso a los servicios de sincronización en la nube, sin derecho a reembolso o indemnización alguna.`,
        highlight: true,
      },
      {
        title: '2. Monitoreo de Integridad y Telemetría de Ciberdefensa',
        content: `A los fines exclusivos de salvaguardar la seguridad del ecosistema y prevenir la clonación no autorizada de licencias, el sistema emite señales periódicas de telemetría técnica que contienen:
- Identificador de hardware (HWID anonimizado).
- Dirección IP pública de conexión.
- Versión de compilación del software.
- Estado de integridad de la base de datos local.
        
El uso del software implica la aceptación expresa de estos mecanismos de auditoría técnica y prevención de fraude informático.`,
      },
      {
        title: '3. Tipificación Penal y Acciones Legales',
        content: `EL LICENCIATARIO queda advertido de que la comercialización, distribución no autorizada, descompilación o crackeo de este software constituye delito tipificado en los Artículos 6 (Acceso Indebido), 7 (Sabotaje o Daño a Sistemas), 9 (Acceso Indebido con Fin de Lucro) y 12 (Falsificación de Documentos Electrónicos) de la Ley Especial contra los Delitos Informáticos de Venezuela, con penas privativas de libertad de hasta 8 años de prisión, independientemente de las sanciones internacionales de extradición y bloqueo comercial.`,
        highlight: true,
      },
    ],
  },

  terms: {
    id: 'terms',
    title: 'Términos de Servicio y Descargo de Responsabilidad Tributaria (SENIAT)',
    shortTitle: 'Términos y SENIAT',
    badge: 'Condiciones Operativas',
    lastUpdated: 'Septiembre 2026',
    sections: [
      {
        title: '1. Herramienta Administrativa y Descargo Fiscal (SENIAT)',
        content: `EL SOFTWARE es una herramienta informática de gestión operativa, control de inventario, cálculo de costos y punto de venta. 

EL PROVEEDOR NO ES REPRESENTANTE FISCAL NI ASUME OBLIGACIONES TRIBUTARIAS DE EL LICENCIATARIO.
Es responsabilidad exclusiva del comerciante dar estricto cumplimiento a las providencias administrativas del SENIAT relativas a máquinas fiscales homologadas, impresoras fiscales autorizadas o facturación electrónica según su condición de contribuyente. EL PROVEEDOR queda completamente exonerado de cualquier sanción, multa o clausura impuesta por entes tributarios al establecimiento.`,
        highlight: true,
      },
      {
        title: '2. Continuidad Operativa, Respaldo y Fluctuaciones Eléctricas',
        content: `El software está diseñado con tecnología Offline-First para garantizar la venta ininterrumpida aun sin internet. No obstante, EL LICENCIATARIO es responsable de conectar sus terminales a sistemas de alimentación ininterrumpida (UPS regulados) para proteger el hardware contra sobretensiones y apagones. El servicio de sincronización silenciosa (Silent Cloud Sync) actúa como mecanismo de respaldo de contingencia ante fallas de disco duro o contingencias físicas.`,
      },
    ],
  },

  privacy: {
    id: 'privacy',
    title: 'Aviso de Privacidad y Soberanía de Datos Comerciales',
    shortTitle: 'Privacidad y Datos',
    badge: 'Protección de Datos',
    lastUpdated: 'Septiembre 2026',
    sections: [
      {
        title: '1. Soberanía y Confidencialidad de la Información Comercial',
        content: `Toda la información correspondiente a balances de caja, montos de facturación interna, listas de proveedores y márgenes privados reside de manera local y encriptada en la base de datos de EL LICENCIATARIO. EL PROVEEDOR NO VENDE NI COMERCIALIZA datos privados ni registros financieros con terceros.`,
        highlight: true,
      },
    ],
  },
};
