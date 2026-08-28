import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr"

import { apiBaseUrl } from "@/api/config"
import { fechaOperativaHoy, mapearComidaApi } from "@/modules/dietas-cocina/api/utils"
import { obtenerComidaActivaOperativa } from "@/modules/dietas-cocina/config/operativa-defaults"
import { EVENTOS_DIETAS_COCINA, emitirEventoDietasCocina } from "@/modules/dietas-cocina/realtime/dietasCocinaEventos"

export function origenHubDietasCocina(): string {
  const base = apiBaseUrl.replace(/\/+$/, "")
  const sinApi = base.replace(/\/api\/v\d+$/i, "")
  if (sinApi.startsWith("http://") || sinApi.startsWith("https://")) return sinApi
  if (typeof window !== "undefined") return window.location.origin
  return sinApi || ""
}

let conexion: HubConnection | null = null
let arranque: Promise<HubConnection> | null = null

function registrarHandlers(hub: HubConnection): void {
  hub.on(EVENTOS_DIETAS_COCINA.FilaActualizada, (payload: unknown) => {
    emitirEventoDietasCocina({ tipo: EVENTOS_DIETAS_COCINA.FilaActualizada, payload })
  })
  hub.on(EVENTOS_DIETAS_COCINA.CensoActualizado, (payload: unknown) => {
    const registro = (payload ?? {}) as { fechaOperativa?: string; comida?: string }
    emitirEventoDietasCocina({
      tipo: EVENTOS_DIETAS_COCINA.CensoActualizado,
      payload: registro,
    })
  })
  hub.on(EVENTOS_DIETAS_COCINA.OrdenActualizada, (payload: unknown) => {
    emitirEventoDietasCocina({ tipo: EVENTOS_DIETAS_COCINA.OrdenActualizada, payload })
  })
  hub.on(EVENTOS_DIETAS_COCINA.EtiquetasActualizadas, (payload: unknown) => {
    emitirEventoDietasCocina({
      tipo: EVENTOS_DIETAS_COCINA.EtiquetasActualizadas,
      payload,
    })
  })
  hub.on(EVENTOS_DIETAS_COCINA.ParametrosActualizados, () => {
    emitirEventoDietasCocina({ tipo: EVENTOS_DIETAS_COCINA.ParametrosActualizados })
  })
  hub.on(EVENTOS_DIETAS_COCINA.CatalogoActualizado, () => {
    emitirEventoDietasCocina({ tipo: EVENTOS_DIETAS_COCINA.CatalogoActualizado })
  })
  hub.on(EVENTOS_DIETAS_COCINA.ConciliacionActualizada, () => {
    emitirEventoDietasCocina({ tipo: EVENTOS_DIETAS_COCINA.ConciliacionActualizada })
  })
  hub.on(EVENTOS_DIETAS_COCINA.PermisosActualizados, () => {
    emitirEventoDietasCocina({ tipo: EVENTOS_DIETAS_COCINA.PermisosActualizados })
  })
}

async function unirseAComida(hub: HubConnection): Promise<void> {
  try {
    await hub.invoke(
      "UnirseAComida",
      mapearComidaApi(obtenerComidaActivaOperativa()),
      fechaOperativaHoy(),
    )
  } catch {
    /* el grupo operativo ya se asigna en OnConnectedAsync */
  }
}

export function conexionDietasCocinaActiva(): boolean {
  return conexion?.state === HubConnectionState.Connected
}

async function detenerConexionActual(): Promise<void> {
  const actual = conexion
  conexion = null
  if (!actual) return
  try {
    await actual.stop()
  } catch {
    /* ignore */
  }
}

export async function conectarHubDietasCocina(): Promise<HubConnection> {
  if (conexion?.state === HubConnectionState.Connected) return conexion
  if (conexion?.state === HubConnectionState.Connecting && arranque) return arranque
  if (arranque) return arranque

  if (conexion) await detenerConexionActual()

  arranque = (async () => {
    const hub = new HubConnectionBuilder()
      .withUrl(`${origenHubDietasCocina()}/hubs/dietas-cocina`, {
        withCredentials: true,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build()

    registrarHandlers(hub)
    hub.onreconnected(() => {
      void unirseAComida(hub)
    })
    await hub.start()
    await unirseAComida(hub)
    conexion = hub
    return hub
  })()

  try {
    return await arranque
  } catch (error) {
    conexion = null
    throw error
  } finally {
    arranque = null
  }
}

export async function desconectarHubDietasCocina(): Promise<void> {
  arranque = null
  await detenerConexionActual()
}
