import type { CSSProperties } from "react"

import {
  ETIQUETA_ANCHO_CAPTURA_PX,
  ETIQUETA_QR_COL_RATIO,
  pxCapturaImpresion,
} from "@/modules/dietas-cocina/etiquetas/lib/etiquetaLayout"

/** Tipografía legible para PDF 168 × 88 mm (sin iconos). */
export const TIPOGRAFIA_IMPRESION = {
  comida: pxCapturaImpresion(20),
  fechaHora: pxCapturaImpresion(14.5),
  paciente: pxCapturaImpresion(19),
  meta: pxCapturaImpresion(14.5),
  dietaLabel: pxCapturaImpresion(12.5),
  dietaValor: pxCapturaImpresion(15.5),
  obsLabel: pxCapturaImpresion(12.5),
  obsTexto: pxCapturaImpresion(14),
  codigoCorto: pxCapturaImpresion(13.5),
  codigoMedio: pxCapturaImpresion(12.5),
  codigoLargo: pxCapturaImpresion(11.5),
} as const

export const ELEMENTOS_IMPRESION = {
  logoAlto: pxCapturaImpresion(36),
  qrSize: Math.round(anchoColumnaQrCaptura() * 0.84),
  badgeFontSize: pxCapturaImpresion(13),
  badgePadV: pxCapturaImpresion(4),
  badgePadH: pxCapturaImpresion(10),
  badgeRadius: pxCapturaImpresion(6),
} as const

function anchoColumnaQrCaptura(): number {
  return Math.round(ETIQUETA_ANCHO_CAPTURA_PX * ETIQUETA_QR_COL_RATIO)
}

export function estiloCodigoEtiqueta(
  codigo: string,
  esImpresion: boolean,
): CSSProperties {
  const base: CSSProperties = {
    margin: 0,
    textAlign: "center",
    flexShrink: 0,
    maxWidth: "100%",
    boxSizing: "border-box",
    wordBreak: "break-all",
    overflowWrap: "anywhere",
    lineHeight: 1.15,
  }

  if (!esImpresion) {
    return {
      ...base,
      padding: "0 6px 8px",
      fontSize: 8,
      color: "#808080",
    }
  }

  const largo = codigo.trim().length
  const colorCodigo = "#1a1a1a"
  if (largo > 28) {
    return {
      ...base,
      padding: `0 ${pxCapturaImpresion(4)}px ${pxCapturaImpresion(8)}px`,
      fontSize: TIPOGRAFIA_IMPRESION.codigoLargo,
      fontWeight: 700,
      color: colorCodigo,
    }
  }
  if (largo > 22) {
    return {
      ...base,
      padding: `0 ${pxCapturaImpresion(4)}px ${pxCapturaImpresion(8)}px`,
      fontSize: TIPOGRAFIA_IMPRESION.codigoMedio,
      fontWeight: 700,
      color: colorCodigo,
    }
  }

  return {
    ...base,
    padding: `0 ${pxCapturaImpresion(5)}px ${pxCapturaImpresion(8)}px`,
    fontSize: TIPOGRAFIA_IMPRESION.codigoCorto,
    fontWeight: 700,
    color: colorCodigo,
  }
}
