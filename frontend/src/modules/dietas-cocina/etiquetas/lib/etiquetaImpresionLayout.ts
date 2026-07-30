import type { CSSProperties } from "react"

/** Ajuste mínimo del código ETQ para que quepa en la columna QR al imprimir. */
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
      padding: "0 6px 6px",
      fontSize: 9,
      color: "#808080",
    }
  }

  const largo = codigo.trim().length
  if (largo > 28) {
    return {
      ...base,
      padding: "0 3px 5px",
      fontSize: 6.5,
      color: "#808080",
    }
  }
  if (largo > 22) {
    return {
      ...base,
      padding: "0 4px 6px",
      fontSize: 7,
      color: "#808080",
    }
  }

  return {
    ...base,
    padding: "0 5px 6px",
    fontSize: 7.5,
    color: "#808080",
  }
}
