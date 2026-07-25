import type { DietasRepository } from "@/modules/dietas-cocina/types/repositories"
import type { CrearOrdenDesdeDietaInput } from "@/modules/dietas-cocina/types/tray-cycle"

/** Stub HTTP — reemplazar cuando exista backend de dietas. */
export const dietasRepositoryHttp: DietasRepository = {
  async confirmarDieta(_filaId: string): Promise<void> {
    // TODO: POST /api/dietas-cocina/dietas/:id/confirmar
  },
  async crearOrdenDesdeDieta(_input: CrearOrdenDesdeDietaInput): Promise<string> {
    // TODO: POST /api/dietas-cocina/ordenes
    return `ord-api-${Date.now()}`
  },
}
