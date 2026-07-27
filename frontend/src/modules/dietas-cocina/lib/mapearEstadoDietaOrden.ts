import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"
import type { OrdenCocina } from "@/modules/dietas-cocina/types/kitchen"
import type { EstadoDieta } from "@/modules/dietas-cocina/types/enums"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"
import { esRecogidaPostEntrega } from "@/modules/dietas-cocina/etiquetas/lib/devolucionConfig"
import {
  etiquetaPerteneceAFila,
  ordenPerteneceAFila,
} from "@/modules/dietas-cocina/lib/resolverOrdenEtiquetaFila"

const ESTADOS_PRE_CICLO = new Set<EstadoDieta>(["no-solicitada", "guardado"])

const ESTADOS_LOGISTICA = new Set<EstadoDieta>([
  "por-iniciar",
  "preparando",
  "en-preparacion",
  "lista-despacho",
  "despachada",
  "recibida",
  "devuelta",
  "recogida",
])

function normalizarEstadoSinCicloActivo(fila: FilaDieta): EstadoDieta {
  if (!ESTADOS_LOGISTICA.has(fila.estado)) return fila.estado
  if (fila.tipoDieta) return "confirmada"
  return "no-solicitada"
}

export function estadoDietaDesdeCiclo(
  fila: FilaDieta,
  orden?: OrdenCocina,
  etiqueta?: EtiquetaEnfermera,
): EstadoDieta {
  const estadoFila = fila.estado

  if (estadoFila === "cancelada") return "cancelada"
  if (ESTADOS_PRE_CICLO.has(estadoFila)) return estadoFila

  const ordenValida =
    orden && ordenPerteneceAFila(fila, orden) ? orden : undefined
  const etiquetaValida =
    etiqueta && etiquetaPerteneceAFila(fila, etiqueta, ordenValida)
      ? etiqueta
      : undefined

  if (!ordenValida && !etiquetaValida) {
    return normalizarEstadoSinCicloActivo(fila)
  }

  if (etiquetaValida?.estadoLogistica === "devuelta") {
    return esRecogidaPostEntrega(etiquetaValida) ? "recogida" : "devuelta"
  }
  if (
    etiquetaValida?.estadoLogistica === "entregada" ||
    etiquetaValida?.estadoLogistica === "pre_entregada"
  ) {
    return "recibida"
  }

  if (!ordenValida) return estadoFila

  switch (ordenValida.estadoCocina) {
    case "por_iniciar":
      return "por-iniciar"
    case "en_preparacion":
      return "en-preparacion"
    case "lista":
      return "lista-despacho"
    case "despachada":
      return "despachada"
    case "cancelada":
      return "cancelada"
    default:
      return estadoFila
  }
}
