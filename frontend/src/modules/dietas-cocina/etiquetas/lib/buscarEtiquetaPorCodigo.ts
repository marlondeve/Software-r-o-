import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/etiquetas/datos/mockEntregasEnfermera"
import { extraerCodigoDesdeQr } from "@/modules/dietas-cocina/etiquetas/lib/qrPayloadEtiqueta"

export function buscarEtiquetaPorCodigo(
  etiquetas: EtiquetaEnfermera[],
  codigoRaw: string,
): EtiquetaEnfermera | undefined {
  const codigo = extraerCodigoDesdeQr(codigoRaw)
  return etiquetas.find(
    (e) =>
      e.codigo.toUpperCase() === codigo ||
      e.qrPayload.toUpperCase() === `LBL:${codigo}` ||
      e.qrPayload.toUpperCase() === codigoRaw.trim().toUpperCase(),
  )
}
