import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"

export type TipoDevolucionEtiqueta = "antes_entrega" | "post_entrega"

/** Bandeja recibida del proveedor que NO se entregará al paciente. */
export const MOTIVOS_DEVOLUCION_ANTES_ENTREGA = [
  "Paciente no estaba en habitación",
  "Paciente en NPO o ayuno",
  "Paciente se negó antes de recibir",
  "Bandeja incorrecta para el paciente",
  "Bandeja dañada o contaminada",
  "Temperatura inadecuada",
] as const

/** Bandeja ya entregada al paciente y recogida por enfermería. */
export const MOTIVOS_DEVOLUCION_PACIENTE = [
  "Se consumió",
  "Consumo parcial",
  "No se consumió",
  "Bandeja sin abrir",
] as const

export type MotivoDevolucionAntesEntrega =
  (typeof MOTIVOS_DEVOLUCION_ANTES_ENTREGA)[number]

export type MotivoDevolucionPaciente = (typeof MOTIVOS_DEVOLUCION_PACIENTE)[number]

export type MotivoDevolucionFlujo =
  | MotivoDevolucionAntesEntrega
  | MotivoDevolucionPaciente

export function motivosDevolucionPorTipo(tipo: TipoDevolucionEtiqueta): readonly string[] {
  return tipo === "antes_entrega"
    ? MOTIVOS_DEVOLUCION_ANTES_ENTREGA
    : MOTIVOS_DEVOLUCION_PACIENTE
}

export function esDevolucionConsumida(
  motivo?: MotivoDevolucionFlujo | string,
): boolean {
  return motivo === "Se consumió" || motivo === "Consumo parcial"
}

function motivoEsAntesEntrega(motivo?: string): boolean {
  return (
    !!motivo &&
    (MOTIVOS_DEVOLUCION_ANTES_ENTREGA as readonly string[]).includes(motivo)
  )
}

function motivoEsPostEntrega(motivo?: string): boolean {
  return (
    !!motivo &&
    (MOTIVOS_DEVOLUCION_PACIENTE as readonly string[]).includes(motivo)
  )
}

/** Bandeja rechazada antes de entregarla al paciente. */
export function esRechazoAntesEntrega(
  etiqueta: Pick<
    EtiquetaEnfermera,
    "estadoLogistica" | "motivoDevolucion" | "horaEntrega"
  >,
): boolean {
  if (etiqueta.estadoLogistica !== "devuelta") return false
  if (motivoEsAntesEntrega(etiqueta.motivoDevolucion)) return true
  if (motivoEsPostEntrega(etiqueta.motivoDevolucion)) return false
  return !etiqueta.horaEntrega
}

/** Bandeja recogida por enfermería después de la entrega al paciente. */
export function esRecogidaPostEntrega(
  etiqueta: Pick<
    EtiquetaEnfermera,
    "estadoLogistica" | "motivoDevolucion" | "horaEntrega"
  >,
): boolean {
  return etiqueta.estadoLogistica === "devuelta" && !esRechazoAntesEntrega(etiqueta)
}

export function labelCierreBandeja(
  etiqueta: Pick<
    EtiquetaEnfermera,
    "estadoLogistica" | "motivoDevolucion" | "horaEntrega"
  >,
): string {
  if (etiqueta.estadoLogistica !== "devuelta") return "Devuelta"
  return esRecogidaPostEntrega(etiqueta) ? "Recogida" : "Devuelta"
}

export function labelCierreBandejaDetalle(
  etiqueta: Pick<
    EtiquetaEnfermera,
    "estadoLogistica" | "motivoDevolucion" | "horaEntrega"
  >,
): string {
  if (etiqueta.estadoLogistica !== "devuelta") return "Devuelta a cocina"
  return esRecogidaPostEntrega(etiqueta)
    ? "Recogida por enfermería"
    : "Rechazada antes de entrega"
}

