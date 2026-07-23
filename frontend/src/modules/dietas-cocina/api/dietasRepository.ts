import type { CrearOrdenDesdeDietaInput } from "@/modules/dietas-cocina/context/CicloBandejasContext"

export interface DietasRepository {
  confirmarDieta(filaId: string): Promise<void>
  crearOrdenDesdeDieta(input: CrearOrdenDesdeDietaInput): Promise<string>
}

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
