import { buscarEtiquetaPorCodigo } from "@/modules/dietas-cocina/etiquetas/lib/buscarEtiquetaPorCodigo"
import {
  cargarCicloBandejas,
  guardarCicloBandejas,
} from "@/modules/dietas-cocina/lib/cicloBandejasStorage"
import type {
  CicloBandejasRepository,
  EstadoCicloBandejas,
} from "@/modules/dietas-cocina/api/cicloBandejasRepository"

export const cicloBandejasRepositoryMock: CicloBandejasRepository = {
  async cargar(): Promise<EstadoCicloBandejas | null> {
    return cargarCicloBandejas()
  },
  async guardar(estado: EstadoCicloBandejas): Promise<void> {
    guardarCicloBandejas(estado)
  },
  buscarEtiquetaPorCodigo(etiquetas, codigo) {
    return buscarEtiquetaPorCodigo(etiquetas, codigo)
  },
}
