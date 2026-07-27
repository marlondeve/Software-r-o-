export type EstadoDieta =
  | "confirmada"
  | "guardado"
  | "no-solicitada"
  | "preparando"
  | "en-preparacion"
  | "lista-despacho"
  | "por-iniciar"
  | "recibida"
  | "devuelta"
  | "cancelada"
  | "despachada"

export type TiempoComida =
  | "desayuno"
  | "merienda-manana"
  | "almuerzo"
  | "merienda-tarde"
  | "cena"
  | "merienda-noche"

export type ModoCargaAnticipada =
  | "todas-desde-manana"
  | "ventana-por-comida"

export type EstadoCocina =
  | "por_iniciar"
  | "en_preparacion"
  | "lista"
  | "despachada"
  | "cancelada"

export type EstadoEtiqueta = "pendiente" | "generada" | "impresa" | "reimpresa"

export type EstadoLogisticaEtiqueta =
  | "generada"
  | "impresa"
  | "pre_entregada"
  | "entregada"
  | "devuelta"

export type ModoFlujoEtiqueta = "pre-entrega" | "entrega" | "devolucion"

export type EstadoConciliacion =
  | "coincide"
  | "dif-cantidad"
  | "dif-tarifa"
  | "pendiente"
  | "conciliado-manual"

export type EstadoDietaCatalogo = "vigente" | "programada" | "vencida"

export type EstadoCategoria = "activo" | "borrador"

export type ResultadoAuditoria = "exitoso" | "fallido"

export type ModuloAuditoria =
  | "dietas"
  | "cocina"
  | "etiquetas"
  | "reportes"
  | "conciliacion"
  | "parametros"
  | "usuarios"
  | "inicio"

export type EstadoUsuario = "activo" | "inactivo"

export type OrigenUsuario = "Vital API" | "Bital"

export type FiltroSeguimientoCocina =
  | "Todos"
  | "en_transito"
  | "pre_entregada"
  | "entregada"
  | "devuelta"

export type RolDietas =
  | "Administrador"
  | "Nutricionista"
  | "Doctor"
  | "Proveedor"
  | "Enfermera"

export type RutaDietas =
  | "inicio"
  | "dietas"
  | "dietas-tarifas"
  | "cocina"
  | "etiquetas"
  | "reportes"
  | "conciliacion"
  | "parametros"
  | "auditoria"
  | "usuarios"

export const MOTIVOS_DEVOLUCION = [
  "Paciente no estaba en habitación",
  "Paciente en NPO o ayuno",
  "Paciente se negó antes de recibir",
  "Bandeja incorrecta para el paciente",
  "Bandeja dañada o contaminada",
  "Temperatura inadecuada",
  "Se consumió",
  "Consumo parcial",
  "No se consumió",
  "Bandeja sin abrir",
] as const

export type MotivoDevolucion = (typeof MOTIVOS_DEVOLUCION)[number]

export const MOTIVOS_CANCELACION = [
  { id: "alta-medica", label: "Alta médica" },
  { id: "traslado", label: "Traslado" },
  { id: "fallecimiento", label: "Fallecimiento" },
  { id: "npo", label: "NPO / Nada vía oral" },
  { id: "error-solicitud", label: "Error de solicitud" },
  { id: "otro", label: "Otro" },
] as const

export type MotivoCancelacionId = (typeof MOTIVOS_CANCELACION)[number]["id"]

export const MOTIVOS_NOVEDAD = [
  "Cambio clínico",
  "Ajuste de consistencia",
  "Modificación por alergia",
  "Corrección de solicitud",
  "Otro",
] as const
