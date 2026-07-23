import type { OrdenCocina } from "@/modules/dietas-cocina/cocina/datos/mockCocina"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/etiquetas/datos/mockEntregasEnfermera"
import type { EstadoDieta } from "@/modules/dietas-cocina/inicio/components/EstadoBadge"

export function estadoDietaDesdeCiclo(
  estadoFila: EstadoDieta,
  orden?: OrdenCocina,
  etiqueta?: EtiquetaEnfermera,
): EstadoDieta {
  if (estadoFila === "cancelada") return "cancelada"
  if (!orden) return estadoFila

  if (etiqueta?.estadoLogistica === "devuelta") return "devuelta"
  if (etiqueta?.estadoLogistica === "entregada") return "recibida"
  if (etiqueta?.estadoLogistica === "pre_entregada") return "recibida"

  switch (orden.estadoCocina) {
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
