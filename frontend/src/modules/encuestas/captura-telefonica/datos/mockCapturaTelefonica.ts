export type EstadoLlamada =
  | "pendiente"
  | "reintento"
  | "no_contesta"
  | "rechazo"
  | "completada"

export interface IntentoLlamada {
  resultado: string
  fecha: string
  gestor: string
  nota?: string
}

export interface FilaCapturaTelefonica {
  id: string
  paciente: string
  documento: string
  telefono: string
  puntoAtencion: string
  servicio: string
  especialidad: string
  eps: string
  fechaCita: string
  intentos: number
  intentosMax: number
  ultimoIntento?: string
  horaReintento?: string
  estado: EstadoLlamada
  historialIntentos: IntentoLlamada[]
}

interface KpiCapturaTelefonica {
  label: string
  value: string
  sublabel?: string
  variant: "highlight" | "default" | "warning" | "destructive" | "success"
}

export type ResultadoLlamada =
  | "acepta_encuesta"
  | "solicita_posterior"
  | "no_contesta"
  | "ocupado"
  | "telefono_apagado"
  | "rechaza_participar"

export const RESULTADOS_LLAMADA: {
  id: ResultadoLlamada
  label: string
  descripcion?: string
  tono?: "negativo"
}[] = [
  {
    id: "acepta_encuesta",
    label: "Contestó y acepta realizar encuesta",
    descripcion: "Inicia el flujo de la encuesta inmediatamente.",
  },
  {
    id: "solicita_posterior",
    label: "Solicita llamada posterior",
    descripcion: "Programa un reintento en fecha específica.",
  },
  { id: "no_contesta", label: "No contesta" },
  { id: "ocupado", label: "Ocupado" },
  { id: "telefono_apagado", label: "Teléfono apagado" },
  { id: "rechaza_participar", label: "Rechaza participar", tono: "negativo" },
]

export const PUNTOS_ATENCION = ["Sede Norte", "Sede Sur", "Sede Centro"]

export const SERVICIOS = [
  "Consulta Externa",
  "Ser Madre e Hijo",
  "Urgencias",
  "Hospitalización",
]

export const mockCapturaTelefonica = {
  rangoFechas: "Hoy, 15 Oct - 22 Oct 2023",
  ultimaSincronizacion: "08:30 AM",
  kpis: [
    {
      label: "Pacientes por contactar",
      value: "142",
      sublabel: "Pendientes",
      variant: "highlight",
    },
    { label: "Contactados", value: "86", variant: "default" },
    { label: "Reintentos pend.", value: "24", variant: "warning" },
    { label: "Sin respuesta", value: "32", variant: "default" },
    { label: "Rechazos", value: "12", variant: "destructive" },
    { label: "Completadas", value: "45", variant: "success" },
  ] satisfies KpiCapturaTelefonica[],
  filas: [
    {
      id: "1",
      paciente: "Ana María Ramírez Vargas",
      documento: "CC 1029384756",
      telefono: "300 123 4567",
      puntoAtencion: "Sede Norte",
      servicio: "Consulta Externa",
      especialidad: "Ginecología",
      eps: "Sanitas EPS",
      fechaCita: "12 Oct 2023",
      intentos: 0,
      intentosMax: 3,
      estado: "pendiente",
      historialIntentos: [],
    },
    {
      id: "2",
      paciente: "Carlos Eduardo López",
      documento: "CC 987654321",
      telefono: "315 987 6543",
      puntoAtencion: "Sede Sur",
      servicio: "Ser Madre e Hijo",
      especialidad: "Pediatría",
      eps: "Sura EPS",
      fechaCita: "13 Oct 2023",
      intentos: 1,
      intentosMax: 3,
      ultimoIntento: "Hoy 09:15",
      horaReintento: "15:30",
      estado: "reintento",
      historialIntentos: [
        {
          resultado: "No contesta",
          fecha: "Hoy, 09:15 AM",
          gestor: "Gestor A",
          nota: "Buzón de voz directo.",
        },
      ],
    },
    {
      id: "3",
      paciente: "Lucía Gómez Martínez",
      documento: "CC 1122334455",
      telefono: "320 444 5555",
      puntoAtencion: "Sede Centro",
      servicio: "Consulta Externa",
      especialidad: "Cardiología",
      eps: "Coomeva EPS",
      fechaCita: "10 Oct 2023",
      intentos: 2,
      intentosMax: 3,
      ultimoIntento: "Ayer 16:40",
      estado: "no_contesta",
      historialIntentos: [
        { resultado: "No contesta", fecha: "Ayer, 16:40 PM", gestor: "Gestor B" },
        {
          resultado: "Ocupado",
          fecha: "10 Oct 2023, 11:20 AM",
          gestor: "Gestor A",
        },
      ],
    },
  ] satisfies FilaCapturaTelefonica[],
}
