import type { OrdenCocina } from "@/modules/dietas-cocina/cocina/datos/mockCocina"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/etiquetas/datos/mockEntregasEnfermera"

function sincronizarOrdenConEtiqueta(
  orden: OrdenCocina,
  etiqueta: EtiquetaEnfermera,
): OrdenCocina {
  return {
    ...orden,
    estadoLogistica: etiqueta.estadoLogistica,
    etiquetaImpresa:
      etiqueta.estado === "impresa" ||
      etiqueta.estado === "reimpresa" ||
      etiqueta.estadoLogistica === "impresa",
    etiquetaGenerada: true,
    etiquetaId: etiqueta.id,
  }
}

export interface InconsistenciaSeed {
  tipo:
    | "orden_sin_etiqueta"
    | "etiqueta_sin_orden"
    | "paciente_distinto"
    | "comida_distinta"
    | "estado_logistico_invalido"
    | "etiqueta_prematura"
  ordenId?: string
  etiquetaId?: string
  detalle: string
}

/** Detecta desalineaciones entre seeds de cocina y etiquetas. */
export function validarSeedsCocinaEtiquetas(
  ordenes: OrdenCocina[],
  etiquetas: EtiquetaEnfermera[],
): InconsistenciaSeed[] {
  const mapEtiquetas = new Map(etiquetas.map((e) => [e.id, e]))
  const idsEtiquetaEnOrdenes = new Set(
    ordenes.map((o) => o.etiquetaId).filter(Boolean) as string[],
  )
  const inconsistencias: InconsistenciaSeed[] = []

  for (const orden of ordenes) {
    if (orden.etiquetaGenerada && !orden.etiquetaId) {
      inconsistencias.push({
        tipo: "orden_sin_etiqueta",
        ordenId: orden.id,
        detalle: `Orden ${orden.id} marcada con etiquetaGenerada pero sin etiquetaId`,
      })
    }
    if (
      orden.etiquetaGenerada &&
      orden.estadoCocina !== "lista" &&
      orden.estadoCocina !== "despachada"
    ) {
      inconsistencias.push({
        tipo: "etiqueta_prematura",
        ordenId: orden.id,
        detalle: `Orden ${orden.id} tiene etiqueta pero estado ${orden.estadoCocina}`,
      })
    }
    if (!orden.etiquetaId) continue
    const etq = mapEtiquetas.get(orden.etiquetaId)
    if (!etq) {
      inconsistencias.push({
        tipo: "orden_sin_etiqueta",
        ordenId: orden.id,
        etiquetaId: orden.etiquetaId,
        detalle: `Orden ${orden.id} referencia etiqueta inexistente ${orden.etiquetaId}`,
      })
      continue
    }
    if (orden.pacienteId !== etq.pacienteId) {
      inconsistencias.push({
        tipo: "paciente_distinto",
        ordenId: orden.id,
        etiquetaId: etq.id,
        detalle: `Paciente distinto: orden=${orden.pacienteId} etiqueta=${etq.pacienteId}`,
      })
    }
    if (orden.comida !== etq.comida) {
      inconsistencias.push({
        tipo: "comida_distinta",
        ordenId: orden.id,
        etiquetaId: etq.id,
        detalle: `Comida distinta: orden=${orden.comida} etiqueta=${etq.comida}`,
      })
    }
    if (
      (etq.estadoLogistica === "pre_entregada" ||
        etq.estadoLogistica === "entregada" ||
        etq.estadoLogistica === "devuelta") &&
      orden.estadoCocina !== "despachada"
    ) {
      inconsistencias.push({
        tipo: "estado_logistico_invalido",
        ordenId: orden.id,
        etiquetaId: etq.id,
        detalle: `Etiqueta ${etq.estadoLogistica} pero orden ${orden.estadoCocina}`,
      })
    }
  }

  for (const etiqueta of etiquetas) {
    if (!idsEtiquetaEnOrdenes.has(etiqueta.id)) continue
    const orden = ordenes.find((o) => o.etiquetaId === etiqueta.id)
    if (!orden) {
      inconsistencias.push({
        tipo: "etiqueta_sin_orden",
        etiquetaId: etiqueta.id,
        detalle: `Etiqueta ${etiqueta.id} no tiene orden vinculada`,
      })
    }
  }

  return inconsistencias
}

/** Alinea órdenes y etiquetas seed para que compartan estado logístico coherente. */
export function sincronizarSeedsCocinaEtiquetas(
  ordenes: OrdenCocina[],
  etiquetas: EtiquetaEnfermera[],
): { ordenes: OrdenCocina[]; etiquetas: EtiquetaEnfermera[] } {
  const mapEtiquetas = new Map(etiquetas.map((e) => [e.id, e]))

  const ordenesSync = ordenes.map((orden) => {
    if (!orden.etiquetaId) return orden
    const etq = mapEtiquetas.get(orden.etiquetaId)
    return etq ? sincronizarOrdenConEtiqueta(orden, etq) : orden
  })

  if (import.meta.env.DEV) {
    const inconsistencias = validarSeedsCocinaEtiquetas(ordenesSync, etiquetas)
    if (inconsistencias.length > 0) {
      console.warn("[dietas-cocina] Seeds inconsistentes:", inconsistencias)
    }
  }

  return { ordenes: ordenesSync, etiquetas }
}

export function crearEstadoInicialCicloBandejas(
  ordenesIniciales: OrdenCocina[],
  etiquetasIniciales: EtiquetaEnfermera[],
) {
  return sincronizarSeedsCocinaEtiquetas(ordenesIniciales, etiquetasIniciales)
}
