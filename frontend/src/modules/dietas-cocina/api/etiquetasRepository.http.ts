import {
  buscarEtiquetaPorCodigoSafe,
  confirmarEntregaEtiqueta,
  confirmarPreEntregaEtiqueta,
  descargarPdfEtiquetas,
  generarEtiquetas,
  listarEtiquetas,
  marcarEtiquetasImpresas,
  marcarEtiquetasReimpresas,
  registrarDevolucionEtiqueta,
  subirFotoDevolucion,
} from "@/modules/dietas-cocina/api/services/etiquetas.service"
import type { EtiquetasRepository } from "@/modules/dietas-cocina/types/repositories"

export const etiquetasRepositoryHttp: EtiquetasRepository = {
  listar: listarEtiquetas,
  buscarPorCodigo: async (codigo) => {
    const etiqueta = await buscarEtiquetaPorCodigoSafe(codigo)
    if (!etiqueta) throw new Error(`Etiqueta ${codigo} no encontrada`)
    return etiqueta
  },
  generar: generarEtiquetas,
  marcarImpresas: marcarEtiquetasImpresas,
  marcarReimpresas: marcarEtiquetasReimpresas,
  confirmarPreEntrega: confirmarPreEntregaEtiqueta,
  confirmarEntrega: confirmarEntregaEtiqueta,
  registrarDevolucion: registrarDevolucionEtiqueta,
  subirFotoDevolucion,
  descargarPdf: descargarPdfEtiquetas,
}
