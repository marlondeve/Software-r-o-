import type { OrdenCocina } from "@/modules/dietas-cocina/types/kitchen"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"
export function checklistObligatorioCompleto(orden: OrdenCocina): boolean {
  return orden.checklist
    .filter((item) => item.obligatorio)
    .every((item) => item.completado)
}

export function checklistProgreso(orden: OrdenCocina): {
  total: number
  completados: number
  pendientes: number
  completo: boolean
} {
  const obligatorios = orden.checklist.filter((item) => item.obligatorio)
  const completados = obligatorios.filter((item) => item.completado).length
  return {
    total: obligatorios.length,
    completados,
    pendientes: obligatorios.length - completados,
    completo: obligatorios.every((item) => item.completado),
  }
}

/** Lista en UI pero aún sin etiqueta — suele indicar desincronización con el API. */
export function enRecuperacionChecklistCocina(orden: OrdenCocina): boolean {
  return (
    orden.estadoCocina === "lista" &&
    !orden.etiquetaGenerada &&
    !orden.etiquetaId
  )
}

export function puedeEditarChecklist(orden: OrdenCocina): boolean {
  if (
    orden.estadoCocina === "por_iniciar" ||
    orden.estadoCocina === "en_preparacion"
  ) {
    return true
  }
  return enRecuperacionChecklistCocina(orden)
}

export function motivoNoMarcarLista(orden: OrdenCocina): string | undefined {
  if (orden.estadoCocina === "despachada" || orden.estadoCocina === "cancelada") {
    return "La bandeja ya salió de cocina."
  }
  if (orden.estadoCocina === "lista") {
    return "La bandeja ya está marcada como lista."
  }
  if (orden.estadoCocina === "por_iniciar") {
    return "Inicia la preparación antes de marcar como lista."
  }
  if (!checklistObligatorioCompleto(orden)) {
    const { pendientes } = checklistProgreso(orden)
    return `Completa ${pendientes} ítem(s) obligatorio(s) del checklist.`
  }
  return undefined
}

export function puedeMarcarLista(orden: OrdenCocina): boolean {
  return (
    orden.estadoCocina === "en_preparacion" &&
    checklistObligatorioCompleto(orden)
  )
}

export function etiquetaImpresaEnOrden(
  orden: OrdenCocina,
  etiqueta?: EtiquetaEnfermera,
): boolean {
  if (orden.etiquetaImpresa) return true
  if (!etiqueta) return false
  return (
    etiqueta.estado === "impresa" ||
    etiqueta.estado === "reimpresa" ||
    etiqueta.estadoLogistica === "impresa"
  )
}

export function puedeImprimirEtiquetaOrden(
  orden: OrdenCocina,
  etiqueta?: EtiquetaEnfermera,
): boolean {
  if (puedeGenerarEtiqueta(orden, etiqueta)) return true
  if (etiquetaImpresaEnOrden(orden, etiqueta)) return false
  if (orden.estadoCocina !== "lista" && orden.estadoCocina !== "despachada") {
    return false
  }
  return orden.etiquetaId != null || orden.etiquetaGenerada || Boolean(etiqueta)
}

export function etiquetaAccionOrden(
  orden: OrdenCocina,
  etiqueta?: EtiquetaEnfermera,
): "generar" | "imprimir" {
  return puedeGenerarEtiqueta(orden, etiqueta) ? "generar" : "imprimir"
}

export function motivoNoEtiquetaOrden(
  orden: OrdenCocina,
  etiqueta?: EtiquetaEnfermera,
): string | undefined {
  if (puedeImprimirEtiquetaOrden(orden, etiqueta)) return undefined
  const motivoGenerar = motivoNoGenerarEtiqueta(orden, etiqueta)
  if (motivoGenerar) return motivoGenerar
  if (orden.estadoCocina === "por_iniciar") {
    return "Marca la bandeja en preparación y completa el checklist."
  }
  if (orden.estadoCocina === "en_preparacion") {
    return "Marca la bandeja como lista antes de generar la etiqueta."
  }
  return "La bandeja debe estar lista para generar o imprimir la etiqueta."
}

