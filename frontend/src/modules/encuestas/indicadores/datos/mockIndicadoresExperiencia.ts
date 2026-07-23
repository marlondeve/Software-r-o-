export interface KpiExperiencia {
  label: string
  valor: string
  sufijo?: string
  trend?: { direction: "up" | "down"; texto: string }
  nota?: string
}

export interface SegmentoBarra {
  label: string
  value: number
  color: string
}

export const RANGOS_FECHA = ["Hoy", "Última semana", "Último mes", "Último trimestre"]
export const SERVICIOS_EXPERIENCIA = [
  "Urgencias",
  "Consulta Externa",
  "Hospitalización",
  "UCI",
]
export const PUNTOS_ATENCION_EXPERIENCIA = ["Sede Principal", "Sede Norte", "Sede Sur"]
export const EPS_EXPERIENCIA = ["Sura EPS", "Nueva EPS", "Coomeva EPS", "Sanitas EPS"]
export const CONTRATOS_EXPERIENCIA = ["PGP", "Evento", "Capitación"]
export const CANALES_EXPERIENCIA = ["Presencial", "Telefónico"]

export const mockIndicadoresExperiencia = {
  ultimaActualizacion: "Hoy, 08:30 AM",
  filtrosDefault: {
    rangoFechas: "Último mes",
    servicio: "todos",
    puntoAtencion: "Sede Principal",
    eps: "todas",
    contrato: "todos",
    canal: "todos",
  },
  kpis: [
    {
      label: "Satisfacción Global",
      valor: "87.5",
      sufijo: "%",
      trend: { direction: "up", texto: "+2.1%" },
    },
    {
      label: "Recomendación IPS",
      valor: "92.0",
      sufijo: "%",
      trend: { direction: "up", texto: "+0.5%" },
    },
    {
      label: "Oportunidad Promedio",
      valor: "18",
      sufijo: "min",
      trend: { direction: "down", texto: "-3min" },
    },
    {
      label: "Cobertura Encuestas",
      valor: "45",
      sufijo: "%",
      nota: "1,240 pac.",
    },
  ] satisfies KpiExperiencia[],
  nivelSatisfaccion: [
    { label: "Excelente", value: 62, color: "#006671" },
    { label: "Buena", value: 25, color: "#7dd3e8" },
    { label: "Regular", value: 8, color: "#d8e0e8" },
    { label: "Mala", value: 3, color: "#f4c7cc" },
    { label: "Muy mala", value: 2, color: "#b00020" },
  ] satisfies SegmentoBarra[],
  recomendacion: [
    { label: "Definitivamente sí", value: 85, color: "#4a6700" },
    { label: "Probablemente sí", value: 10, color: "#bbf244" },
    { label: "No sabe", value: 3, color: "#d8e0e8" },
    { label: "Probablemente no", value: 2, color: "#f4c7cc" },
  ] satisfies SegmentoBarra[],
  tiemposEspera: {
    medianaMinutos: 15,
    atendidosBajo30: 88,
    atendidosSobre30: 12,
  },
}
