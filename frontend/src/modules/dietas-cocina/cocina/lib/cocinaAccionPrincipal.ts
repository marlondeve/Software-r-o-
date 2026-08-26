import type { LucideIcon } from "lucide-react"
import { ClipboardCheck, Printer, Truck } from "lucide-react"

import type { OrdenCocina } from "@/modules/dietas-cocina/types/kitchen"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"
import {
  puedeContinuarPreparacion,
  enPasoEtiquetaSeguimiento,
} from "@/modules/dietas-cocina/cocina/lib/cocinaSeguimiento"
import {
  estaEnGestionCocina,
  etiquetaAccionOrden,
  motivoNoEtiquetaOrden,
  motivoNoMarcarLista,
  puedeDespachar,
  puedeGenerarEtiqueta,
  puedeImprimirEtiquetaOrden,
  puedeMarcarLista,
} from "@/modules/dietas-cocina/lib/cicloBandejasValidaciones"
import { esCancelacionSalidaClinica } from "@/modules/dietas-cocina/lib/labelEstadoOperativo"

export type AccionPrincipalCocinaId =
  | "continuar-preparacion"
  | "marcar-lista"
  | "generar-etiqueta"
  | "imprimir-etiqueta"
  | "registrar-despacho"
  | "ninguna"

export interface AccionPrincipalCocina {
  id: AccionPrincipalCocinaId
  label: string
  habilitada: boolean
  motivo?: string
  icon?: LucideIcon
}

export function resolverAccionPrincipalCocina(
  orden: OrdenCocina,
  etiqueta?: EtiquetaEnfermera,
): AccionPrincipalCocina {
  if (orden.estadoCocina === "cancelada") {
    const salida = esCancelacionSalidaClinica(
      orden.observaciones,
      orden.cancelacionPorSalidaClinica,
    )
    return {
      id: "ninguna",
      label: salida ? "Salida clínica" : "Orden cancelada",
      habilitada: false,
      motivo: salida
        ? "El paciente tiene salida clínica; la bandeja no se prepara."
        : "Esta bandeja fue cancelada.",
    }
  }

  if (puedeMarcarLista(orden)) {
    return {
      id: "marcar-lista",
      label: "Marcar como lista",
      habilitada: true,
      icon: ClipboardCheck,
    }
  }

  if (puedeContinuarPreparacion(orden, etiqueta)) {
    return {
      id: "continuar-preparacion",
      label:
        orden.estadoCocina === "por_iniciar"
          ? "Iniciar preparación"
          : "Continuar preparación",
      habilitada: true,
    }
  }

  if (puedeGenerarEtiqueta(orden, etiqueta)) {
    return {
      id: "generar-etiqueta",
      label: "Generar etiqueta",
      habilitada: true,
      icon: Printer,
    }
  }

  if (puedeDespachar(orden, etiqueta)) {
    return {
      id: "registrar-despacho",
      label: "Registrar despacho",
      habilitada: true,
      icon: Truck,
    }
  }

  const accionEtiqueta = etiquetaAccionOrden(orden, etiqueta)
  if (
    enPasoEtiquetaSeguimiento(orden, etiqueta) &&
    puedeImprimirEtiquetaOrden(orden, etiqueta) &&
    accionEtiqueta === "imprimir"
  ) {
    return {
      id: "imprimir-etiqueta",
      label: "Imprimir etiqueta",
      habilitada: true,
      icon: Printer,
    }
  }

  if (orden.estadoCocina === "despachada") {
    return {
      id: "ninguna",
      label: "Bandeja despachada",
      habilitada: false,
      motivo: "La bandeja ya salió de cocina.",
    }
  }

  const motivoEtiqueta = motivoNoEtiquetaOrden(orden, etiqueta)
  if (motivoEtiqueta) {
    return {
      id: "ninguna",
      label: accionEtiqueta === "generar" ? "Generar etiqueta" : "Imprimir etiqueta",
      habilitada: false,
      motivo: motivoEtiqueta,
      icon: Printer,
    }
  }

  const motivoLista = motivoNoMarcarLista(orden)
  if (motivoLista && estaEnGestionCocina(orden)) {
    return {
      id: "marcar-lista",
      label: "Marcar como lista",
      habilitada: false,
      motivo: motivoLista,
      icon: ClipboardCheck,
    }
  }

  return {
    id: "ninguna",
    label: "Sin acción pendiente",
    habilitada: false,
    motivo: "No hay pasos de cocina pendientes para esta bandeja.",
  }
}
