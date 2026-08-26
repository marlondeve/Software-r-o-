import { COMIDAS_TABS } from "@/modules/dietas-cocina/dietas/datos/mockDietas"
import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"
import type { EstadoDieta, TiempoComida } from "@/modules/dietas-cocina/types/enums"

const RANK_ESTADO: Partial<Record<EstadoDieta, number>> = {
  cancelada: -1,
  "no-solicitada": 0,
  guardado: 10,
  confirmada: 20,
  "por-iniciar": 30,
  preparando: 35,
  "en-preparacion": 40,
  "lista-despacho": 50,
  despachada: 60,
  recibida: 70,
  devuelta: 75,
  recogida: 80,
}

const ORDEN_COMIDA = new Map(
  COMIDAS_TABS.map((comida, indice) => [comida.id, indice]),
)

function rankEstado(estado: EstadoDieta): number {
  return RANK_ESTADO[estado] ?? 0
}

function preferirFilaMismaComida(a: FilaDieta, b: FilaDieta): FilaDieta {
  const rankA = rankEstado(a.estado)
  const rankB = rankEstado(b.estado)
  if (rankA !== rankB) return rankA >= rankB ? a : b
  return a.id.localeCompare(b.id) <= 0 ? a : b
}

/**
 * Otras comidas del mismo paciente hoy: una fila por comida, orden fijo del turno
 * (desayuno → … → merienda noche). Sin duplicados aunque el API traiga filas legadas.
 */
export function listarOtrasDietasPacienteHoy(
  dietasPaciente: FilaDieta[],
  filaActualId: string,
): FilaDieta[] {
  const porComida = new Map<TiempoComida, FilaDieta>()

  for (const fila of dietasPaciente) {
    if (fila.id === filaActualId) continue
    const previa = porComida.get(fila.comida)
    porComida.set(
      fila.comida,
      previa ? preferirFilaMismaComida(previa, fila) : fila,
    )
  }

  return [...porComida.values()].sort((a, b) => {
    const ia = ORDEN_COMIDA.get(a.comida) ?? Number.MAX_SAFE_INTEGER
    const ib = ORDEN_COMIDA.get(b.comida) ?? Number.MAX_SAFE_INTEGER
    if (ia !== ib) return ia - ib
    return a.id.localeCompare(b.id)
  })
}
