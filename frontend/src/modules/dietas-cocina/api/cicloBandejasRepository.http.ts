import { cargarCicloBandejas, guardarCicloBandejas } from "@/modules/dietas-cocina/lib/cicloBandejasStorage"
import type {
  CicloBandejasRepository,
  EstadoCicloBandejas,
} from "@/modules/dietas-cocina/api/cicloBandejasRepository"
import { buscarEtiquetaPorCodigo } from "@/modules/dietas-cocina/etiquetas/lib/buscarEtiquetaPorCodigo"

/** Stub HTTP con fallback a storage local hasta tener backend real. */
export const cicloBandejasRepositoryHttp: CicloBandejasRepository = {
  async cargar(): Promise<EstadoCicloBandejas | null> {
    // TODO: GET /api/dietas-cocina/ciclo-bandejas
    return cargarCicloBandejas()
  },
  async guardar(estado: EstadoCicloBandejas): Promise<void> {
    // TODO: PUT /api/dietas-cocina/ciclo-bandejas
    guardarCicloBandejas(estado)
  },
  buscarEtiquetaPorCodigo(etiquetas, codigo) {
    return buscarEtiquetaPorCodigo(etiquetas, codigo)
  },
}
