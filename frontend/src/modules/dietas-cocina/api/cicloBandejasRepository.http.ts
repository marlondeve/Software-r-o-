import { cargarOrdenesCocinaDesdeCenso } from "@/modules/dietas-cocina/api/services/ordenes-cocina.service"
import type { EstadoCicloBandejas } from "@/modules/dietas-cocina/types/tray-cycle"
import type { CicloBandejasRepository } from "@/modules/dietas-cocina/types/repositories"
import { buscarEtiquetaPorCodigo } from "@/modules/dietas-cocina/etiquetas/lib/buscarEtiquetaPorCodigo"

export const cicloBandejasRepositoryHttp: CicloBandejasRepository = {
  async cargar(): Promise<EstadoCicloBandejas | null> {
    const { ordenes, etiquetas } = await cargarOrdenesCocinaDesdeCenso()
    return { ordenes, etiquetas }
  },
  async guardar(_estado: EstadoCicloBandejas): Promise<void> {
    // Las mutaciones se persisten vía endpoints de etiquetas individuales.
  },
  buscarEtiquetaPorCodigo(etiquetas, codigo) {
    return buscarEtiquetaPorCodigo(etiquetas, codigo)
  },
}
