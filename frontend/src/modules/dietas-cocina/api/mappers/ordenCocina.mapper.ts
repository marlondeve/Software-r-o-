import type { OrdenCocinaApiDto, ChecklistItemApiDto } from "@/modules/dietas-cocina/types/api-dtos"
import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"
import type { EstadoCocina, EstadoDieta } from "@/modules/dietas-cocina/types/enums"
import type { OrdenCocina, ChecklistItem } from "@/modules/dietas-cocina/types/kitchen"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"
import {
  cargarChecklistOrden,
  cargarOrdenCocinaApiId,
} from "@/modules/dietas-cocina/lib/cocinaOverridesStorage"

const CHECKLIST_INICIAL: ChecklistItem[] = [
  { id: "ck-1", label: "Receta revisada", obligatorio: false, completado: false },
  { id: "ck-2", label: "Alergias revisadas", obligatorio: true, completado: false },
  { id: "ck-3", label: "Aislamiento identificado", obligatorio: true, completado: false },
  { id: "ck-4", label: "Porción verificada", obligatorio: false, completado: false },
]

function checklistInicial(filaId: string): ChecklistItem[] {
  const persistido = cargarChecklistOrden(filaId)
  if (persistido?.length) {
    return persistido.map((item) => ({ ...item }))
  }
  return CHECKLIST_INICIAL.map((item) => ({ ...item }))
}

const ESTADOS_EN_COCINA = new Set<EstadoDieta>([
  "confirmada",
  "por-iniciar",
  "preparando",
  "en-preparacion",
  "lista-despacho",
  "despachada",
  "recibida",
  "devuelta",
  "cancelada",
])

export function mapEstadoDietaToEstadoCocina(estado: EstadoDieta): EstadoCocina {
  switch (estado) {
    case "preparando":
    case "en-preparacion":
      return "en_preparacion"
    case "lista-despacho":
      return "lista"
    case "despachada":
    case "recibida":
    case "devuelta":
      return "despachada"
    case "cancelada":
      return "cancelada"
    default:
      return "por_iniciar"
  }
}

function parseAlergias(alergias: string): string[] {
  if (!alergias.trim()) return []
  return alergias.split(",").map((item) => item.trim()).filter(Boolean)
}

export function mapFilaDietaToOrdenCocina(
  fila: FilaDieta,
  etiqueta?: EtiquetaEnfermera,
): OrdenCocina | null {
  if (!ESTADOS_EN_COCINA.has(fila.estado)) return null
  if (!fila.tipoDieta || !fila.consistencia) return null

  const estadoCocina = mapEstadoDietaToEstadoCocina(fila.estado)

  return {
    id: fila.id,
    ordenCocinaApiId:
      fila.ordenCocinaId ??
      cargarOrdenCocinaApiId(fila.id),
    etiquetaId: etiqueta?.id,
    pacienteId: fila.pacienteId,
    paciente: fila.paciente,
    edad: fila.edad,
    pabellon: fila.pabellon,
    habitacion: fila.habitacion,
    tipoDieta: fila.tipoDieta,
    consistencia: fila.consistencia,
    comida: fila.comida,
    aislado: fila.aislado ?? fila.aislamiento !== "Ninguno",
    alergias: fila.alergico ? parseAlergias(fila.alergias) : [],
    observaciones: fila.observaciones,
    estadoCocina,
    estadoLogistica: etiqueta?.estadoLogistica,
    etiquetaImpresa:
      etiqueta?.estado === "impresa" ||
      etiqueta?.estado === "reimpresa" ||
      etiqueta?.estadoLogistica === "impresa",
    etiquetaGenerada: Boolean(etiqueta),
    checklist: checklistInicial(fila.id),
  }
}

function claveEtiqueta(pacienteId: string, comida: string): string {
  return `${pacienteId}::${comida}`
}

const RANK_ESTADO_COCINA: Record<EstadoCocina, number> = {
  por_iniciar: 0,
  en_preparacion: 1,
  lista: 2,
  despachada: 3,
  cancelada: -1,
}

function preferirEstadoCocina(a: EstadoCocina, b: EstadoCocina): EstadoCocina {
  if (a === "cancelada") return a
  if (b === "cancelada") return b
  return (RANK_ESTADO_COCINA[a] ?? 0) >= (RANK_ESTADO_COCINA[b] ?? 0) ? a : b
}

