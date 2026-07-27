import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"
import type { OrdenCocina } from "@/modules/dietas-cocina/types/kitchen"
import type { EstadoDieta } from "@/modules/dietas-cocina/types/enums"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"
import { estadoDietaDesdeCiclo } from "@/modules/dietas-cocina/lib/mapearEstadoDietaOrden"
import { resolverContextoFilaDieta } from "@/modules/dietas-cocina/lib/resolverOrdenEtiquetaFila"

export function crearResolverEstadoVisibleFila(
  ordenes: OrdenCocina[],
  etiquetas: EtiquetaEnfermera[],
): (fila: FilaDieta) => EstadoDieta {
  return (fila: FilaDieta) => {
    const { orden, etiqueta } = resolverContextoFilaDieta(fila, ordenes, etiquetas)
    return estadoDietaDesdeCiclo(fila, orden, etiqueta)
  }
}
