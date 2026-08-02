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

/** Conserva el estado más avanzado al sincronizar censo con datos locales. */
export function fusionarFilaDietaCenso(
  local: FilaDieta,
  remota: FilaDieta,
): FilaDieta {
  const preferida =
    rankEstado(remota.estado) >= rankEstado(local.estado) ? remota : local
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

export function fusionarFilasPorComida(
  filasActuales: FilaDieta[],
  filasApi: FilaDieta[],
  comida: TiempoComida,
): FilaDieta[] {
  const otrasComidas = filasActuales.filter((fila) => fila.comida !== comida)
  const localesComida = filasActuales.filter((fila) => fila.comida === comida)
  const mapaLocal = new Map(localesComida.map((fila) => [fila.pacienteId, fila]))

  const fusionadas = filasApi.map((remota) => {
    const local = mapaLocal.get(remota.pacienteId)
    if (!local) return remota
    mapaLocal.delete(remota.pacienteId)
    return fusionarFilaDietaCenso(local, remota)
  })

  return [...otrasComidas, ...fusionadas, ...mapaLocal.values()]
}