export function contarDevolucionesEtiquetas(etiquetas: EtiquetaEnfermera[]) {
  let rechazadas = 0
  let recogidas = 0
  let recogidasConsumidas = 0

  for (const etiqueta of etiquetas) {
    if (etiqueta.estadoLogistica !== "devuelta") continue
    if (esRechazoAntesEntrega(etiqueta)) {
      rechazadas++
      continue
    }
    if (esDevolucionConsumida(etiqueta.motivoDevolucion)) {
      recogidasConsumidas++
    } else {
      recogidas++
    }
  }

  return {
    /** Rechazadas antes de entrega al paciente. */
    rechazadas,
    /** Recogidas sin consumo total o parcial registrado. */
    recogidas,
    /** Recogidas con consumo total o parcial. */
    recogidasConsumidas,
    /** Alias histórico: rechazadas antes de entrega. */
    devueltas: rechazadas,
    /** Alias histórico: recogidas con consumo. */
    devueltasConsumidas: recogidasConsumidas,
    total: rechazadas + recogidas + recogidasConsumidas,
  }
}

export function estadoDietaDevolucionPorMotivo(
  tipo: TipoDevolucionEtiqueta,
  motivo: MotivoDevolucionFlujo,
): string {
  if (tipo === "antes_entrega") return "No entregada"
  switch (motivo) {
    case "Se consumió":
      return "Consumida"
    case "Consumo parcial":
      return "Consumida parcialmente"
    case "No se consumió":
    case "Bandeja sin abrir":
      return "No consumida"
    default:
      return "Recogida"
  }
}

export function configDevolucionPorTipo(tipo: TipoDevolucionEtiqueta) {
  if (tipo === "antes_entrega") {
    return {
      titulo: "Rechazo antes de entrega",
      guiaEscaneo:
        "Escanea la bandeja recibida del proveedor que no entregarás al paciente.",
      descripcionFormulario:
      "Indica por qué la bandeja no llegará al paciente (aún está en tu custodia).",
      etiquetaMotivo: "Motivo del rechazo",
      estadoDietaApi: "No entregada",
      rutaExito: "/dietas-cocina/etiquetas/devolucion/antes-entrega",
      mensajeExito:
        "La bandeja fue registrada como rechazada antes de la entrega al paciente.",
    }
  }
  return {
    titulo: "Recogida de bandeja",
    guiaEscaneo:
      "Escanea la bandeja que recoges del paciente después de la entrega.",
    descripcionFormulario:
      "Indica cuánto consumió el paciente al recoger la bandeja.",
    etiquetaMotivo: "Estado del consumo",
    estadoDietaApi: "Recogida",
    rutaExito: "/dietas-cocina/etiquetas/devolucion/paciente",
    mensajeExito:
      "La recogida de bandeja quedó registrada y cocina podrá conciliarla.",
  }
}

export function puedeDevolucionPorTipo(
  etiqueta: EtiquetaEnfermera,
  tipo: TipoDevolucionEtiqueta,
): boolean {
  if (tipo === "antes_entrega") {
    return etiqueta.estadoLogistica === "pre_entregada"
  }
  return etiqueta.estadoLogistica === "entregada"
}

export function motivoNoDevolucionPorTipo(
  etiqueta: EtiquetaEnfermera,
  tipo: TipoDevolucionEtiqueta,
): string | undefined {
  if (puedeDevolucionPorTipo(etiqueta, tipo)) return undefined
  if (tipo === "antes_entrega") {
    if (etiqueta.estadoLogistica === "entregada") {
      return "Esta bandeja ya fue entregada al paciente. Usa «Recogida de bandeja»."
    }
    return "Solo puedes rechazar bandejas recibidas del proveedor y aún no entregadas al paciente."
  }
  if (etiqueta.estadoLogistica === "pre_entregada") {
    return "Esta bandeja aún no fue entregada al paciente. Usa «Rechazo antes de entrega»."
  }
  return "Solo puedes registrar devoluciones de bandejas ya entregadas al paciente."
}

export function parseTipoDevolucionParam(
  valor: string | undefined,
): TipoDevolucionEtiqueta | null {
  if (valor === "antes-entrega") return "antes_entrega"
  if (valor === "paciente") return "post_entrega"
  return null
}
