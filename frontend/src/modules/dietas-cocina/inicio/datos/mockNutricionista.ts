import type { EstadoDieta } from "@/modules/dietas-cocina/inicio/components/EstadoBadge"

export const mockNutricionista = {
  periodoOperativo: "Almuerzo - 11:30 AM",
  kpis: [
    { label: "Pacientes activos", value: 142, variant: "default" as const },
    { label: "Dietas pendientes", value: 12, variant: "default" as const },
    { label: "Confirmadas", value: 115, variant: "default" as const },
    { label: "Novedades", value: 8, variant: "default" as const },
    { label: "Cancelaciones", value: 3, variant: "alert" as const },
    { label: "Fuera de horario", value: 4, variant: "alert" as const },
  ],
  distribucion: {
    total: 142,
    segmentos: [
      { label: "No solicitada", value: 12, color: "#b00020" },
      { label: "Confirmada", value: 115, color: "#006671" },
      { label: "Devuelta", value: 3, color: "#94a3b8" },
      { label: "Borrador", value: 8, color: "#bbf244" },
      { label: "Recibida", value: 2, color: "#00818f" },
      { label: "Cancelada", value: 2, color: "#d8e0e8" },
    ],
  },
  atencion: [
    {
      title: "Pacientes sin dieta solicitada",
      description: "4 ingresos recientes sin asignación.",
    },
    {
      title: "Cambios pendientes",
      description: "8 modificaciones de enfermería por validar.",
    },
  ],
  actividadReciente: [
    {
      paciente: "301-A / García, M.",
      accion: "Solicitud nueva",
      hora: "11:05",
      estado: "guardado" as EstadoDieta,
    },
    {
      paciente: "305-A / Martínez, R.",
      accion: "Confirmación",
      hora: "10:48",
      estado: "confirmada" as EstadoDieta,
    },
    {
      paciente: "308-B / López, A.",
      accion: "Sin solicitud",
      hora: "10:30",
      estado: "no-solicitada" as EstadoDieta,
    },
    {
      paciente: "312-A / Ruiz, P.",
      accion: "Confirmación",
      hora: "10:15",
      estado: "confirmada" as EstadoDieta,
    },
  ],
  proximoCierre: {
    servicio: "CENA",
    hora: "19:00 HRS",
    tiempoRestante: "2h 15min",
    pendientes: 45,
  },
}
