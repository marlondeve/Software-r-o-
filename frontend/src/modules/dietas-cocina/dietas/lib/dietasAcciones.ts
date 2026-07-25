import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"
import {
  esSolicitudEditable,
  puedeCancelarDieta,
  puedeRegistrarNovedad,
} from "@/modules/dietas-cocina/dietas/lib/solicitudDieta"

export interface AccionDietaFila {
  key: string
  label: string
  destructive?: boolean
  onClick: () => void
}

interface HandlersAccionesDieta {
  onAbrirDetalle: (fila: FilaDieta) => void
  onAbrirSolicitud: (fila: FilaDieta) => void
  onRegistrarNovedad: (fila: FilaDieta) => void
  onCancelarDieta: (fila: FilaDieta) => void
}

/** Acciones de fila deterministas por estado — el menú se muestra siempre. */
export function construirAccionesDietaFila(
  fila: FilaDieta,
  handlers: HandlersAccionesDieta,
): AccionDietaFila[] {
  const acciones: AccionDietaFila[] = []

  if (esSolicitudEditable(fila)) {
    acciones.push({
      key: "editar",
      label: "Editar solicitud",
      onClick: () => handlers.onAbrirSolicitud(fila),
    })
  }

  acciones.push({
    key: "detalle",
    label: "Ver detalle",
    onClick: () => handlers.onAbrirDetalle(fila),
  })

  if (puedeRegistrarNovedad(fila)) {
    acciones.push({
      key: "novedad",
      label: "Registrar novedad",
      onClick: () => handlers.onRegistrarNovedad(fila),
    })
  }

  if (puedeCancelarDieta(fila)) {
    acciones.push({
      key: "cancelar",
      label: "Cancelar dieta",
      destructive: true,
      onClick: () => handlers.onCancelarDieta(fila),
    })
  }

  return acciones
}
