import { normalizarCodigoEtiqueta } from "@/modules/dietas-cocina/etiquetas/lib/generarCodigoEtiqueta"
import { RUTAS_LOGISTICA } from "@/modules/dietas-cocina/lib/rutasLogistica"

export { normalizarCodigoEtiqueta }

const RUTA_CONSULTA = RUTAS_LOGISTICA.pisoConsulta

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

/** Normaliza códigos leídos desde QR (URL, LBL:… o código E…). */
export function extraerCodigoDesdeQr(raw: string): string {
  const limpio = raw.replace(/\s+/g, "").trim()
  const matchConsulta = limpio.match(/\/bandejas-piso\/consulta\/([^/?#]+)/i)
  if (matchConsulta) {
    return normalizarCodigoEtiqueta(decodeURIComponent(matchConsulta[1]))
  }
  return normalizarCodigoEtiqueta(limpio)
}
