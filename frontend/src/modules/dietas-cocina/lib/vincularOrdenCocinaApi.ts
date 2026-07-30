import { mapChecklistFromApi, checklistMasCompleto } from "@/modules/dietas-cocina/api/mappers/ordenCocina.mapper"
import { crearOrdenCocina } from "@/modules/dietas-cocina/api/services/ordenes-cocina-api.service"
import { fechaOperativaHoy, mapearComidaApi } from "@/modules/dietas-cocina/api/utils"
import {
  cargarOrdenCocinaApiId,
  guardarChecklistOrden,
  guardarOrdenCocinaApiId,
} from "@/modules/dietas-cocina/lib/cocinaOverridesStorage"
import type { OrdenCocina, ChecklistItem } from "@/modules/dietas-cocina/types/kitchen"

export interface OrdenCocinaVinculadaApi {
  ordenId: string
  ordenApiId: string
  checklist: ChecklistItem[]
}

/** Crea o reutiliza la orden de cocina en el API para cada bandeja local. */
export async function vincularOrdenesCocinaEnApi(
  ordenes: OrdenCocina[],
): Promise<OrdenCocinaVinculadaApi[]> {
  const resultados: OrdenCocinaVinculadaApi[] = []

  for (const orden of ordenes) {
    const existente = orden.ordenCocinaApiId ?? cargarOrdenCocinaApiId(orden.id)
    if (existente) {
      resultados.push({
        ordenId: orden.id,
        ordenApiId: existente,
        checklist: orden.checklist,
      })
      continue
    }

    const ordenApi = await crearOrdenCocina({
      fechaOperativa: fechaOperativaHoy(),
      comida: mapearComidaApi(orden.comida),
      dietasIds: [orden.id],
    })

    const ordenApiId = String(ordenApi.id)
    const checklist = mapChecklistFromApi(ordenApi.checklist)
    guardarOrdenCocinaApiId(orden.id, ordenApiId)
    guardarChecklistOrden(orden.id, checklist)
    resultados.push({ ordenId: orden.id, ordenApiId, checklist })
  }

  return resultados
}

export function aplicarVinculoOrdenesEnApi(
  ordenes: OrdenCocina[],
  vinculos: OrdenCocinaVinculadaApi[],
): OrdenCocina[] {
  if (vinculos.length === 0) return ordenes
  const porOrdenId = new Map(vinculos.map((item) => [item.ordenId, item]))

  return ordenes.map((orden) => {
    const vinculo = porOrdenId.get(orden.id)
    if (!vinculo) return orden
    return {
      ...orden,
      ordenCocinaApiId: vinculo.ordenApiId,
      checklist: checklistMasCompleto(orden.checklist, vinculo.checklist),
      estadoCocina:
        orden.estadoCocina === "cancelada"
          ? orden.estadoCocina
          : orden.estadoCocina === "por_iniciar"
            ? "en_preparacion"
            : orden.estadoCocina,
    }
  })
}
