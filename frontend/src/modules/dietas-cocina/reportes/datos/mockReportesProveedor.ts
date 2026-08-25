import {
  chartPaletteComidas,
  colorCategoricoPorIndice,
  colorMotivoRechazoPorIndice,
  colorMotivoRecogidaPorIndice,
  segmentoResumenMockColores,
} from "@/modules/dietas-cocina/reportes/lib/reportesEstilos"

export const mockReportesProveedor = {
  filtros: {
    rangoFechas: "Seleccionar rango",
    servicio: "Todos los servicios",
    horario: "Todos los turnos",
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
      tiempo: "00:22",
      tendencia: "↓4%",
      tendenciaVariant: "positive" as const,
    },
    {
      etapa: "Etiquetado → Despacho",
      tiempo: "00:15",
      tendencia: "↑3% Alert",
      tendenciaVariant: "negative" as const,
    },
    {
      etapa: "Despacho → Recepción",
      tiempo: "00:28",
      tendencia: "↑6% Alert",
      tendenciaVariant: "negative" as const,
    },
    {
      etapa: "Recepción → Recogida",
      tiempo: "00:19",
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
      variant: "warning" as const,
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
      { label: "Entregado (68%)", value: 1258, color: segmentoResumenMockColores.entregado },
      { label: "En tránsito (22%)", value: 407, color: segmentoResumenMockColores.enTransito },
      {
        label: "En preparación (10%)",
        value: 185,
        color: segmentoResumenMockColores.enPreparacion,
      },
    ],
  },
  tiposDieta: [
    { label: "General", value: 38, color: colorCategoricoPorIndice(0) },
    { label: "Baja en sodio", value: 24, color: colorCategoricoPorIndice(1) },
    { label: "Líquida estricta", value: 16, color: colorCategoricoPorIndice(2) },
    { label: "Hipocalórica", value: 14, color: colorCategoricoPorIndice(3) },
    { label: "Blanda", value: 8, color: colorCategoricoPorIndice(4) },
  ],
  motivosDevolucion: [
    { label: "Temperatura", value: 40, color: colorMotivoRechazoPorIndice(0) },
    { label: "Demora entrega", value: 35, color: colorMotivoRechazoPorIndice(1) },
    { label: "Error etiquetado", value: 25, color: colorMotivoRechazoPorIndice(2) },
  ],
  motivosRecogida: [
    { label: "Se consumió", value: 38, color: colorMotivoRecogidaPorIndice(0) },
    { label: "Bandeja sin abrir", value: 34, color: colorMotivoRecogidaPorIndice(1) },
    { label: "Consumo parcial", value: 28, color: colorMotivoRecogidaPorIndice(2) },
  ],
  distribucionServicio: [
    { label: "Desayuno", value: 28, color: chartPaletteComidas.desayuno },
    { label: "Almuerzo", value: 34, color: chartPaletteComidas.almuerzo },
    { label: "Cena", value: 38, color: chartPaletteComidas.cena },
  ],
}
