const RUTA_CONSULTA = "/dietas-cocina/etiquetas/consulta"

export function construirUrlConsultaEtiqueta(codigo: string): string {
  const codigoLimpio = codigo.trim()
  const path = `${RUTA_CONSULTA}/${encodeURIComponent(codigoLimpio)}`
  if (typeof window !== "undefined") {
    return `${window.location.origin}${path}`
  }
  return path
}

/** Contenido codificado en el QR impreso en la etiqueta. */
export function payloadQrEtiqueta(codigo: string): string {
  return construirUrlConsultaEtiqueta(codigo)
}

/** Normaliza códigos leídos desde QR (URL, LBL:… o código plano). */
export function extraerCodigoDesdeQr(raw: string): string {
  const limpio = raw.trim()
  const matchConsulta = limpio.match(/\/etiquetas\/consulta\/([^/?#]+)/i)
  if (matchConsulta) {
    return decodeURIComponent(matchConsulta[1]).toUpperCase()
  }
  if (limpio.toUpperCase().startsWith("LBL:")) {
    return limpio.slice(4).trim().toUpperCase()
  }
  return limpio.toUpperCase()
}
