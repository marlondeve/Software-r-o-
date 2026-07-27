import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"
import type { CrearOrdenDesdeDietaInput } from "@/modules/dietas-cocina/types/tray-cycle"
import type { DietasRepository } from "@/modules/dietas-cocina/types/repositories"
import {
  confirmarDieta,
  obtenerDetalleDieta,
} from "@/modules/dietas-cocina/api/services/dietas.service"

export const dietasRepositoryHttp: DietasRepository = {
  async confirmarDieta(filaId: string): Promise<FilaDieta> {
    return confirmarDieta(filaId)
  },
  async crearOrdenDesdeDieta(input: CrearOrdenDesdeDietaInput): Promise<string> {
    if (!input.id) {
      throw new Error("id de dieta requerido para crear orden de cocina")
    }
    const detalle = await obtenerDetalleDieta(input.id)
    return detalle.ordenCocinaId ?? `ord-api-${input.id}`
  },
}
