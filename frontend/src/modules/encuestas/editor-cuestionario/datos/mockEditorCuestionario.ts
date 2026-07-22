export type TipoRespuesta =
  | "escala"
  | "numerico"
  | "texto_libre"
  | "opcion_unica"
  | "opcion_multiple"

export interface OpcionRespuesta {
  id: string
  texto: string
  esNegativa: boolean
}

export interface CondicionLogica {
  id: string
  variable: string
  operador: string
  valor: string
}

export interface LogicaCondicional {
  activa: boolean
  condiciones: CondicionLogica[]
}

export interface PreguntaEditor {
  id: string
  codigoInterno: string
  texto: string
  descripcion: string
  tipoRespuesta: TipoRespuesta
  tipoBadgeLabel: string
  requerida: boolean
  habilitada: boolean
  opciones: OpcionRespuesta[]
  servicioAplicable: string
  canalCaptura: "presencial" | "llamada"
  logica: LogicaCondicional
  comportamientoAlerta: string
}

export interface SeccionEditor {
  id: string
  titulo: string
  preguntas: PreguntaEditor[]
}

export const TIPOS_RESPUESTA: { value: TipoRespuesta; label: string; badge: string }[] = [
  { value: "escala", label: "Escala de Satisfacción (1-5)", badge: "Escala" },
  { value: "numerico", label: "Numérico", badge: "Numérico" },
  { value: "texto_libre", label: "Texto libre", badge: "Texto" },
  { value: "opcion_unica", label: "Opción única", badge: "Opción única" },
  { value: "opcion_multiple", label: "Opción múltiple", badge: "Opción múltiple" },
]

export const SERVICIOS_APLICABLES = [
  "Urgencias",
  "Consulta Externa",
  "Hospitalización",
  "UCI",
]

export const COMPORTAMIENTOS_ALERTA = [
  "Requerir comentario explicativo",
  "Notificar al supervisor del área",
  "Ninguno",
]

export const OPERADORES_LOGICA = ["es", "no es", "es mayor a", "es menor a"]

export const mockEditorCuestionario = {
  id: "1",
  nombre: "Satisfacción - Urgencias",
  secciones: [
    {
      id: "sec-1",
      titulo: "1. Satisfacción Global",
      preguntas: [
        {
          id: "PRG-1042",
          codigoInterno: "URG_SAT_MED_01",
          texto:
            "¿Cómo califica la atención recibida por el personal médico de urgencias durante su visita de hoy?",
          descripcion: "",
          tipoRespuesta: "escala",
          tipoBadgeLabel: "Escala",
          requerida: true,
          habilitada: true,
          opciones: [
            { id: "opt-1", texto: "Excelente", esNegativa: false },
            { id: "opt-2", texto: "Buena", esNegativa: false },
            { id: "opt-3", texto: "Deficiente", esNegativa: true },
          ],
          servicioAplicable: "Urgencias",
          canalCaptura: "presencial",
          logica: {
            activa: true,
            condiciones: [
              {
                id: "cond-1",
                variable: "Respuesta anterior",
                operador: "es menor a",
                valor: "Inferior a 3",
              },
            ],
          },
          comportamientoAlerta: "Requerir comentario explicativo",
        },
        {
          id: "PRG-1043",
          codigoInterno: "URG_TIEMPO_ESPERA",
          texto: "Tiempo de espera en sala",
          descripcion: "Tiempo aproximado en minutos que esperó antes de ser atendido.",
          tipoRespuesta: "numerico",
          tipoBadgeLabel: "Numérico",
          requerida: false,
          habilitada: true,
          opciones: [],
          servicioAplicable: "Urgencias",
          canalCaptura: "presencial",
          logica: { activa: false, condiciones: [] },
          comportamientoAlerta: "Ninguno",
        },
      ],
    },
    {
      id: "sec-2",
      titulo: "2. Recomendación (NPS)",
      preguntas: [
        {
          id: "PRG-1044",
          codigoInterno: "URG_NPS_01",
          texto:
            "¿Qué tan probable es que recomiende nuestra clínica a un familiar o amigo?",
          descripcion: "",
          tipoRespuesta: "escala",
          tipoBadgeLabel: "Escala",
          requerida: true,
          habilitada: true,
          opciones: [
            { id: "opt-4", texto: "Muy probable", esNegativa: false },
            { id: "opt-5", texto: "Poco probable", esNegativa: true },
          ],
          servicioAplicable: "Urgencias",
          canalCaptura: "presencial",
          logica: { activa: false, condiciones: [] },
          comportamientoAlerta: "Notificar al supervisor del área",
        },
      ],
    },
  ] satisfies SeccionEditor[],
}
