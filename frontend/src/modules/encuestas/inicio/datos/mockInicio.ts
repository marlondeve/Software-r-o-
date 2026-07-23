export type TipoCaptura = "telefonica" | "presencial"
export type EstadoCaptura = "completada" | "revision"

interface KpiDato {
  label: string
  value: string
  trend: {
    direction: "up" | "down"
    texto: string
    tono?: "positivo" | "alerta"
  }
  footnote?: string
  progreso?: number
  iconTone?: "default" | "alerta"
}

const kpis: KpiDato[] = [
  {
    label: "Pacientes Elegibles",
    value: "1,245",
    trend: { direction: "up", texto: "4.5%" },
    footnote: "vs mes anterior",
  },
  {
    label: "Encuestas Completadas",
    value: "892",
    trend: { direction: "up", texto: "12%" },
    progreso: 72,
  },
  {
    label: "Calificaciones Negativas",
    value: "34",
    trend: { direction: "down", texto: "2.1%", tono: "alerta" },
    footnote: "Requieren gestión inmediata",
    iconTone: "alerta",
  },
  {
    label: "Recomendación IPS (NPS)",
    value: "78",
    trend: { direction: "up", texto: "5 pts" },
    footnote: "Nivel Excelente",
  },
]

export const mockInicioEncuestas = {
  fecha: "24 de Octubre de 2023",
  periodo: "Octubre 2023",
  sincronizadoHaceMin: 5,
  kpis,
  capturasRecientes: [
    {
      id: "890123",
      paciente: "Carlos Ramírez",
      tipo: "telefonica" as TipoCaptura,
      fecha: "Hoy, 10:45 AM",
      puntuacion: 9,
      puntuacionMax: 10,
      estado: "completada" as EstadoCaptura,
    },
    {
      id: "456789",
      paciente: "Ana Martínez",
      tipo: "presencial" as TipoCaptura,
      fecha: "Ayer, 16:30 PM",
      puntuacion: 4,
      puntuacionMax: 10,
      estado: "revision" as EstadoCaptura,
    },
  ],
  accionesRapidas: [
    {
      title: "Iniciar Captura Telefónica",
      description: "Llamadas programadas: 5",
      to: "/encuestas/captura-telefonica",
    },
    {
      title: "Registro Presencial",
      description: "Habitación o Área",
      to: "/encuestas/captura-presencial",
    },
  ],
  ultimaSincronizacion: {
    fuente: "SISMA",
    haceMin: 5,
  },
  indicadoresClave: [
    { label: "Trato del personal", value: 78, color: "#006671" },
    { label: "Infraestructura", value: 88, color: "#94a3b8" },
    { label: "Comunicación", value: 52, color: "#00818f" },
    { label: "Alimentación", value: 91, color: "#bbf244" },
    { label: "Admisión", value: 24, color: "#f4c7cc" },
  ],
  requierenAtencion: [
    {
      title: "12 Calificaciones negativas",
      description: "Sin gestión asignada. Área: Urgencias.",
    },
    {
      title: "3 Fallas de sincronización",
      description: "Error al conectar con SISMA.",
    },
    {
      title: "45 Atendidos sin encuesta",
      description: "Pacientes dados de alta hace > 48h.",
    },
  ],
}
