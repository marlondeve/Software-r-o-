import {
  actualizarOperacionBandeja,
  eliminarOperacionBandeja,
  listarOperacionesPendientes,
} from "@/modules/dietas-cocina/lib/bandejasOutbox"
import {
  eliminarFotoDevolucionOffline,
  leerFotoDevolucionOffline,
} from "@/modules/dietas-cocina/lib/bandejasFotosDb"
import {
  confirmarEntregaEtiqueta,
  confirmarPreEntregaEtiqueta,
  registrarDevolucionEtiqueta,
  subirFotoDevolucion,
} from "@/modules/dietas-cocina/api/services/etiquetas.service"
import {
  actualizarEstadoOrdenCocina,
  actualizarChecklistOrdenCocina,
} from "@/modules/dietas-cocina/api/services/ordenes-cocina-api.service"
import { checklistMasCompleto } from "@/modules/dietas-cocina/api/mappers/ordenCocina.mapper"
import {
  base64AFile,
} from "@/modules/dietas-cocina/lib/bandejasOutbox"
import { cargarOrdenCocinaApiId } from "@/modules/dietas-cocina/lib/cocinaOverridesStorage"
import type { OrdenCocina } from "@/modules/dietas-cocina/types/kitchen"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"
import type { OperacionBandejaPendiente } from "@/modules/dietas-cocina/types/tray-cycle"
import { esErrorConflictoSync, esErrorRed } from "@/lib/esErrorRed"

function resolverOrdenPorEtiquetaId(
  etiquetaId: string,
  ordenes: OrdenCocina[],
  etiquetas: EtiquetaEnfermera[],
): OrdenCocina | undefined {
  const etiqueta = etiquetas.find((e) => e.id === etiquetaId)
  if (!etiqueta) return undefined

  const porEtiquetaId = ordenes.find((o) => o.etiquetaId === etiquetaId)
  if (porEtiquetaId) return porEtiquetaId

  if (etiqueta.filaDietaId) {
    const porFila = ordenes.find((o) => o.id === etiqueta.filaDietaId)
    if (porFila) return porFila
  }

  if (etiqueta.ordenCocinaId) {
    return ordenes.find((o) => o.ordenCocinaApiId === etiqueta.ordenCocinaId)
  }

  return undefined
}

function ordenConChecklistObligatorioForzado(orden: OrdenCocina): OrdenCocina {
  return {
    ...orden,
    checklist: orden.checklist.map((item) =>
      item.obligatorio ? { ...item, completado: true } : item,
    ),
  }
}

async function completarOrdenesCocinaEnApi(
  ordenes: OrdenCocina[],
): Promise<void> {
  const porApiId = new Map<string, OrdenCocina>()
  for (const orden of ordenes) {
    const apiId = orden.ordenCocinaApiId ?? cargarOrdenCocinaApiId(orden.id)
    if (!apiId) continue
    const ordenSync = ordenConChecklistObligatorioForzado(orden)
    const previo = porApiId.get(apiId)
    porApiId.set(
      apiId,
      previo
        ? {
            ...previo,
            checklist: checklistMasCompleto(previo.checklist, ordenSync.checklist),
          }
        : ordenSync,
    )
  }

  for (const [apiId, orden] of porApiId) {
    if (orden.checklist.length > 0) {
      await actualizarChecklistOrdenCocina(apiId, {
        items: orden.checklist.map((item) => ({
          id: item.id,
          completado: item.completado,
        })),
      })
    }
    await actualizarEstadoOrdenCocina(apiId, { estado: "Completada" })
  }
}

async function completarOrdenesPorEtiquetaIdsEnApi(
  etiquetaIds: string[],
  ordenes: OrdenCocina[],
  etiquetas: EtiquetaEnfermera[],
): Promise<void> {
  const ordenesVinculadas: OrdenCocina[] = []
  const apiIdsDirectos: string[] = []

  for (const etiquetaId of etiquetaIds) {
    const orden = resolverOrdenPorEtiquetaId(etiquetaId, ordenes, etiquetas)
    if (orden) {
      ordenesVinculadas.push(orden)
      continue
    }

    const etiqueta = etiquetas.find((e) => e.id === etiquetaId)
    if (etiqueta?.ordenCocinaId) {
      apiIdsDirectos.push(etiqueta.ordenCocinaId)
    }
  }

  if (ordenesVinculadas.length > 0) {
    await completarOrdenesCocinaEnApi(ordenesVinculadas)
  }

  for (const apiId of apiIdsDirectos) {
    await actualizarEstadoOrdenCocina(apiId, { estado: "Completada" })
  }
}

