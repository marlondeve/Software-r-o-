import type { OrdenCocina } from "@/modules/dietas-cocina/types/kitchen"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"
import { estadoEtiquetaImprimible } from "@/modules/dietas-cocina/etiquetas/lib/etiquetasEstilos"

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

export function puedeEditarChecklist(orden: OrdenCocina): boolean {
  return (
    orden.estadoCocina === "por_iniciar" ||
    orden.estadoCocina === "en_preparacion"
  )
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

export function puedeImprimirEtiquetaOrden(
  orden: OrdenCocina,
  etiqueta?: EtiquetaEnfermera,
): boolean {
  if (puedeGenerarEtiqueta(orden, etiqueta)) return true
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

export function motivoNoEtiquetaOrden(orden: OrdenCocina): string | undefined {
  if (puedeImprimirEtiquetaOrden(orden)) return undefined
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
  return !etiqueta
}

export function puedeDespachar(orden: OrdenCocina, etiqueta?: EtiquetaEnfermera): boolean {
  if (orden.estadoCocina !== "lista") return false
  if (!orden.etiquetaGenerada || !orden.etiquetaId) return false
  const logistica = etiqueta?.estadoLogistica ?? orden.estadoLogistica
  const estadoEtq = etiqueta?.estado
  return (
    logistica === "impresa" ||
    estadoEtq === "impresa" ||
    estadoEtq === "reimpresa"
  )
}

export function puedeImprimirEtiqueta(etiqueta: EtiquetaEnfermera): boolean {
  return estadoEtiquetaImprimible(etiqueta.estado)
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
