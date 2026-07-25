export type RolEncuestas = "Administrador" | "Encuestador"

export type RutaEncuestasModulo =
  | "inicio"
  | "captura-presencial"
  | "captura-telefonica"
  | "encuestas-realizadas"
  | "cuestionarios"
  | "indicadores"
  | "parametros"
  | "auditoria"
  | "usuarios"

export type TipoCaptura = "telefonica" | "presencial"
export type EstadoCaptura = "completada" | "revision"

export type CanalPaciente = "telefonica" | "presencial"

export type EstadoPaciente = "pendiente" | "en_proceso" | "completada" | "no_disponible"

export type EstadoLlamada =
  | "pendiente"
  | "reintento"
  | "no_contesta"
  | "rechazo"
  | "completada"

export type ResultadoLlamada =
  | "acepta_encuesta"
  | "solicita_posterior"
  | "no_contesta"
  | "ocupado"
  | "telefono_apagado"
  | "rechaza_participar"

export type TipoPreguntaEncuesta = "escala_satisfaccion" | "opcion_unica" | "texto_libre"

export type ValorSatisfaccion =
  | "muy_satisfecho"
  | "satisfecho"
  | "neutral"
  | "insatisfecho"
  | "muy_insatisfecho"

export type EstadoEncuesta = "completada" | "incompleta" | "anulada"
export type CanalEncuesta = "telefono" | "presencial"

export type EstadoSincronizacion = "sincronizado" | "pendiente" | "error"
export type TonoRespuesta = "positivo" | "neutro" | "negativo"

export type EstadoCuestionario = "activo" | "inactivo" | "borrador"
export type CanalCuestionario = "presencial" | "telefonico" | "ambos"

export type TipoRespuesta =
  | "escala"
  | "numerico"
  | "texto_libre"
  | "opcion_unica"
  | "opcion_multiple"

export type ContactoBrecha = "valido" | "na" | "invalido"
export type EstadoBrecha = "en_gestion" | "pendiente" | "justificado"
export type TonoMotivoBrecha = "neutro" | "negativo"

export type EstadoRegla = "activa" | "borrador"

export type ResultadoAuditoriaEncuestas = "exito" | "denegado"

export type EstadoUsuarioEncuestas = "activo" | "inactivo"
export type OrigenUsuarioEncuestas = "Vital API" | "Bital"