export function puedeGenerarEtiqueta(
  orden: OrdenCocina,
  etiqueta?: EtiquetaEnfermera,
): boolean {
  if (orden.estadoCocina !== "lista") return false
  if (orden.etiquetaGenerada || orden.etiquetaId) return false
  if (etiqueta) return false
  return checklistObligatorioCompleto(orden)
}

export function motivoNoGenerarEtiqueta(
  orden: OrdenCocina,
  etiqueta?: EtiquetaEnfermera,
): string | undefined {
  if (puedeGenerarEtiqueta(orden, etiqueta)) return undefined
  if (orden.estadoCocina !== "lista") {
    return "Marca la bandeja como lista antes de generar la etiqueta."
  }
  if (orden.etiquetaGenerada || orden.etiquetaId || etiqueta) {
    return "Esta bandeja ya tiene etiqueta generada."
  }
  if (!checklistObligatorioCompleto(orden)) {
    const { pendientes } = checklistProgreso(orden)
    return `Completa ${pendientes} ítem(s) obligatorio(s) del checklist para generar la etiqueta.`
  }
  return undefined
}

export function puedeDespachar(orden: OrdenCocina, etiqueta?: EtiquetaEnfermera): boolean {
  if (orden.estadoCocina !== "lista") return false
  if (!orden.etiquetaGenerada || !orden.etiquetaId) return false
  return etiquetaImpresaEnOrden(orden, etiqueta)
}

export function puedeImprimirEtiqueta(etiqueta: EtiquetaEnfermera): boolean {
  return etiqueta.estado === "generada" || etiqueta.estado === "pendiente"
}

export function puedeReimprimirEtiqueta(etiqueta: EtiquetaEnfermera): boolean {
  return (
    etiqueta.estado === "impresa" ||
    etiqueta.estado === "reimpresa" ||
    etiqueta.estadoLogistica === "impresa"
  )
}

export function puedeConfirmarPreEntrega(
  orden: OrdenCocina | undefined,
  etiqueta: EtiquetaEnfermera,
  opciones: { apiActiva?: boolean } = {},
): boolean {
  const { apiActiva = false } = opciones
  if (etiqueta.estadoLogistica !== "impresa") return false
  if (apiActiva) {
    if (!orden) return true
    return orden.estadoCocina === "lista" || orden.estadoCocina === "despachada"
  }
  if (!orden) return false
  return orden.estadoCocina === "despachada"
}

export function motivoNoConfirmarPreEntrega(
  orden: OrdenCocina | undefined,
  etiqueta: EtiquetaEnfermera,
  opciones: { apiActiva?: boolean } = {},
): string | undefined {
  const { apiActiva = false } = opciones
  if (etiqueta.estadoLogistica !== "impresa") {
    return "Esta bandeja ya fue registrada o no está pendiente de recepción."
  }
  if (!orden && !apiActiva) {
    return "No hay una orden de cocina vinculada a esta etiqueta."
  }
  if (
    orden &&
    !apiActiva &&
    orden.estadoCocina !== "despachada"
  ) {
    return "La bandeja aún no fue despachada desde cocina."
  }
  if (
    orden &&
    apiActiva &&
    orden.estadoCocina !== "lista" &&
    orden.estadoCocina !== "despachada"
  ) {
    return "La bandeja debe estar lista en cocina antes de confirmar recepción."
  }
  return undefined
}

export function puedeConfirmarEntrega(etiqueta: EtiquetaEnfermera): boolean {
  return etiqueta.estadoLogistica === "pre_entregada"
}

export function puedeConfirmarDevolucion(etiqueta: EtiquetaEnfermera): boolean {
  return (
    etiqueta.estadoLogistica === "pre_entregada" ||
    etiqueta.estadoLogistica === "entregada"
  )
}

export function puedeCancelarOrdenCocina(orden: OrdenCocina): boolean {
  return (
    orden.estadoCocina === "por_iniciar" ||
    orden.estadoCocina === "en_preparacion" ||
    orden.estadoCocina === "lista"
  )
}
