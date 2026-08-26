import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"
import type { EstadoDieta, TiempoComida } from "@/modules/dietas-cocina/types/enums"

const RANK_ESTADO: Partial<Record<EstadoDieta, number>> = {
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
  cancelada: -10,
}

function rankEstado(estado: EstadoDieta): number {
  return RANK_ESTADO[estado] ?? 0
}

function normalizarDocumento(valor?: string | null): string {
  return String(valor ?? "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
}

/** Evita emparejar por documento cuando la clave extraída es demasiado corta. */
const LONGITUD_MINIMA_DOCUMENTO = 5

/** Clave estable: prioriza cédula; si no, el documento embebido en pacienteId. */
export function claveIdentidadPacienteDieta(
  fila: Pick<FilaDieta, "pacienteId" | "cedula">,
): string {
  const desdeCedula = normalizarDocumento(fila.cedula)
  if (desdeCedula.length >= LONGITUD_MINIMA_DOCUMENTO) return desdeCedula

  const raw = String(fila.pacienteId ?? "").trim()
  if (!raw) return ""

  // Evita tratar un GUID como documento (tiene varios guiones).
  const segmentos = raw.split("-")
  if (segmentos.length >= 5 && segmentos.every((s) => /^[0-9a-fA-F]+$/.test(s))) {
    return ""
  }

  const cedula = normalizarDocumento(
    segmentos.length > 1 ? segmentos.slice(1).join("-") : segmentos[0],
  )
  if (cedula.length >= LONGITUD_MINIMA_DOCUMENTO) return cedula
  return normalizarDocumento(raw)
}

type IdentidadFila = Pick<FilaDieta, "pacienteId" | "cedula">

export function mismaIdentidadPacienteDieta(
  a: IdentidadFila,
  b: IdentidadFila,
): boolean {
  if (a.pacienteId && b.pacienteId && a.pacienteId === b.pacienteId) return true

  const cedulaA = normalizarDocumento(a.cedula)
  const cedulaB = normalizarDocumento(b.cedula)
  if (
    cedulaA.length >= LONGITUD_MINIMA_DOCUMENTO &&
    cedulaB.length >= LONGITUD_MINIMA_DOCUMENTO &&
    cedulaA === cedulaB
  ) {
    return true
  }

  const ca = claveIdentidadPacienteDieta(a)
  const cb = claveIdentidadPacienteDieta(b)
  return Boolean(ca && cb && ca === cb)
}

type ResolverEstadoFila = (fila: FilaDieta) => EstadoDieta

function preferirFilaDuplicada(
  a: FilaDieta,
  b: FilaDieta,
  estadoDe: ResolverEstadoFila,
): FilaDieta {
  const estadoA = estadoDe(a)
  const estadoB = estadoDe(b)
  if (estadoA === "cancelada" && estadoB !== "cancelada") return b
  if (estadoB === "cancelada" && estadoA !== "cancelada") return a
  return rankEstado(estadoA) >= rankEstado(estadoB) ? a : b
}

/**
 * Una fila por paciente+comida: elimina duplicados legados del listado.
 * `resolverEstadoVisible` permite comparar por el estado que ve el usuario
 * (una fila puede mostrar «Despachada» por su orden de cocina).
 */
export function deduplicarFilasPorPacienteComida(
  filas: FilaDieta[],
  resolverEstadoVisible?: ResolverEstadoFila,
): FilaDieta[] {
  const estadoDe: ResolverEstadoFila = (fila) =>
    resolverEstadoVisible?.(fila) ?? fila.estado
  const resultado: FilaDieta[] = []
  for (const fila of filas) {
    const indice = resultado.findIndex(
      (item) =>
        item.comida === fila.comida && mismaIdentidadPacienteDieta(item, fila),
    )
    if (indice < 0) {
      resultado.push(fila)
      continue
    }
    resultado[indice] = preferirFilaDuplicada(resultado[indice], fila, estadoDe)
  }
  return resultado
}

/** Conserva el estado más avanzado al sincronizar censo con datos locales. */
export function fusionarFilaDietaCenso(
  local: FilaDieta,
  remota: FilaDieta,
): FilaDieta {
  // El censo decide la cancelación en ambos sentidos: la aplica por salida
  // clínica y la revierte por reingreso. El resto se resuelve por avance.
  const preferida =
    remota.estado === "cancelada" ||
    local.estado === "cancelada" ||
    rankEstado(remota.estado) >= rankEstado(local.estado)
      ? remota
      : local
  const complemento = preferida === remota ? local : remota

  return {
    ...complemento,
    ...preferida,
    id: remota.id || local.id,
    pacienteId: remota.pacienteId || local.pacienteId,
    comida: remota.comida || local.comida,
    paciente: remota.paciente,
    servicio: remota.servicio,
    pabellon: remota.pabellon,
    habitacion: remota.habitacion,
  }
}

/**
 * Fusiona el censo HIS de una comida con el estado local.
 * Ausencia en el snapshot no elimina la fila del turno (puede faltar por
 * pabellón, cama o indisponibilidad del HIS): el egreso real llega como
 * cancelada desde el API. Un censo vacío se trata como falta de datos.
 * Cancelaciones automáticas locales se descartan si el API ya trae al paciente
 * (reactivado o fila nueva), para no dejar «viejas» erróneas en el listado.
 */
export function fusionarFilasPorComida(
  filasActuales: FilaDieta[],
  filasApi: FilaDieta[],
  comida: TiempoComida,
): FilaDieta[] {
  if (filasApi.length === 0) return filasActuales

  const otrasComidas = filasActuales.filter((fila) => fila.comida !== comida)
  const localesComida = filasActuales.filter((fila) => fila.comida === comida)
  const mapaLocal = new Map(localesComida.map((fila) => [fila.pacienteId, fila]))

  function buscarLocal(remota: FilaDieta): FilaDieta | undefined {
    const exacta = mapaLocal.get(remota.pacienteId)
    if (exacta) return exacta
    return localesComida.find((local) => mismaIdentidadPacienteDieta(local, remota))
  }

  const fusionadas = filasApi.map((remota) => {
    const local = buscarLocal(remota)
    if (!local) return remota
    return fusionarFilaDietaCenso(local, remota)
  })

  const idsFusionados = new Set(fusionadas.map((fila) => fila.id))

  const conservadas = localesComida.filter((fila) => {
    if (idsFusionados.has(fila.id)) return false
    // El API ya trae al paciente (mismo id o cédula): no conservar duplicado local.
    if (filasApi.some((remota) => mismaIdentidadPacienteDieta(fila, remota))) {
      return false
    }
    return true
  })

  return deduplicarFilasPorPacienteComida([
    ...otrasComidas,
    ...fusionadas,
    ...conservadas,
  ])
}