/** Conserva avance local (checklist, estados) al sincronizar desde censo o filas. */
export function fusionarOrdenesCocina(
  prev: OrdenCocina[],
  incoming: OrdenCocina[],
): OrdenCocina[] {
  const prevById = new Map(prev.map((orden) => [orden.id, orden]))
  const incomingIds = new Set(incoming.map((orden) => orden.id))

  const merged = incoming.map((orden) => {
    const existente = prevById.get(orden.id)
    if (!existente) return orden
    return {
      ...orden,
      checklist: existente.checklist,
      ordenCocinaApiId: existente.ordenCocinaApiId ?? orden.ordenCocinaApiId,
      estadoCocina: preferirEstadoCocina(existente.estadoCocina, orden.estadoCocina),
      etiquetaId: existente.etiquetaId ?? orden.etiquetaId,
      etiquetaImpresa: existente.etiquetaImpresa || orden.etiquetaImpresa,
      etiquetaGenerada:
        existente.etiquetaGenerada ||
        orden.etiquetaGenerada ||
        Boolean(existente.etiquetaId ?? orden.etiquetaId),
      estadoLogistica: existente.estadoLogistica ?? orden.estadoLogistica,
    }
  })

  const extras = prev.filter(
    (orden) => !incomingIds.has(orden.id) && orden.estadoCocina !== "cancelada",
  )

  return [...merged, ...extras]
}

function mapEstadoOrdenApi(estado: string): EstadoCocina | undefined {
  const normalizado = estado.toLowerCase().replace(/\s+/g, "")
  if (normalizado.includes("preparacion")) return "en_preparacion"
  if (normalizado === "completada" || normalizado === "lista") return "lista"
  if (normalizado === "cancelada") return "cancelada"
  if (normalizado.includes("ruta") || normalizado.includes("despach")) return "despachada"
  if (normalizado === "pendiente" || normalizado === "creada") return "por_iniciar"
  return undefined
}

function mapChecklistFromApi(items?: ChecklistItemApiDto[]): ChecklistItem[] {
  if (!items?.length) return CHECKLIST_INICIAL.map((item) => ({ ...item }))
  return items.map((item) => ({
    id: item.id,
    label: item.label ?? CHECKLIST_INICIAL.find((c) => c.id === item.id)?.label ?? item.id,
    obligatorio: item.obligatorio ?? CHECKLIST_INICIAL.find((c) => c.id === item.id)?.obligatorio ?? false,
    completado: item.completado,
  }))
}

/** Enlaza IDs y estados reales del API de órdenes de cocina con las filas del censo. */
export function enriquecerOrdenesConApi(
  ordenes: OrdenCocina[],
  ordenesApi: OrdenCocinaApiDto[],
): OrdenCocina[] {
  const ordenesPorId = new Map(ordenesApi.map((orden) => [String(orden.id), orden]))
  const filaIdPorOrdenApi = new Map<string, string>()

  for (const ordenApi of ordenesApi) {
    const apiId = String(ordenApi.id)
    for (const dieta of ordenApi.dietas ?? []) {
      const filaId = String((dieta as { id?: string }).id ?? "")
      if (filaId) filaIdPorOrdenApi.set(filaId, apiId)
    }
  }

  return ordenes.map((orden) => {
    const apiId = orden.ordenCocinaApiId ?? filaIdPorOrdenApi.get(orden.id)
    if (!apiId) return orden

    const ordenApi = ordenesPorId.get(apiId)
    const estadoApi = ordenApi?.estado
      ? mapEstadoOrdenApi(String(ordenApi.estado))
      : undefined

    return {
      ...orden,
      ordenCocinaApiId: apiId,
      checklist: ordenApi?.checklist
        ? mapChecklistFromApi(ordenApi.checklist)
        : orden.checklist,
      ...(estadoApi
        ? { estadoCocina: preferirEstadoCocina(orden.estadoCocina, estadoApi) }
        : {}),
    }
  })
}

export function mapFilasDietasToOrdenesCocina(
  filas: FilaDieta[],
  etiquetas: EtiquetaEnfermera[] = [],
): OrdenCocina[] {
  const etiquetasPorClave = new Map(
    etiquetas.map((etiqueta) => [
      claveEtiqueta(etiqueta.pacienteId, etiqueta.comida),
      etiqueta,
    ]),
  )
  const etiquetasPorFila = new Map(
    etiquetas
      .filter((etiqueta) => etiqueta.filaDietaId)
      .map((etiqueta) => [etiqueta.filaDietaId!, etiqueta]),
  )

  const ordenes: OrdenCocina[] = []
  for (const fila of filas) {
    const etiqueta =
      etiquetasPorFila.get(fila.id) ??
      (fila.ordenCocinaId
        ? etiquetas.find((item) => item.filaDietaId === fila.id)
        : undefined) ??
      etiquetasPorClave.get(claveEtiqueta(fila.pacienteId, fila.comida))
    const orden = mapFilaDietaToOrdenCocina(fila, etiqueta)
    if (orden) ordenes.push(orden)
  }
  return ordenes
}
