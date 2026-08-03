import type { EtiquetaDieta } from "@/modules/dietas-cocina/types/labels"

/** Número de ingreso hospitalario (Vital) para la etiqueta. */
export function textoIngresoEtiqueta(etiqueta: EtiquetaDieta): string | null {
  if (etiqueta.idIngreso == null || etiqueta.idIngreso <= 0) return null
  return `Ingreso: ${etiqueta.idIngreso}`
}

function resolverTipoDocumento(etiqueta: EtiquetaDieta): string {
  const tipo = etiqueta.tipoDocumento?.trim()
  if (tipo) return tipo
  const match = etiqueta.pacienteId.match(/^([A-Za-z]{1,4})-/)
  return match?.[1]?.toUpperCase() ?? "CC"
}

/** Documento de identidad formateado (p. ej. CC: 1067921999). */
export function textoDocumentoEtiqueta(etiqueta: EtiquetaDieta): string {
  const documento = etiqueta.documento?.trim()
  if (!documento) {
    const clave = etiqueta.pacienteId.trim()
    const separador = clave.indexOf("-")
    if (separador > 0) {
      return `${clave.slice(0, separador)}: ${clave.slice(separador + 1)}`
    }
    return clave ? `Doc: ${clave}` : "Doc: —"
  }
  return `${resolverTipoDocumento(etiqueta)}: ${documento}`
}
