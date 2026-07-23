import { mockEtiquetas, type EtiquetaDieta } from "@/modules/dietas-cocina/etiquetas/datos/mockEtiquetas"

export type EstadoLogisticaEtiqueta =
  | "generada"
  | "impresa"
  | "pre_entregada"
  | "entregada"
  | "devuelta"

export type ModoFlujoEtiqueta = "pre-entrega" | "entrega" | "devolucion"

export interface EtiquetaEnfermera extends EtiquetaDieta {
  estadoLogistica: EstadoLogisticaEtiqueta
  alergias?: string[]
  pabellonDetalle?: string
  cama?: string
  horaPreEntrega?: string
  horaEntrega?: string
  horaDevolucion?: string
  recibidoPor?: string
  motivoDevolucion?: string
  observacionesDevolucion?: string
  fotoDevolucion?: string
}

export interface KpiEnfermeraEtiqueta {
  id: string
  label: string
  value: number
  variant?: "default" | "info" | "success" | "destructive"
}

const logisticaPorId: Record<
  string,
  Partial<
    Pick<
      EtiquetaEnfermera,
      | "estadoLogistica"
      | "alergias"
      | "pabellonDetalle"
      | "cama"
      | "horaPreEntrega"
      | "horaEntrega"
    >
  >
> = {
  "etq-1": { estadoLogistica: "generada" },
  "etq-2": { estadoLogistica: "generada", alergias: ["Frutos secos"] },
  "etq-3": { estadoLogistica: "generada" },
  "etq-4": {
    estadoLogistica: "impresa",
  },
  "etq-5": {
    estadoLogistica: "pre_entregada",
    horaPreEntrega: "24/10/2023 12:08",
    alergias: ["Mariscos", "Penicilina"],
    pabellonDetalle: "Pab Norte",
    cama: "Cama B",
    recibidoPor: "Enfermera J. López",
  },
  "etq-6": {
    estadoLogistica: "entregada",
    horaPreEntrega: "24/10/2023 11:50",
    horaEntrega: "24/10/2023 12:35",
  },
  "etq-7": { estadoLogistica: "impresa" },
  "etq-8": { estadoLogistica: "impresa" },
  "etq-9": { estadoLogistica: "pre_entregada", horaPreEntrega: "24/10/2023 09:55" },
  "etq-10": { estadoLogistica: "impresa" },
  "etq-11": { estadoLogistica: "devuelta", horaDevolucion: "24/10/2023 21:10" },
  "etq-12": { estadoLogistica: "impresa" },
}

function enriquecerEtiqueta(etiqueta: EtiquetaDieta): EtiquetaEnfermera {
  const extra = logisticaPorId[etiqueta.id] ?? {}
  const impresa =
    etiqueta.estado === "impresa" || etiqueta.estado === "reimpresa"

  return {
    ...etiqueta,
    estadoLogistica:
      extra.estadoLogistica ?? (impresa ? "impresa" : "generada"),
    alergias: extra.alergias,
    pabellonDetalle: extra.pabellonDetalle ?? etiqueta.pabellon,
    cama: extra.cama,
    horaPreEntrega: extra.horaPreEntrega,
    horaEntrega: extra.horaEntrega,
    horaDevolucion: extra.horaDevolucion,
    recibidoPor: extra.recibidoPor,
  }
}

export function crearEtiquetasEnfermeraIniciales(): EtiquetaEnfermera[] {
  return mockEtiquetas.etiquetas.map(enriquecerEtiqueta)
}

export function calcularKpisEnfermera(
  etiquetas: EtiquetaEnfermera[],
  comidaActiva: EtiquetaDieta["comida"],
): KpiEnfermeraEtiqueta[] {
  const filtradas = etiquetas.filter((e) => e.comida === comidaActiva)
  const pendientesRecepcion = filtradas.filter(
    (e) => e.estadoLogistica === "impresa",
  ).length
  const pendientesEntrega = filtradas.filter(
    (e) => e.estadoLogistica === "pre_entregada",
  ).length
  const devueltas = filtradas.filter(
    (e) => e.estadoLogistica === "devuelta",
  ).length

  return [
    {
      id: "pendientes-recepcion",
      label: "PENDIENTES RECEPCIÓN",
      value: pendientesRecepcion,
      variant: "default",
    },
    {
      id: "pendientes-entrega",
      label: "PENDIENTES ENTREGA",
      value: pendientesEntrega,
      variant: "info",
    },
    {
      id: "devueltas",
      label: "DEVUELTAS HOY",
      value: devueltas,
      variant: "destructive",
    },
  ]
}

export const MOTIVOS_DEVOLUCION = [
  "Rechazo del paciente",
  "Condición médica",
  "Error en cocina",
  "Temperatura inadecuada",
] as const

export type MotivoDevolucion = (typeof MOTIVOS_DEVOLUCION)[number]
