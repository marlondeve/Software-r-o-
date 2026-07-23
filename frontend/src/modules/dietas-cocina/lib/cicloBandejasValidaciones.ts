import type { OrdenCocina } from "@/modules/dietas-cocina/cocina/datos/mockCocina"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/etiquetas/datos/mockEntregasEnfermera"
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

export function puedeImprimirEtiquetaOrden(orden: OrdenCocina): boolean {
  if (orden.estadoCocina !== "lista" && orden.estadoCocina !== "despachada") {
    return false
  }
  return orden.etiquetaId != null || orden.etiquetaGenerada
}

export function puedeGenerarEtiqueta(orden: OrdenCocina): boolean {
  return orden.estadoCocina === "lista" && !orden.etiquetaGenerada
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
): boolean {
  if (etiqueta.estadoLogistica !== "impresa") return false
  if (!orden) return false
  return orden.estadoCocina === "despachada"
}

export function motivoNoConfirmarPreEntrega(
  orden: OrdenCocina | undefined,
  etiqueta: EtiquetaEnfermera,
): string | undefined {
  if (etiqueta.estadoLogistica !== "impresa") {
    return "Esta bandeja ya fue registrada o no está pendiente de recepción."
  }
  if (!orden) {
    return "No hay una orden de cocina vinculada a esta etiqueta."
  }
  if (orden.estadoCocina !== "despachada") {
    return "La bandeja aún no fue despachada desde cocina."
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
