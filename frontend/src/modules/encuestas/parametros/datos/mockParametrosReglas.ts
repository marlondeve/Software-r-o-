export type EstadoRegla = "activa" | "borrador"

export interface ReglaActiva {
  id: string
  descripcion: string
  estado: EstadoRegla
  modificado: string
}

export const CAMPOS_DATOS = [
  "EPS del Paciente",
  "Tipo de Paciente",
  "Vía de Ingreso",
  "Servicio",
  "Edad del Paciente",
]

export const OPERADORES_LOGICOS = [
  "Es exactamente igual a",
  "Es diferente de",
  "Contiene",
  "Es mayor a",
  "Es menor a",
]

export const OPERADOR_A_TEXTO: Record<string, string> = {
  "Es exactamente igual a": "sea exactamente igual a",
  "Es diferente de": "sea diferente de",
  Contiene: "contenga",
  "Es mayor a": "sea mayor a",
  "Es menor a": "sea menor a",
}

export const ACCIONES_FORMULARIO = [
  "Mostrar pregunta específica",
  "Ocultar pregunta específica",
  "Ocultar sección completa",
  "Marcar como obligatoria",
]

export const ACCION_A_VERBO: Record<string, string> = {
  "Mostrar pregunta específica": "Mostrar la pregunta",
  "Ocultar pregunta específica": "Ocultar la pregunta",
  "Ocultar sección completa": "Ocultar la sección",
  "Marcar como obligatoria": "Marcar como obligatoria la pregunta",
}

export const OBJETIVOS_FORMULARIO = [
  "Calidad del servicio percibido",
  "Satisfacción General",
  "Datos Básicos",
  "Sección Autorizaciones",
  "Pregunta PGP Específica",
]

export const EPS_SIMULACION = ["Sura EPS", "Nueva EPS", "Coomeva EPS", "Sanitas EPS"]
export const CONTRATOS_SIMULACION = ["PGP", "Evento", "Capitación"]

export const mockParametrosReglas = {
  conflicto: {
    reglaConflicto: "Regla #14",
    reglaActual: "Ocultar sección cuando EPS es Sura",
  },
  reglasActivas: [
    {
      id: "R1",
      descripcion: 'Ocultar "Acompañante" si Tipo = Paciente Solo',
      estado: "activa",
      modificado: "Hace 2 días",
    },
    {
      id: "R2",
      descripcion: 'Obligatorio "Motivo de traslado" si Vía = Remisión',
      estado: "borrador",
      modificado: "Hace 5 días",
    },
  ] satisfies ReglaActiva[],
  secciones: [
    "Datos Básicos",
    "Calidad del servicio",
    "Satisfacción General",
    "Sección Autorizaciones",
    "Pregunta PGP Específica",
  ],
  visiblesSiempre: ["Datos Básicos", "Satisfacción General"],
  ocultasSiempre: ["Sección Autorizaciones", "Pregunta PGP Específica"],
}
