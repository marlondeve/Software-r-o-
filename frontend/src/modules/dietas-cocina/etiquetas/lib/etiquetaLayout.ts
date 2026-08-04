/**
 * PDF generado (168 × 88 mm). La impresora térmica escala al stock 40 × 60 mm.
 */
export const ANCHO_ETIQUETA_MM = 168
export const ALTO_ETIQUETA_MM = 88

/** Vista previa en pantalla — diseño original 120 × 80 mm. */
export const ANCHO_ETIQUETA_PREVIEW_MM = 120
export const ALTO_ETIQUETA_PREVIEW_MM = 80

export const MARGEN_PDF_MM = 0

export const ANCHO_PAGINA_PDF_MM = ANCHO_ETIQUETA_MM + MARGEN_PDF_MM * 2
export const ALTO_PAGINA_PDF_MM = ALTO_ETIQUETA_MM + MARGEN_PDF_MM * 2

export const PX_POR_MM = 96 / 25.4

export const ETIQUETA_QR_COL_RATIO = 0.3

/** Resolución alta para QR escaneable en térmica. */
export const ETIQUETA_QR_RESolucion = 4096

/** DOM ampliado 5× sobre el diseño base (antes 2×). */
export const CAPTURA_DOM_SCALE = 5

/** html2canvas 8× sobre el DOM ampliado (antes 4×). ~25 000 px de ancho efectivo. */
export const CAPTURA_HTML2CANVAS_SCALE = 8

/** Calidad JPEG embebido en PDF (misma resolución de captura, ~5–10× menos peso que PNG). */
export const PDF_JPEG_CALIDAD = 0.96

export const ETIQUETA_ANCHO_PX = Math.round(ANCHO_ETIQUETA_MM * PX_POR_MM)
export const ETIQUETA_ALTO_PX = Math.round(ALTO_ETIQUETA_MM * PX_POR_MM)

export const ETIQUETA_ANCHO_CAPTURA_PX = Math.round(ETIQUETA_ANCHO_PX * CAPTURA_DOM_SCALE)
export const ETIQUETA_ALTO_CAPTURA_PX = Math.round(ETIQUETA_ALTO_PX * CAPTURA_DOM_SCALE)

export const ETIQUETA_ESCALA_PANTALLA = 0.94

export function pxCapturaImpresion(valorDiseño: number): number {
  return Math.round(valorDiseño * CAPTURA_DOM_SCALE * 10) / 10
}

export function anchoColumnaQr(anchoTotal: number): number {
  return Math.round(anchoTotal * ETIQUETA_QR_COL_RATIO)
}

export function dimensionesEtiquetaPantalla(): { ancho: number; alto: number } {
  return {
    ancho: Math.round(ANCHO_ETIQUETA_PREVIEW_MM * PX_POR_MM * ETIQUETA_ESCALA_PANTALLA),
    alto: Math.round(ALTO_ETIQUETA_PREVIEW_MM * PX_POR_MM * ETIQUETA_ESCALA_PANTALLA),
  }
}
