/**
 * MARCO LEGAL, CONTRATO DE LICENCIA DE USUARIO FINAL (EULA),
 * TÉRMINOS Y CONDICIONES Y POLÍTICA DE PRIVACIDAD
 * VENEMATIC POS / KLIKPOS / KLIKO
 */

export interface LegalDocument {
  id: 'eula' | 'terms' | 'privacy' | 'seniat_hardware';
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
    title: 'Contrato de Licencia de Uso de Software (EULA)',
    shortTitle: 'Licencia EULA',
    badge: 'Propiedad Intelectual',
    lastUpdated: 'Septiembre 2026',
    sections: [
      {
        title: '1. Objeto y Naturaleza de la Licencia',
        content: `El presente Contrato de Licencia de Usuario Final regula el uso del sistema comercial VENEMATIC POS (en adelante, "EL SOFTWARE"). Al instalar, registrar, ingresar clave de activación o utilizar EL SOFTWARE, el Comerciante o Empresa (en adelante, "EL LICENCIATARIO") acepta quedar expresamente vinculado por los presentes términos.

SE ESTIPULA DE MANERA TAJANTE QUE EL SOFTWARE NO SE VENDE, SE LICENCIA. EL LICENCIATARIO no adquiere derecho de propiedad, título de dominio ni copropiedad sobre el código fuente, diseño, arquitectura, marcas ni patentes del software, adquiriendo exclusivamente un derecho limitado, no exclusivo, intransferible y revocable de uso comercial en las condiciones aquí pactadas.`,
        highlight: true,
      },
      {
        title: '2. Restricciones Estrictas de Uso y Anti-Ingeniería Inversa',
        content: `Queda terminantemente prohibido a EL LICENCIATARIO, sus empleados o terceros:
a) Modificar, descompilar, realizar ingeniería inversa, desensamblar o intentar extraer el código fuente de EL SOFTWARE o cualquiera de sus módulos.
b) Eludir, vulnerar o alterar los mecanismos de validación criptográfica, identificación de hardware (HWID) o control de seriales de activación.
c) Alquilar, arrendar, sublicenciar, revender, redistribuir, ceder o compartir las credenciales de activación con terceros o computadores no autorizados.
d) Utilizar el software para fines ilícitos o contrarios a las leyes vigentes de la República Bolivariana de Venezuela.`,
        highlight: true,
      },
      {
        title: '3. Alcance por Puesto / Estación de Trabajo (HWID)',
        content: `Toda licencia comercial se encuentra vinculada a la huella criptográfica de hardware única (HWID) del equipo informático registrado. La activación es válida exclusivamente para el equipo autorizado. La migración a una nueva computadora requerirá la desautorización previa o la emisión de una nueva licencia según las políticas del LICENCIANTE.`,
      },
      {
        title: '4. Vigencia y Rescisión',
        content: `La licencia mantendrá su vigencia según el plan contratado (Suscripción Periódica o Licencia Vitalicia de Explotación Comercial). El incumplimiento comprobado de las restricciones de propiedad intelectual o uso fraudulento conllevará la revocación inmediata del derecho de uso, sin perjuicio de las acciones civiles y penales amparadas en la Ley sobre el Derecho de Autor y la Ley Especial contra los Delitos Informáticos.`,
      },
    ],
  },

  terms: {
    id: 'terms',
    title: 'Términos y Condiciones de Servicio y Uso',
    shortTitle: 'Términos y Condiciones',
    badge: 'Condiciones de Uso',
    lastUpdated: 'Septiembre 2026',
    sections: [
      {
        title: '1. Herramienta Administrativa y Descargo de Responsabilidad Fiscal (SENIAT)',
        content: `EL SOFTWARE es una herramienta tecnológica informática diseñada para el control administrativo, gestión de inventarios, estimación de costos, registro de cobros multimoneda y apoyo operativo en el punto de venta.

EL SOFTWARE NO SUSTITUYE LAS OBLIGACIONES TRIBUTARIAS FORMALES DE EL LICENCIATARIO.
Es responsabilidad legal exclusiva y directa de EL LICENCIATARIO verificar su régimen tributario ante el Servicio Nacional Integrado de Administración Aduanera y Tributaria (SENIAT) y disponer de los equipos fiscales homologados (máquinas fiscales, impresoras fiscales autorizadas o sistemas de facturación bajo providencias del SENIAT) cuando su condición de contribuyente ordinario o especial así lo exija.

EL DESARROLLADOR NO ASUME RESPONSABILIDAD ALGUNA POR MULTAS, REPAROS, SANCIONES ADMINISTRATIVAS, CLAUSURAS O CIERRES FISCALES que las autoridades tributarias impongan a EL LICENCIATARIO por omisión en la emisión de facturas fiscales, falta de equipos homologados o uso indebido de comprobantes internos o notas de entrega.`,
        highlight: true,
      },
      {
        title: '2. Continuidad Operativa, Fluctuaciones Eléctricas y Respaldo de Datos',
        content: `EL SOFTWARE opera bajo una arquitectura On-Premise / Local. En consecuencia:
a) EL LICENCIATARIO reconoce y acepta que las interrupciones operativas derivadas de fallas en el suministro eléctrico, fluctuaciones de voltaje (bajones), apagones, sobretensiones o averías en componentes físicos de hardware de la computadora del comercio escapan al control de EL DESARROLLADOR.
b) Es obligación imperativa de EL LICENCIATARIO mantener conectado su equipo a un Sistema de Alimentación Ininterrumpida (UPS) regulado y realizar respaldos de base de datos periódicos mediante la herramienta nativa de copias de seguridad de EL SOFTWARE.
c) EL DESARROLLADOR no responderá por lucro cesante, daño emergente, pérdida de ventas ni corrupción de ficheros ocasionada por cortes abruptos de energía en el establecimiento comercial.`,
        highlight: true,
      },
      {
        title: '3. Compatibilidad con Periféricos y Hardware de Terceros',
        content: `EL SOFTWARE interactúa con impresoras térmicas, balanzas comerciales de puerto serial/USB, escáneres de códigos de barras y gavetas de dinero mediante protocolos estándar del mercado. EL DESARROLLADOR no se hace responsable por incompatibilidades derivadas de controladores desactualizados, puertos físicos dañados, cables defectuosos o modificaciones al sistema operativo realizadas por terceros.`,
      },
    ],
  },

  privacy: {
    id: 'privacy',
    title: 'Aviso de Privacidad y Tratamiento de Datos (DPA)',
    shortTitle: 'Privacidad y Datos',
    badge: 'Protección de Datos',
    lastUpdated: 'Septiembre 2026',
    sections: [
      {
        title: '1. Principio de Almacenamiento Local (Offline-First / On-Premise)',
        content: `EL SOFTWARE está programado bajo un paradigma de almacenamiento local y soberanía de datos del comerciante. Toda la información transaccional, catálogo de productos, costos, márgenes de ganancia, balances de caja y registros de ventas residen almacenados en la base de datos local de la computadora de EL LICENCIATARIO.

EL DESARROLLADOR NO ACCEDE, NO VENDE, NO TRANSFIERE NI COMERCIALIZA bajo ninguna circunstancia los datos comerciales de EL LICENCIATARIO con empresas de análisis, entes gubernamentales ni terceros.`,
        highlight: true,
      },
      {
        title: '2. Encargo de Tratamiento de Datos de Terceros (Clientes y Consumidores)',
        content: `En los módulos de clientes, cuentas corrientes / créditos fiados, servicios de delivery y validación de Pago Móvil, EL SOFTWARE permite almacenar datos de personas naturales y jurídicas (Cédula/RIF, nombres, números de teléfono, direcciones).

A los efectos de la Ley de Protección de Datos:
a) EL LICENCIATARIO es el "Responsable del Fichero / Tratamiento", siendo el custodio directo y titular de la base de datos de sus clientes.
b) EL SOFTWARE actúa meramente como la herramienta tecnológica que procesa y organiza dichos registros a solicitud del usuario.
c) EL LICENCIATARIO garantiza que recaba dichos datos de conformidad con la ley aplicable y asume la responsabilidad de resguardar el acceso físico y lógico a su computadora.`,
      },
      {
        title: '3. Telemetría y Soporte Técnico',
        content: `Únicamente cuando EL LICENCIATARIO solicite de manera voluntaria asistencia técnica o soporte técnico remoto, podrá autorizar temporalmente la visualización de pantallas o el envío de registros de error (logs técnicos) con el único objetivo de resolver incidencias de software.`,
      },
    ],
  },
};
