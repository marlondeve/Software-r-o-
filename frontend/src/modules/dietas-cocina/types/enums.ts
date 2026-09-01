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
  | "recogida"
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
  | "dif-tipo"
  | "dif-tarifa"
  | "pendiente"
  | "con-alerta"
  | "conciliado-manual"

export type EstadoDietaCatalogo = "vigente" | "programada" | "vencida" | "inactiva"

export type EstadoCategoria = "activo" | "borrador"

export type ResultadoAuditoria = "exitoso" | "fallido"

export type ModuloAuditoria =
  | "dietas"
  | "catalogo"
  | "cocina"
  | "etiquetas"
  | "reportes"
  | "conciliacion"
  | "parametros"
  | "usuarios"
  | "inicio"

export type EstadoUsuario = "activo" | "inactivo"

export type OrigenUsuario = "Vital API" | "RioSoft"

export type FiltroSeguimientoCocina =
  | "Todos"
  | "en_transito"
  | "pre_entregada"
  | "entregada"
  | "devuelta"
  | "recogida"

/** Nombre de rol del módulo dietas-cocina (dinámico, gestionado en Usuarios y roles). */
export type RolDietas = string

/** Permisos granulares dentro del módulo Etiquetas. */
export type CapacidadEtiquetas =
  | "impresion_proveedor"
  | "recepcion_proveedor"
  | "entrega_paciente"
  | "rechazo_antes_entrega"
  | "recogida_bandeja"

export type RutaDietas =
  | "inicio"
  | "dietas"
  | "dietas-tarifas"
  | "cocina"
  | "impresion-etiquetas"
  | "recepcion-proveedor"
  | "bandejas-piso"
  | "reportes-clinicos"
  | "reportes-produccion"
  | "conciliacion"
  | "parametros"
  | "auditoria"
  | "usuarios"

export const MOTIVOS_DEVOLUCION = [
  "Paciente no estaba en habitación",
  "Paciente en NVO o ayuno",
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
  { id: "nvo", label: "NVO / Nada vía oral" },
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
