import type { OrdenCocina } from "@/modules/dietas-cocina/types/kitchen"
import type {
  DetalleConciliacion,
  FilaConciliacion,
  RegistroSistema,
} from "@/modules/dietas-cocina/types/reconciliation"
import type { EstadoConciliacion } from "@/modules/dietas-cocina/types/enums"
import {
  esSuministradaFcr,
  etiquetaComidaFcr,
  lineaContratoFcr,
  PLANTILLA_FCR,
} from "@/modules/dietas-cocina/lib/contratoCocina"
import { construirDetalleDesdeFila } from "@/modules/dietas-cocina/conciliacion/lib/detalleConciliacion"

function estadoAutomatico(
  cantidadSistema: number,
  cantidadCocina: number | null,
): EstadoConciliacion {
  if (cantidadCocina === null) {
    return cantidadSistema > 0 ? "pendiente" : "coincide"
  }
  if (cantidadCocina !== cantidadSistema) return "dif-cantidad"
  return "coincide"
}

function registrosDeGrupo(ordenes: OrdenCocina[]): RegistroSistema[] {
  return ordenes.map((orden) => ({
    fecha: "",
    paciente: orden.paciente,
    pabellon: orden.pabellon,
    habitacion: orden.habitacion || "—",
    estado: orden.estadoCocina,
    tipoClinico: orden.tipoDieta,
    lineaFcr: lineaContratoFcr(orden.tipoDieta),
    tieneEtiqueta: orden.etiquetaImpresa || orden.etiquetaGenerada,
  }))
}

/** Misma regla FCR que Reportes; cocina queda vacía hasta cargar planilla. */
export function construirConciliacionDesdeCiclo(
  ordenes: OrdenCocina[],
): FilaConciliacion[] {
  const porGrupo = new Map<string, OrdenCocina[]>()

  for (const orden of ordenes) {
    const cancelada = orden.estadoCocina === "cancelada"
    if (
      !esSuministradaFcr({
        comida: orden.comida,
        estadoCocina: orden.estadoCocina,
        cancelada,
        tieneEtiqueta: orden.etiquetaImpresa || orden.etiquetaGenerada,
      })
    ) {
      continue
    }
    const linea = lineaContratoFcr(orden.tipoDieta)
    const clave = `${orden.comida}|${linea}`
    const lista = porGrupo.get(clave) ?? []
    lista.push(orden)
    porGrupo.set(clave, lista)
  }

  return PLANTILLA_FCR.map((def) => {
    const clave = `${def.comida}|${def.linea}`
    const delGrupo = porGrupo.get(clave) ?? []
    const cantidadSistema = delGrupo.length
    return {
      id: clave,
      comida: etiquetaComidaFcr(def.comida),
      lineaFcr: def.linea,
      etiquetaPlanilla: def.etiqueta,
      tarifa: 0,
      cantidadSistema,
      cantidadCocina: null,
      valorSistema: 0,
      valorCocina: null,
      diferenciaCantidad: 0,
      diferenciaEconomica: null,
      sinEtiqueta: delGrupo.filter(
        (o) => !o.etiquetaImpresa && !o.etiquetaGenerada,
      ).length,
      huerfanas: 0,
      estado: estadoAutomatico(cantidadSistema, null),
    }
  })
}

export function construirDetallesConciliacionDesdeCiclo(
  ordenes: OrdenCocina[],
  filas: FilaConciliacion[],
): Record<string, DetalleConciliacion> {
  const porGrupo = new Map<string, OrdenCocina[]>()
  for (const orden of ordenes) {
    const cancelada = orden.estadoCocina === "cancelada"
    if (
      !esSuministradaFcr({
        comida: orden.comida,
        estadoCocina: orden.estadoCocina,
        cancelada,
        tieneEtiqueta: orden.etiquetaImpresa || orden.etiquetaGenerada,
      })
    ) {
      continue
    }
    const clave = `${orden.comida}|${lineaContratoFcr(orden.tipoDieta)}`
    const lista = porGrupo.get(clave) ?? []
    lista.push(orden)
    porGrupo.set(clave, lista)
  }

  const detalles: Record<string, DetalleConciliacion> = {}
  for (const fila of filas) {
    const base = construirDetalleDesdeFila(fila)
    const delGrupo = porGrupo.get(fila.id) ?? []
    const registros = registrosDeGrupo(delGrupo)
    detalles[fila.id] = {
      ...base,
      registros,
      totalRegistros: registros.length,
    }
  }
  return detalles
}

/** @deprecated Use construirDetallesConciliacionDesdeCiclo */
export function construirDetallesConciliacionDesdeFilas(
  filas: FilaConciliacion[],
): Record<string, DetalleConciliacion> {
  return Object.fromEntries(
    filas.map((fila) => [fila.id, construirDetalleDesdeFila(fila)]),
  )
}
