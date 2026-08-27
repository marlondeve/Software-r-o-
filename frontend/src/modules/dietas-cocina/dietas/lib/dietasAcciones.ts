import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"
import type { EstadoDieta, TiempoComida } from "@/modules/dietas-cocina/types/enums"
import {
  esSolicitudEditable,
  evaluarAccionesDietaClinica,
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
  onDejarSinSolicitud?: (fila: FilaDieta) => void
}

interface ContextoAccionesDietaFila {
  estadoVisible: EstadoDieta
  comidaActiva: TiempoComida
  rol?: string | null
}

/** Acciones de fila deterministas por estado operativo visible. */
export function construirAccionesDietaFila(
  fila: FilaDieta,
  handlers: HandlersAccionesDieta,
  contexto: ContextoAccionesDietaFila,
): AccionDietaFila[] {
  const acciones: AccionDietaFila[] = []
  const evaluacion = evaluarAccionesDietaClinica({
    fila,
    estadoVisible: contexto.estadoVisible,
    comida: contexto.comidaActiva,
    rol: contexto.rol,
  })

  if (evaluacion.puedeReactivarCancelada) {
    acciones.push({
      key: "solicitar",
      label: "Solicitar dieta",
      onClick: () => handlers.onAbrirSolicitud(fila),
    })
    if (handlers.onDejarSinSolicitud) {
      acciones.push({
        key: "sin-solicitud",
        label: "Dejar sin solicitud",
        onClick: () => handlers.onDejarSinSolicitud?.(fila),
      })
    }
  } else if (esSolicitudEditable(fila)) {
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

  if (evaluacion.mostrarRegistrarNovedad) {
    acciones.push({
      key: "novedad",
      label: "Registrar novedad",
      onClick: () => handlers.onRegistrarNovedad(fila),
    })
  }

  if (evaluacion.puedeCancelarDieta) {
    acciones.push({
      key: "cancelar",
      label: "Cancelar dieta",
      destructive: true,
      onClick: () => handlers.onCancelarDieta(fila),
    })
  }

  return acciones
}
