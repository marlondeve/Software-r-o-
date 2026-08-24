import type { ModuloId } from "@/types/module"
import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"
import { formatearUbicacion } from "@/modules/dietas-cocina/dietas/lib/dietasEstilos"
import { extraerCodigoDesdeQr } from "@/modules/dietas-cocina/etiquetas/lib/qrPayloadEtiqueta"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"
import {
  clasificarBusquedaTopbar,
  normalizarTerminoBusqueda,
  resolverDestinoBusqueda,
  resolverDestinoBusquedaDietasCocina,
} from "@/lib/busquedaTopbar"

export type TipoSugerenciaBusqueda =
  | "paciente"
  | "etiqueta"
  | "habitacion"
  | "accion"

export interface SugerenciaBusquedaTopbar {
  id: string
  tipo: TipoSugerenciaBusqueda
  titulo: string
  subtitulo?: string
  destino: string
}

export function pareceBusquedaEtiqueta(termino: string): boolean {
  const q = termino.trim().replace(/\s+/g, "")
  if (!q) return false
  if (/^LBL:/i.test(q)) return true
  if (/^E\d/i.test(q)) return true
  if (/\/bandejas-piso\/consulta\//i.test(q)) return true
  return false
}

export function filasASugerenciasPaciente(
  filas: FilaDieta[],
  rol: string | null,
  limite = 5,
): SugerenciaBusquedaTopbar[] {
  const vistos = new Set<string>()
  const sugerencias: SugerenciaBusquedaTopbar[] = []

  for (const fila of filas) {
    const clave = `${fila.pacienteId}|${fila.habitacion}`
    if (vistos.has(clave)) continue
    vistos.add(clave)

    const destino =
      resolverDestinoBusquedaDietasCocina(fila.paciente, rol) ??
      resolverDestinoBusquedaDietasCocina(fila.habitacion, rol)
    if (!destino) continue

    sugerencias.push({
      id: `paciente-${fila.id}`,
      tipo: "paciente",
      titulo: fila.paciente,
      subtitulo: `${formatearUbicacion(fila)} · ${fila.servicio}`,
      destino,
    })

    if (sugerencias.length >= limite) break
  }

  return sugerencias
}

export function sugerenciaEtiqueta(
  termino: string,
  rol: string | null,
  etiqueta?: EtiquetaEnfermera,
): SugerenciaBusquedaTopbar | null {
  const codigo = extraerCodigoDesdeQr(termino)
  const destino = resolverDestinoBusquedaDietasCocina(termino, rol)
  if (!destino) return null

  if (etiqueta) {
    return {
      id: `etiqueta-${etiqueta.id}`,
      tipo: "etiqueta",
      titulo: etiqueta.paciente,
      subtitulo: `Etiqueta ${etiqueta.codigo} · Hab. ${etiqueta.habitacion}`,
      destino: resolverDestinoBusquedaDietasCocina(etiqueta.codigo, rol) ?? destino,
    }
  }

  return {
    id: `etiqueta-${codigo}`,
    tipo: "etiqueta",
    titulo: clasificarBusquedaTopbar(termino) === "etiqueta"
      ? `Consultar etiqueta ${codigo}`
      : `Buscar etiqueta ${codigo}`,
    subtitulo: "Bandejas en piso",
    destino,
  }
}

export function sugerenciaVerTodos(
  modulo: ModuloId | null,
  termino: string,
  rol: string | null,
): SugerenciaBusquedaTopbar | null {
  const q = normalizarTerminoBusqueda(termino)
  const destino = resolverDestinoBusqueda(modulo, q, rol)
  if (!destino || clasificarBusquedaTopbar(q) === "etiqueta") return null

  return {
    id: "ver-todos",
    tipo: "accion",
    titulo: `Ver todos los resultados para «${q}»`,
    subtitulo: "Enter para buscar",
    destino,
  }
}

export function combinarSugerencias(
  ...grupos: SugerenciaBusquedaTopbar[][]
): SugerenciaBusquedaTopbar[] {
  const vistos = new Set<string>()
  const resultado: SugerenciaBusquedaTopbar[] = []

  for (const grupo of grupos) {
    for (const item of grupo) {
      const clave = `${item.tipo}:${item.titulo}:${item.destino}`
      if (vistos.has(clave)) continue
      vistos.add(clave)
      resultado.push(item)
    }
  }

  return resultado.slice(0, 6)
}
