export const mockReportesNutricionista = {
  filtros: {
    rangoFechas: "Oct 1 - Oct 24, 2023",
    servicio: "Todos los servicios",
    horario: "Todos los horarios",
    ultimaActualizacion: "Hoy, 11:42 AM",
  },
  kpis: [
    {
      label: "Solicitadas",
      value: "4,280",
      detalle: "+5.2% vs ant.",
      detalleVariant: "positive" as const,
    },
    {
      label: "Confirmadas",
      value: "4,150",
      detalle: "96.9% del total",
      detalleVariant: "neutral" as const,
    },
    {
      label: "Entregadas",
      value: "3,980",
      detalle: "95.9% efectividad",
      detalleVariant: "neutral" as const,
    },
    {
      label: "Canceladas",
      value: "130",
      detalle: "3.0% del total",
      detalleVariant: "negative" as const,
    },
    {
      label: "Costo total",
      value: "$42,800.00",
      detalle: undefined,
      detalleVariant: "neutral" as const,
    },
    {
      label: "Costo canc. tardía",
      value: "$1,250.00",
      detalle: undefined,
      detalleVariant: "negative" as const,
    },
  ],
  hitos: [
    {
      etapa: "Conf. → Despacho",
      tiempo: "18 min",
      tendencia: "↓2%",
      tendenciaVariant: "positive" as const,
    },
    {
      etapa: "Despacho → Llegada",
      tiempo: "12 min",
      tendencia: "↑5% Alert",
      tendenciaVariant: "negative" as const,
    },
    {
      etapa: "Llegada → Entrega",
      tiempo: "8 min",
      tendencia: "↓10%",
      tendenciaVariant: "positive" as const,
    },
    {
      etapa: "Entrega → Recogida",
      tiempo: "24 min",
      tendencia: "-0%",
      tendenciaVariant: "neutral" as const,
    },
  ],
  hallazgos: [
    {
      variant: "destructive" as const,
      titulo: "Alta tasa de devolución",
      descripcion:
        "Pabellón Norte presenta 12% de devoluciones por temperatura inadecuada.",
    },
    {
      variant: "info" as const,
      titulo: "Entregas demoradas",
      descripcion:
        "Almuerzo: 8 entregas superaron 60 min en los últimos 3 días.",
    },
    {
      variant: "warning" as const,
      titulo: "Cancelaciones tardías",
      descripcion:
        "Cardiología con cancelaciones repetitivas fuera de horario.",
    },
  ],
  estadoDietas: {
    total: "4.2k",
    totalNumerico: 4200,
    segmentos: [
      { label: "Entregado (75%)", value: 3150, color: "#006671" },
      { label: "Cocina (15%)", value: 630, color: "#bbf244" },
      { label: "Pendiente (10%)", value: 420, color: "#d8e0e8" },
    ],
  },
  tiposDieta: [
    { label: "Normal", value: 42, color: "#006671" },
    { label: "Hiposódica", value: 28, color: "#00818f" },
    { label: "Diabética", value: 18, color: "#7c6ba8" },
    { label: "Líquida", value: 8, color: "#4a6700" },
    { label: "Blanda", value: 4, color: "#94a3b8" },
  ],
  motivosDevolucion: [
    { label: "Rechazo paciente", value: 45, color: "#e879a9" },
    { label: "Temperatura", value: 30, color: "#60a5fa" },
    { label: "Error cocina", value: 25, color: "#a78bfa" },
  ],
  distribucionServicio: [
    { label: "Desayunos", value: 45, color: "#e879a9" },
    { label: "Almuerzos", value: 30, color: "#60a5fa" },
    { label: "Cenas", value: 25, color: "#a78bfa" },
  ],
}
