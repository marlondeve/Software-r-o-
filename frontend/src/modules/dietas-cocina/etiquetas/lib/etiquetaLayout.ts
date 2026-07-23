/** Tamaño del contenido de la etiqueta en mm (ancho × alto). */
export const ANCHO_ETIQUETA_MM = 115
export const ALTO_ETIQUETA_MM = 66

/** Margen extra en la hoja PDF para que no se corten los bordes. */
export const MARGEN_PDF_MM = 4

/** Tamaño total de la hoja PDF (contenido + márgenes). */
export const ANCHO_PAGINA_PDF_MM = ANCHO_ETIQUETA_MM + MARGEN_PDF_MM * 2
export const ALTO_PAGINA_PDF_MM = ALTO_ETIQUETA_MM + MARGEN_PDF_MM * 2

/** px/mm a 96 dpi. */
export const PX_POR_MM = 96 / 25.4

/** Proporción de la columna QR respecto al ancho total. */
export const ETIQUETA_QR_COL_RATIO = 0.3

/** Resolución del QR. */
export const ETIQUETA_QR_RESolucion = 512

/** Dimensiones px del contenido impreso (115 × 66 mm). */
export const ETIQUETA_ANCHO_PX = Math.round(ANCHO_ETIQUETA_MM * PX_POR_MM)
export const ETIQUETA_ALTO_PX = Math.round(ALTO_ETIQUETA_MM * PX_POR_MM)

/** Escala visual en pantalla — no afecta el PDF. */
export const ETIQUETA_ESCALA_PANTALLA = 0.94

/** Padding extra al capturar para html2canvas (px). */
export const CAPTURA_PADDING_PX = 10

export function anchoColumnaQr(anchoTotal: number): number {
  return Math.round(anchoTotal * ETIQUETA_QR_COL_RATIO)
}

export function dimensionesEtiquetaPantalla(): { ancho: number; alto: number } {
  return {
    ancho: Math.round(ETIQUETA_ANCHO_PX * ETIQUETA_ESCALA_PANTALLA),
    alto: Math.round(ETIQUETA_ALTO_PX * ETIQUETA_ESCALA_PANTALLA),
  }
}
