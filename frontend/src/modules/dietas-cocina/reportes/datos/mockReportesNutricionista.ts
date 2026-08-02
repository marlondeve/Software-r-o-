import {
  chartPaletteComidas,
  colorCategoricoPorIndice,
  colorMotivoRechazoPorIndice,
  colorMotivoRecogidaPorIndice,
  segmentoResumenMockColores,
} from "@/modules/dietas-cocina/reportes/lib/reportesEstilos"

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
      { label: "Entregado (75%)", value: 3150, color: segmentoResumenMockColores.entregado },
      { label: "Cocina (15%)", value: 630, color: segmentoResumenMockColores.enCocina },
      { label: "Pendiente (10%)", value: 420, color: segmentoResumenMockColores.pendiente },
    ],
  },
  tiposDieta: [
    { label: "Normal", value: 42, color: colorCategoricoPorIndice(0) },
    { label: "Hiposódica", value: 28, color: colorCategoricoPorIndice(1) },
    { label: "Diabética", value: 18, color: colorCategoricoPorIndice(2) },
    { label: "Líquida", value: 8, color: colorCategoricoPorIndice(3) },
    { label: "Blanda", value: 4, color: colorCategoricoPorIndice(4) },
  ],
  motivosDevolucion: [
    { label: "Rechazo paciente", value: 45, color: colorMotivoRechazoPorIndice(0) },
    { label: "Temperatura", value: 30, color: colorMotivoRechazoPorIndice(1) },
    { label: "Error cocina", value: 25, color: colorMotivoRechazoPorIndice(2) },
  ],
  motivosRecogida: [
    { label: "Se consumió", value: 40, color: colorMotivoRecogidaPorIndice(0) },
    { label: "No se consumió", value: 35, color: colorMotivoRecogidaPorIndice(1) },
    { label: "Consumo parcial", value: 25, color: colorMotivoRecogidaPorIndice(2) },
  ],
  distribucionServicio: [
    { label: "Desayunos", value: 45, color: chartPaletteComidas.desayuno },
    { label: "Almuerzos", value: 30, color: chartPaletteComidas.almuerzo },
    { label: "Cenas", value: 25, color: chartPaletteComidas.cena },
  ],
}
