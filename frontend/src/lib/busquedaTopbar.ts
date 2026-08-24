import type { ModuloId } from "@/types/module"
import { extraerCodigoDesdeQr } from "@/modules/dietas-cocina/etiquetas/lib/qrPayloadEtiqueta"
import { rutaDietasPermitida } from "@/modules/dietas-cocina/lib/permisos"
import {
  rutaLogisticaConsulta,
  RUTAS_LOGISTICA,
} from "@/modules/dietas-cocina/lib/rutasLogistica"

export type TipoBusquedaTopbar = "etiqueta" | "texto" | "vacio"

const PATRON_ETIQUETA = /^E\d{6}-[23456789A-HJ-NP-Z]{4}$/i

export function normalizarTerminoBusqueda(termino: string): string {
  return termino.trim()
}

export function clasificarBusquedaTopbar(termino: string): TipoBusquedaTopbar {
  const q = normalizarTerminoBusqueda(termino)
  if (!q) return "vacio"
  if (esCodigoEtiqueta(q)) return "etiqueta"
  return "texto"
}

export function esCodigoEtiqueta(termino: string): boolean {
  const raw = termino.trim()
  if (!raw) return false
  if (/\/bandejas-piso\/consulta\//i.test(raw)) return true
  if (/^LBL:/i.test(raw.replace(/\s+/g, ""))) return true
  const codigo = extraerCodigoDesdeQr(raw)
  return PATRON_ETIQUETA.test(codigo)
}

export function resolverDestinoBusqueda(
  modulo: ModuloId | null,
  termino: string,
  rol: string | null,
): string | null {
  const q = normalizarTerminoBusqueda(termino)
  if (!q || !modulo) return null

  if (modulo === "dietas-cocina") {
    return resolverDestinoBusquedaDietasCocina(q, rol)
  }

  if (modulo === "encuestas") {
    return `/encuestas/identificacion-paciente?q=${encodeURIComponent(q)}`
  }

  return null
}

export function resolverDestinoBusquedaDietasCocina(
  termino: string,
  rol: string | null,
): string | null {
  const q = normalizarTerminoBusqueda(termino)
  if (!q) return null

  if (clasificarBusquedaTopbar(q) === "etiqueta") {
    const codigo = extraerCodigoDesdeQr(q)
    if (rutaDietasPermitida(rol, "bandejas-piso")) {
      return rutaLogisticaConsulta(codigo)
    }
    if (rutaDietasPermitida(rol, "recepcion-proveedor")) {
      return `${RUTAS_LOGISTICA.recepcionEscaneo}?codigo=${encodeURIComponent(codigo)}`
    }
    return null
  }

  if (rutaDietasPermitida(rol, "dietas")) {
    return `/dietas-cocina/dietas?q=${encodeURIComponent(q)}`
  }

  if (rutaDietasPermitida(rol, "cocina")) {
    return `/dietas-cocina/cocina?q=${encodeURIComponent(q)}`
  }

  if (rutaDietasPermitida(rol, "conciliacion")) {
    return `/dietas-cocina/conciliacion?q=${encodeURIComponent(q)}`
  }

  return null
}

export function mensajeSinDestinoBusqueda(
  modulo: ModuloId | null,
  termino: string,
): string {
  const q = normalizarTerminoBusqueda(termino)
  if (!q) return "Escriba un término para buscar."

  if (modulo === "dietas-cocina" && clasificarBusquedaTopbar(q) === "etiqueta") {
    return "No tiene permisos para consultar etiquetas u órdenes."
  }

  return "No hay una sección disponible para esta búsqueda con su rol."
}
