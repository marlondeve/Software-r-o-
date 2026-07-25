import type { ValorSatisfaccion } from "@/modules/encuestas/types/enums"
import type {
  OpcionEscalaSatisfaccion,
  SeccionEncuesta,
} from "@/modules/encuestas/types/capture"
import type { PacienteContextoEncuesta } from "@/modules/encuestas/types/patients"

export const OPCIONES_SATISFACCION: OpcionEscalaSatisfaccion[] = [
  { valor: "muy_satisfecho", label: "Muy satisfecho" },
  { valor: "satisfecho", label: "Satisfecho" },
  { valor: "neutral", label: "Neutral" },
  { valor: "insatisfecho", label: "Insatisfecho" },
  { valor: "muy_insatisfecho", label: "Muy insatisfecho" },
]

export const VALORES_NEGATIVOS: ValorSatisfaccion[] = ["insatisfecho", "muy_insatisfecho"]

export const MOTIVOS_CALIFICACION_NEGATIVA = [
  "Tiempo de espera",
  "Trato recibido",
  "Falta de información",
  "Dificultad administrativa",
  "Infraestructura",
  "Comunicación",
  "Otro",
]

export const SECCIONES_ENCUESTA: SeccionEncuesta[] = [
  {
    id: "satisfaccion-global",
    numero: 1,
    titulo: "Satisfacción Global",
    pregunta: "¿En términos generales, qué tan satisfecho se encuentra con la atención recibida?",
    tipo: "escala_satisfaccion",
    opciones: [],
  },
  {
    id: "recomendacion",
    numero: 2,
    titulo: "Recomendación",
    pregunta: "¿Recomendaría esta institución a familiares o amigos?",
    tipo: "opcion_unica",
    opciones: [
      { id: "definitivamente_si", label: "Definitivamente sí" },
      { id: "probablemente_si", label: "Probablemente sí" },
      { id: "no_sabe", label: "No sabe" },
      { id: "probablemente_no", label: "Probablemente no" },
      { id: "definitivamente_no", label: "Definitivamente no" },
    ],
  },
  {
    id: "tiempos-espera",
    numero: 3,
    titulo: "Tiempos de Espera",
    pregunta: "¿Cómo califica el tiempo que esperó para ser atendido?",
    tipo: "escala_satisfaccion",
    opciones: [],
  },
  {
    id: "trato-personal",
    numero: 4,
    titulo: "Trato del Personal",
    pregunta:
      "¿Cómo califica el trato recibido por parte del personal médico y de enfermería?",
    tipo: "escala_satisfaccion",
    opciones: [],
  },
  {
    id: "instalaciones",
    numero: 5,
    titulo: "Instalaciones",
    pregunta: "¿Cómo califica el estado y la limpieza de las instalaciones?",
    tipo: "escala_satisfaccion",
    opciones: [],
  },
  {
    id: "comunicacion",
    numero: 6,
    titulo: "Comunicación",
    pregunta:
      "¿Cómo califica la claridad de la información recibida sobre su tratamiento?",
    tipo: "escala_satisfaccion",
    opciones: [],
  },
  {
    id: "comentarios-adicionales",
    numero: 7,
    titulo: "Comentarios Adicionales",
    pregunta: "¿Desea agregar algún comentario adicional sobre su experiencia?",
    tipo: "texto_libre",
    opciones: [],
    opcional: true,
  },
]

export const PACIENTE_CONTEXTO_DEFECTO: PacienteContextoEncuesta = {
  nombre: "Carlos Alberto Ramírez",
  documento: "CC 1.023.456.789",
  eps: "Sura EPS",
  contrato: "Capita Integral 2023",
  servicio: "Urgencias Adultos",
  canal: "presencial",
}
