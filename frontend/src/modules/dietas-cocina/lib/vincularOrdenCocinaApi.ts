import { mapChecklistFromApi, checklistMasCompleto } from "@/modules/dietas-cocina/api/mappers/ordenCocina.mapper"
import {
  crearOrdenCocina,
  listarOrdenesCocina,
} from "@/modules/dietas-cocina/api/services/ordenes-cocina-api.service"
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

async function buscarOrdenApiPorDieta(
  dietaId: string,
  comida: OrdenCocina["comida"],
): Promise<{ id: string; checklist: ChecklistItem[] } | null> {
  const ordenes = await listarOrdenesCocina({
    fecha: fechaOperativaHoy(),
    comida: mapearComidaApi(comida),
  })
  const match = ordenes.find((orden) =>
    (orden.dietasIds ?? []).map(String).includes(dietaId),
  )
  if (!match) return null
  return {
    id: String(match.id),
    checklist: mapChecklistFromApi(match.checklist),
  }
}

/** Crea o reutiliza la orden de cocina en el API para cada bandeja local. */
export async function vincularOrdenesCocinaEnApi(
  ordenes: OrdenCocina[],
): Promise<OrdenCocinaVinculadaApi[]> {
  const resultados: OrdenCocinaVinculadaApi[] = []
  const errores: string[] = []

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

    try {
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
    } catch (error) {
      // La dieta pudo haber sido vinculada en otra sesión o ya no está Confirmada.
      try {
        const recuperada = await buscarOrdenApiPorDieta(orden.id, orden.comida)
        if (recuperada) {
          guardarOrdenCocinaApiId(orden.id, recuperada.id)
          guardarChecklistOrden(orden.id, recuperada.checklist)
          resultados.push({
            ordenId: orden.id,
            ordenApiId: recuperada.id,
            checklist: checklistMasCompleto(orden.checklist, recuperada.checklist),
          })
          continue
        }
      } catch {
        // Se reporta el error original de creación.
      }

      const mensaje =
        error instanceof Error ? error.message : "No se pudo vincular con cocina"
      errores.push(`${orden.paciente}: ${mensaje}`)
    }
  }

  if (resultados.length === 0 && errores.length > 0) {
    throw new Error(
      `No se pudo vincular ninguna bandeja con cocina. ${errores.slice(0, 3).join(" · ")}`,
    )
  }

  if (errores.length > 0 && resultados.length < ordenes.length) {
    // Continúa con las vinculadas; el caller valida cobertura.
    console.warn("[vincularOrdenesCocinaEnApi] parcial:", errores.join(" | "))
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
