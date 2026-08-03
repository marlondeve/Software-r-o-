import type { CSSProperties } from "react"

/** Tipografía exclusiva del modo impresión (PDF / impresora ST48). */
export const TIPOGRAFIA_IMPRESION = {
  comida: 15,
  fechaHora: 12,
  paciente: 14,
  meta: 11.5,
  dietaLabel: 10.5,
  dietaValor: 13,
  obsLabel: 10.5,
  obsTexto: 11.5,
  codigoCorto: 9.5,
  codigoMedio: 9,
  codigoLargo: 8.5,
} as const

/** Elementos gráficos del modo impresión (escalan con el tamaño de etiqueta). */
export const ELEMENTOS_IMPRESION = {
  logoAlto: 30,
  qrSize: 102,
  badgeFontSize: 10,
} as const

/** Ajuste del código ETQ para que quepa en la columna QR al imprimir. */
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
  if (largo > 28) {
    return {
      ...base,
      padding: "0 3px 8px",
      fontSize: TIPOGRAFIA_IMPRESION.codigoLargo,
      fontWeight: 700,
      color: "#595959",
    }
  }
  if (largo > 22) {
    return {
      ...base,
      padding: "0 4px 8px",
      fontSize: TIPOGRAFIA_IMPRESION.codigoMedio,
      fontWeight: 700,
      color: "#595959",
    }
  }

  return {
    ...base,
    padding: "0 5px 8px",
    fontSize: TIPOGRAFIA_IMPRESION.codigoCorto,
    fontWeight: 700,
    color: "#595959",
  }
}
