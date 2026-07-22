export const mockReportesProveedor = {
  filtros: {
    rangoFechas: "Oct 1 - Oct 24, 2023",
    servicio: "Turno actual: Cena",
    horario: "Planta Central",
    ultimaActualizacion: "Hoy, 18:15 PM",
  },
  kpis: [
    {
      label: "Raciones preparadas",
      value: "1,850",
      detalle: "+3.1% vs ant.",
      detalleVariant: "positive" as const,
    },
    {
      label: "Despachadas a tiempo",
      value: "1,720",
      detalle: "92.9% puntualidad",
      detalleVariant: "neutral" as const,
    },
    {
      label: "Recibidas en clínica",
      value: "1,640",
      detalle: "95.3% confirmadas",
      detalleVariant: "neutral" as const,
    },
    {
      label: "Devoluciones",
      value: "86",
      detalle: "4.6% del total",
      detalleVariant: "negative" as const,
    },
    {
      label: "Costo producción",
      value: "$28,400.00",
      detalle: undefined,
      detalleVariant: "neutral" as const,
    },
    {
      label: "Costo por retrasos",
      value: "$980.00",
      detalle: undefined,
      detalleVariant: "negative" as const,
    },
  ],
  hitos: [
    {
      etapa: "Prep. → Etiquetado",
      tiempo: "22 min",
      tendencia: "↓4%",
      tendenciaVariant: "positive" as const,
    },
    {
      etapa: "Etiquetado → Despacho",
      tiempo: "15 min",
      tendencia: "↑3% Alert",
      tendenciaVariant: "negative" as const,
    },
    {
      etapa: "Despacho → Recepción",
      tiempo: "28 min",
      tendencia: "↑6% Alert",
      tendenciaVariant: "negative" as const,
    },
    {
      etapa: "Recepción → Recogida",
      tiempo: "19 min",
      tendencia: "↓2%",
      tendenciaVariant: "positive" as const,
    },
  ],
  hallazgos: [
    {
      variant: "destructive" as const,
      titulo: "Despachos fuera de ventana",
      descripcion:
        "15 órdenes de UCI superaron el tiempo de tránsito estimado hoy.",
    },
    {
      variant: "info" as const,
      titulo: "Etiquetas pendientes",
      descripcion:
        "40 raciones listas sin escaneo de despacho en Planta Central.",
    },
    {
      variant: "warning" as const,
      titulo: "Recolección de vajilla",
      descripcion: "Piso 2 con recolección pendiente desde hace 45 minutos.",
    },
  ],
  estadoDietas: {
    total: "1.8k",
    totalNumerico: 1850,
    segmentos: [
      { label: "Entregado (68%)", value: 1258, color: "#006671" },
      { label: "En tránsito (22%)", value: 407, color: "#00818f" },
      { label: "En preparación (10%)", value: 185, color: "#bbf244" },
    ],
  },
  tiposDieta: [
    { label: "General", value: 38, color: "#006671" },
    { label: "Baja en sodio", value: 24, color: "#00818f" },
    { label: "Líquida estricta", value: 16, color: "#7c6ba8" },
    { label: "Hipocalórica", value: 14, color: "#4a6700" },
    { label: "Blanda", value: 8, color: "#94a3b8" },
  ],
  motivosDevolucion: [
    { label: "Temperatura", value: 40, color: "#60a5fa" },
    { label: "Demora entrega", value: 35, color: "#e879a9" },
    { label: "Error etiquetado", value: 25, color: "#a78bfa" },
  ],
  distribucionServicio: [
    { label: "Desayuno", value: 28, color: "#e879a9" },
    { label: "Almuerzo", value: 34, color: "#60a5fa" },
    { label: "Cena", value: 38, color: "#a78bfa" },
  ],
}