async function resolverFotoDevolucion(
  operacion: Extract<OperacionBandejaPendiente, { tipo: "devolucion" }>,
): Promise<File | null> {
  if (operacion.fotoRefId) {
    return leerFotoDevolucionOffline(operacion.fotoRefId)
  }
  if (
    operacion.fotoBase64 &&
    operacion.fotoNombre &&
    operacion.fotoTipo
  ) {
    return base64AFile(
      operacion.fotoBase64,
      operacion.fotoNombre,
      operacion.fotoTipo,
    )
  }
  return null
}

export interface ReplayBandejaContexto {
  ordenes: OrdenCocina[]
  etiquetas: EtiquetaEnfermera[]
}

export async function replayOperacionBandeja(
  operacion: OperacionBandejaPendiente,
  contexto: ReplayBandejaContexto,
): Promise<void> {
  switch (operacion.tipo) {
    case "pre_entrega": {
      await completarOrdenesPorEtiquetaIdsEnApi(
        [operacion.etiquetaId],
        contexto.ordenes,
        contexto.etiquetas,
      )
      await confirmarPreEntregaEtiqueta(operacion.etiquetaId, operacion.recibidoPor)
      break
    }
    case "entrega": {
      await confirmarEntregaEtiqueta(operacion.etiquetaId)
      break
    }
    case "devolucion": {
      await registrarDevolucionEtiqueta(operacion.etiquetaId, {
        motivo: operacion.payload.motivo,
        estadoDieta: operacion.payload.estadoDieta ?? "Devuelta",
        observaciones: operacion.payload.observaciones,
      })
      const archivo = await resolverFotoDevolucion(operacion)
      if (archivo) {
        await subirFotoDevolucion(operacion.etiquetaId, archivo)
      }
      break
    }
  }
}

export async function limpiarAdjuntosOperacion(
  operacion: OperacionBandejaPendiente,
): Promise<void> {
  if (operacion.tipo === "devolucion" && operacion.fotoRefId) {
    await eliminarFotoDevolucionOffline(operacion.fotoRefId)
  }
}

export interface ResultadoSyncBandejas {
  sincronizadas: number
  fallidas: number
  conflictos: number
  detenidoPorRed: boolean
}

export async function sincronizarOutboxBandejas(
  contexto: ReplayBandejaContexto,
): Promise<ResultadoSyncBandejas> {
  const pendientes = listarOperacionesPendientes().filter(
    (op) => op.estadoSync !== "conflicto",
  )
  let sincronizadas = 0
  let fallidas = 0
  let conflictos = 0

  for (const operacion of pendientes) {
    try {
      await replayOperacionBandeja(operacion, contexto)
      await limpiarAdjuntosOperacion(operacion)
      eliminarOperacionBandeja(operacion.clientId)
      sincronizadas++
    } catch (error) {
      if (esErrorRed(error)) {
        return { sincronizadas, fallidas, conflictos, detenidoPorRed: true }
      }

      const mensaje =
        error instanceof Error ? error.message : "Error al sincronizar"

      if (esErrorConflictoSync(error)) {
        actualizarOperacionBandeja(operacion.clientId, {
          intentos: (operacion.intentos ?? 0) + 1,
          ultimoError: mensaje,
          estadoSync: "conflicto",
        })
        conflictos++
        continue
      }

      actualizarOperacionBandeja(operacion.clientId, {
        intentos: (operacion.intentos ?? 0) + 1,
        ultimoError: mensaje,
      })
      fallidas++

      if (operacion.tipo !== "pre_entrega") {
        const hayPreEntregaPendiente = pendientes.some(
          (op) =>
            op.clientId !== operacion.clientId &&
            op.etiquetaId === operacion.etiquetaId &&
            op.tipo === "pre_entrega",
        )
        if (hayPreEntregaPendiente) {
          break
        }
      }
    }
  }

  return { sincronizadas, fallidas, conflictos, detenidoPorRed: false }
}
