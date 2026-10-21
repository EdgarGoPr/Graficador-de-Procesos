/**
 * Utilitario de Accesibilidad y Contraste Cromático para Nodos BPMN (ProcesStudio)
 *
 * Calcula en tiempo real la luminancia y brillo del color de fondo efectivo de cada tarjeta
 * y provee una paleta de alto contraste basada exclusivamente en tonalidades de
 * Blanco, Gris y Negro, asegurando que los títulos y descripciones sean siempre
 * perfectamente legibles independientemente del tema o personalización visual.
 */

export interface NodeContrastPalette {
  isLightBg: boolean;
  titleColor: string;       // Color del título principal (#FFFFFF en oscuro, #0F172A en claro)
  bodyColor: string;        // Color de la descripción / textos del cuerpo (#CBD5E1 en oscuro, #334155 en claro)
  mutedColor: string;       // Color de textos secundarios / metadatos (#94A3B8 en oscuro, #64748B en claro)
  subtleBg: string;         // Fondo tenue para cajas de detalles
  borderColor: string;      // Borde sutil armónico
}

/**
 * Parsea cualquier formato de color CSS soportado (hex, rgb, rgba) en componentes RGB numéricos
 */
function parseRgb(colorStr: string): { r: number; g: number; b: number; a: number } | null {
  const str = colorStr.trim().toLowerCase();

  // Handle RGBA / RGB
  if (str.startsWith('rgb')) {
    const match = str.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s\/]+([\d\.]+))?\)/);
    if (match) {
      return {
        r: parseInt(match[1], 10),
        g: parseInt(match[2], 10),
        b: parseInt(match[3], 10),
        a: match[4] !== undefined ? parseFloat(match[4]) : 1
      };
    }
  }

  // Handle HEX
  if (str.startsWith('#')) {
    let hex = str.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map((char) => char + char).join('');
    }
    if (hex.length >= 6) {
      const num = parseInt(hex.slice(0, 6), 16);
      const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
      return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255,
        a
      };
    }
  }

  return null;
}

/**
 * Evalúa el contraste del fondo y retorna la paleta equilibrada de Blanco/Gris/Negro
 *
 * @param customBgColor Color de fondo explícito del nodo (opcional)
 * @param customBgOpacity Opacidad (0 a 100 o 0 a 1)
 * @param isDarkTheme Indica si el tema global de la aplicación es oscuro (por defecto true)
 */
export function getNodeTextContrast(
  customBgColor?: string,
  customBgOpacity?: number,
  isDarkTheme: boolean = true
): NodeContrastPalette {
  // Color base del canvas sobre el que se mezcla cualquier transparencia
  const canvasBaseRgb = isDarkTheme ? { r: 19, g: 27, b: 46 } : { r: 241, g: 245, b: 249 };

  let effectiveR = isDarkTheme ? 30 : 255;
  let effectiveG = isDarkTheme ? 41 : 255;
  let effectiveB = isDarkTheme ? 59 : 255;

  if (customBgColor) {
    const parsed = parseRgb(customBgColor);
    if (parsed) {
      // Normalizar opacidad entre 0 y 1
      let alpha = parsed.a;
      if (customBgOpacity !== undefined) {
        const normOpacity = customBgOpacity > 1 ? customBgOpacity / 100 : customBgOpacity;
        alpha *= Math.max(0, Math.min(1, normOpacity));
      }

      // Alpha blend con el color de base del canvas
      effectiveR = Math.round(parsed.r * alpha + canvasBaseRgb.r * (1 - alpha));
      effectiveG = Math.round(parsed.g * alpha + canvasBaseRgb.g * (1 - alpha));
      effectiveB = Math.round(parsed.b * alpha + canvasBaseRgb.b * (1 - alpha));
    }
  }

  // Brillo perceptivo según estándar YIQ (ponderación del ojo humano)
  const brightness = (effectiveR * 299 + effectiveG * 587 + effectiveB * 114) / 1000;
  const isLightBg = brightness > 142;

  if (isLightBg) {
    return {
      isLightBg: true,
      titleColor: '#0F172A',      // Negro grafito nítido
      bodyColor: '#334155',       // Gris pizarra oscuro (alta legibilidad)
      mutedColor: '#64748B',      // Gris medio oscuro
      subtleBg: 'rgba(0, 0, 0, 0.04)',
      borderColor: 'rgba(0, 0, 0, 0.12)'
    };
  }

  return {
    isLightBg: false,
    titleColor: '#FFFFFF',        // Blanco puro de máximo contraste
    bodyColor: '#CBD5E1',         // Gris perla claro de lectura descansada
    mutedColor: '#94A3B8',        // Gris medio claro
    subtleBg: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.12)'
  };
}
