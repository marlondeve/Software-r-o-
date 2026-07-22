import type { EstadoDieta } from "@/modules/dietas-cocina/inicio/components/EstadoBadge"

export const mockEnfermera = {
  piso: "Piso 3 - Ala Norte",
  servicioEnCurso: "Almuerzo en curso (45 min est.)",
  kpis: [
    { label: "Solicitudes pendientes", value: 5 },
    { label: "Dietas confirmadas", value: 28 },
    { label: "Novedades de hoy", value: 2, alert: true },
  ],
  dietasRecientes: [
    {
      habitacion: "301-A",
      paciente: "García, M.",
      tipo: "Blanda / Sin sal",
      estado: "confirmada" as EstadoDieta,
    },
    {
      habitacion: "305-A",
      paciente: "Martínez, R.",
      tipo: "Hipocalórica",
      estado: "preparando" as EstadoDieta,
    },
    {
      habitacion: "308-B",
      paciente: "López, A.",
      tipo: "General",
      estado: "confirmada" as EstadoDieta,
    },
    {
      habitacion: "310-A",
      paciente: "Ruiz, P.",
      tipo: "Líquida",
      estado: "preparando" as EstadoDieta,
    },
  ],
  alertas: [
    {
      habitacion: "310-A",
      titulo: "Ayuno estricto",
      descripcion:
        "Cirugía programada 14:00. Suspender dieta actual.",
    },
    {
      habitacion: "304-B",
      titulo: "Alergia reportada",
      descripcion: "Alergia a mariscos añadida por Nutrición.",
    },
  ],
  contactoNutricion: {
    extension: "4052",
    descripcion: "Dudas urgentes sobre cambios en dietas durante el servicio.",
  },
}
