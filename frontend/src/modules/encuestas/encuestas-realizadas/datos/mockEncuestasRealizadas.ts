export type EstadoEncuesta = "completada" | "incompleta" | "anulada"
export type CanalEncuesta = "telefono" | "presencial"

export interface FilaEncuestaRealizada {
  id: string
  consecutivo: string
  fecha: string
  paciente: string
  documento: string
  entidad: string
  servicio: string
  puntoAtencion: string
  canal: CanalEncuesta
  encuestador: string
  sat: number | null
  nps: number | null
  estado: EstadoEncuesta
  comentarioNegativo?: boolean
  motivoAnulacion?: string
}

export const CANALES: { value: CanalEncuesta; label: string }[] = [
  { value: "telefono", label: "Teléfono" },
  { value: "presencial", label: "Presencial" },
]
export const EPS_ENTIDADES = ["Sanitas EPS", "Nueva EPS", "Sura EPS", "Particular"]
export const SERVICIOS = ["Urgencias", "Consulta Externa", "Hospitalización", "UCI"]
export const PUNTOS_ATENCION = ["Sede Principal", "Sede Norte", "Sede Sur"]
export const ENCUESTADORES = ["Ana Torres", "Julián Pérez", "Camila Ríos", "Laura Torres"]
export const ESTADOS: { value: EstadoEncuesta; label: string }[] = [
  { value: "completada", label: "Completada" },
  { value: "incompleta", label: "Incompleta" },
]

export type EstadoSincronizacion = "sincronizado" | "pendiente" | "error"
export type TonoRespuesta = "positivo" | "neutro" | "negativo"

export interface RespuestaEncuestaDetalle {
  numero: number
  pregunta: string
  valor: number
  etiqueta: string
  tono: TonoRespuesta
  comentarioObligatorio?: string
}

export interface EventoHistorialEncuesta {
  titulo: string
  detalle: string
  actual?: boolean
}

export interface DetalleEncuestaRealizada {
  idCompleto: string
  canalDetalle: string
  estadoSincronizacion: EstadoSincronizacion
  respuestas: RespuestaEncuestaDetalle[]
  historial: EventoHistorialEncuesta[]
}

const detallesEncuesta: Record<string, DetalleEncuestaRealizada> = {
  "1": {
    idCompleto: "ENC-2023-0840",
    canalDetalle: "Telefónico",
    estadoSincronizacion: "sincronizado",
    respuestas: [
      {
        numero: 1,
        pregunta: "¿Cómo calificaría la atención recibida por nuestro personal?",
        valor: 10,
        etiqueta: "Excelente",
        tono: "positivo",
      },
      {
        numero: 2,
        pregunta: "¿Qué tan probable es que nos recomiende?",
        valor: 9,
        etiqueta: "Muy probable",
        tono: "positivo",
      },
    ],
    historial: [
      {
        titulo: "Encuesta Completada",
        detalle: "24 Oct 2023, 10:30 AM - Ana Torres",
        actual: true,
      },
      {
        titulo: "Sincronizada con Hosvital",
        detalle: "24 Oct 2023, 10:32 AM - Sistema",
      },
    ],
  },
  "2": {
    idCompleto: "ENC-2023-0842",
    canalDetalle: "Presencial Piso 4",
    estadoSincronizacion: "sincronizado",
    respuestas: [
      {
        numero: 1,
        pregunta:
          "¿Cómo califica la atención recibida por parte de nuestro personal médico?",
        valor: 5,
        etiqueta: "Excelente",
        tono: "positivo",
      },
      {
        numero: 2,
        pregunta: "¿Cómo califica la temperatura de la comida servida?",
        valor: 2,
        etiqueta: "Malo",
        tono: "negativo",
        comentarioObligatorio: "La sopa llegó fría en el almuerzo del martes.",
      },
      {
        numero: 3,
        pregunta: "¿Cómo califica la limpieza de la habitación?",
        valor: 3,
        etiqueta: "Regular",
        tono: "neutro",
      },
    ],
    historial: [
      {
        titulo: "Vista por Administrador",
        detalle: "Hoy, 09:15 AM - Juan Pérez",
        actual: true,
      },
      {
        titulo: "Sincronizada con Hosvital",
        detalle: "12 Oct 2023, 14:31 PM - Sistema",
      },
      {
        titulo: "Encuesta Creada",
        detalle: "12 Oct 2023, 14:30 PM - Laura Torres",
      },
    ],
  },
  "3": {
    idCompleto: "ENC-2023-0838",
    canalDetalle: "Presencial",
    estadoSincronizacion: "pendiente",
    respuestas: [
      {
        numero: 1,
        pregunta: "¿Cómo calificaría la atención recibida por nuestro personal?",
        valor: 3,
        etiqueta: "Regular",
        tono: "neutro",
      },
    ],
    historial: [
      {
        titulo: "Encuesta Iniciada",
        detalle: "23 Oct 2023, 16:45 PM - Julián Pérez",
        actual: true,
      },
    ],
  },
}

export const mockEncuestasRealizadas = {
  rangoFechas: { from: "2023-10-01", to: "2023-10-31" },
  totalRegistros: 45,
  filas: [
    {
      id: "1",
      consecutivo: "#ENC-1024",
      fecha: "24 Oct, 10:30",
      paciente: "Maria Gonzalez Perez",
      documento: "CC: 1029384756",
      entidad: "Sanitas EPS",
      servicio: "Urgencias",
      puntoAtencion: "Sede Principal",
      canal: "telefono",
      encuestador: "Ana Torres",
      sat: 10,
      nps: 9,
      estado: "completada",
    },
    {
      id: "2",
      consecutivo: "#ENC-1023",
      fecha: "24 Oct, 09:15",
      paciente: "Carlos Arturo Ruiz",
      documento: "CC: 79483721",
      entidad: "Nueva EPS",
      servicio: "Consulta Externa",
      puntoAtencion: "Sede Norte",
      canal: "presencial",
      encuestador: "Laura Torres",
      sat: 4,
      nps: 3,
      estado: "completada",
      comentarioNegativo: true,
    },
    {
      id: "3",
      consecutivo: "#ENC-1022",
      fecha: "23 Oct, 16:45",
      paciente: "Lucia Fernandez",
      documento: "CC: 32098475",
      entidad: "Particular",
      servicio: "Hospitalización",
      puntoAtencion: "Sede Principal",
      canal: "presencial",
      encuestador: "Julián Pérez",
      sat: null,
      nps: null,
      estado: "incompleta",
    },
  ] satisfies FilaEncuestaRealizada[],
  detalles: detallesEncuesta,
}
