/**
 * KLIKPOS INPUT SECURITY & ANTI-INJECTION SHIELD
 * 
 * Capa de sanitización y validación estricta en tiempo real para todos los campos de entrada.
 * Bloquea y neutraliza:
 * - XSS & Inyecciones HTML (tags, event handlers, javascript:, data: URIs)
 * - Inyecciones SQL / NoSQL (' OR '1'='1, UNION, DROP, $where)
 * - Inyecciones de Comandos OS & Shell (; rm, &&, ``, $(), powershell, bash)
 * - Path Traversal (../, ..\, /etc/passwd)
 * - Null Byte Poisoning y caracteres de control invisibles
 */

export interface ValidationResult {
  isValid: boolean;
  sanitized: string;
  threatDetected?: string;
}

// Patrones de ataque conocidos
const DANGEROUS_PATTERNS: Array<{ regex: RegExp; threat: string }> = [
  // 1. XSS & HTML Scripts
  { regex: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, threat: 'XSS Script Tag' },
  { regex: /<iframe\b[^>]*>/gi, threat: 'XSS iframe' },
  { regex: /<object\b[^>]*>/gi, threat: 'XSS object' },
  { regex: /<embed\b[^>]*>/gi, threat: 'XSS embed' },
  { regex: /<svg\b[^>]*onload\b[^>]*>/gi, threat: 'XSS SVG onload' },
  { regex: /<img\b[^>]*onerror\b[^>]*>/gi, threat: 'XSS img onerror' },
  { regex: /javascript\s*:/gi, threat: 'JavaScript URI Protocol' },
  { regex: /data\s*:\s*text\/html/gi, threat: 'Data HTML Protocol' },
  { regex: /vbscript\s*:/gi, threat: 'VBScript Protocol' },
  { regex: /on(load|error|click|mouseover|focus|blur|change|submit|keydown|keyup)\s*=/gi, threat: 'Inline Event Handler' },

  // 2. Command & Shell Injection
  { regex: /(;|\||&|`|\$\()+\s*(rm|del|shutdown|reboot|curl|wget|bash|sh|cmd|powershell|nc|ncat|netcat|invoke-expression|iex)\b/gi, threat: 'Shell Command Injection' },
  { regex: /\b(eval|exec|Function|setTimeout|setInterval)\s*\(/gi, threat: 'Dynamic Code Execution' },

  // 3. SQL / NoSQL Injection
  { regex: /(\b(UNION\s+ALL\s+SELECT|UNION\s+SELECT|SELECT\s+.*\s+FROM|INSERT\s+INTO|DELETE\s+FROM|DROP\s+TABLE|ALTER\s+TABLE|TRUNCATE\s+TABLE|OR\s+'?1'?='?1'|AND\s+'?1'?='?1')\b|--\s*|\/\*.*\*\/)/gi, threat: 'SQL Injection' },
  { regex: /\$(where|regex|gt|gte|lt|lte|ne|in|nin|exists|expr)\b/gi, threat: 'NoSQL Operator Injection' },

  // 4. Path Traversal & File Inclusion
  { regex: /(\.\.[\/\\])+/g, threat: 'Path Traversal (../)' },
  { regex: /\/etc\/(passwd|shadow|hosts)/gi, threat: 'UNIX File Inclusion' },
  { regex: /[a-zA-Z]:\\(windows|system32|boot\.ini)/gi, threat: 'Windows System File Access' },

  // 5. Null Byte & Control Characters (except standard newlines and tabs)
  { regex: /\0|\x00|%00/g, threat: 'Null Byte Poisoning' },
];

export class InputGuard {
  /**
   * Valida y sanitiza una cadena de texto eliminando cualquier contenido sospechoso.
   */
  public static sanitize(input: unknown, maxLength: number = 250): string {
    if (input === null || input === undefined) return '';
    let str = String(input);

    // 1. Eliminar caracteres de control peligrosos
    str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // 2. Recortar al largo máximo permitido
    if (str.length > maxLength) {
      str = str.substring(0, maxLength);
    }

    // 3. Neutralizar tags HTML y caracteres especiales de código
    str = str
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/`/g, '&#x60;');

    return str.trim();
  }

  /**
   * Comprueba si el texto contiene patrones de código malicioso o comandos.
   */
  public static inspect(input: unknown): ValidationResult {
    if (input === null || input === undefined) {
      return { isValid: true, sanitized: '' };
    }

    const str = String(input);

    for (const item of DANGEROUS_PATTERNS) {
      if (item.regex.test(str)) {
        // Reset regex state
        item.regex.lastIndex = 0;
        return {
          isValid: false,
          sanitized: this.sanitize(str),
          threatDetected: item.threat,
        };
      }
      item.regex.lastIndex = 0;
    }

    return {
      isValid: true,
      sanitized: this.sanitize(str),
    };
  }

  /**
   * Sanitizador estricto para Nombres (Personas, Negocios, Productos).
   * Solo permite letras, números, acentos, espacios y signos básicos puntuación permitidos (. , -).
   */
  public static sanitizeName(input: unknown, maxLength: number = 80): string {
    const raw = String(input || '');
    // Remover etiquetas y caracteres extraños
    const cleaned = raw.replace(/[<>{}[\]\\/`~#$%^*+=|;:"_]/g, '');
    return cleaned.substring(0, maxLength).trim();
  }

  /**
   * Sanitizador estricto para montos y precios numéricos.
   */
  public static sanitizeNumber(input: unknown, min: number = 0, max: number = 100000000): number {
    if (typeof input === 'number' && !isNaN(input)) {
      return Math.max(min, Math.min(max, input));
    }
    const parsed = parseFloat(String(input).replace(/[^0-9.-]/g, ''));
    if (isNaN(parsed)) return min;
    return Math.max(min, Math.min(max, parsed));
  }

  /**
   * Sanitizador estricto para códigos de referencia bancaria o números de factura.
   * Solo permite caracteres alfanuméricos y guiones (ej. 8492, REF-1024).
   */
  public static sanitizeReference(input: unknown, maxLength: number = 30): string {
    const raw = String(input || '');
    return raw.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, maxLength).trim();
  }

  /**
   * Sanitizador para teléfonos y cédulas/RIFs venezolanos.
   */
  public static sanitizeDocument(input: unknown, maxLength: number = 15): string {
    const raw = String(input || '');
    return raw.replace(/[^vVeEjJgGpP0-9-]/g, '').substring(0, maxLength).toUpperCase().trim();
  }

  /**
   * Sanitizador para notas y observaciones de pedidos.
   */
  public static sanitizeNotes(input: unknown, maxLength: number = 300): string {
    return this.sanitize(input, maxLength);
  }
}
