import type { ModuloAuditoria } from "@/modules/dietas-cocina/types/enums"

/** Valores de módulo tal como los persiste el backend. */
export const MODULOS_API = [
  "Dietas",
  "Catalogo",
  "Ordenes",
  "Etiquetas",
  "Conciliacion",
  "Parametros",
  "Usuarios",
  "Roles",
] as const

export type ModuloAuditoriaApi = (typeof MODULOS_API)[number]

/** Módulos disponibles en el filtro UI (sin reportes/inicio). */
export const MODULOS_FILTRO: ModuloAuditoria[] = [
  "dietas",
  "catalogo",
  "cocina",
  "etiquetas",
  "conciliacion",
  "parametros",
  "usuarios",
]

export const MODULO_UI_A_API: Record<ModuloAuditoria, ModuloAuditoriaApi | string> = {
  dietas: "Dietas",
  catalogo: "Catalogo",
  cocina: "Ordenes",
  etiquetas: "Etiquetas",
  reportes: "Reportes",
  conciliacion: "Conciliacion",
  parametros: "Parametros",
  usuarios: "Usuarios",
  inicio: "Inicio",
}

export const MODULO_API_A_UI: Record<string, ModuloAuditoria> = {
  dietas: "dietas",
  catalogo: "catalogo",
  ordenes: "cocina",
  cocina: "cocina",
  etiquetas: "etiquetas",
  reportes: "reportes",
  conciliacion: "conciliacion",
  parametros: "parametros",
  usuarios: "usuarios",
  roles: "usuarios",
  inicio: "inicio",
  auth: "usuarios",
}

export const MODULO_LABEL_FILTRO: Record<ModuloAuditoria, string> = {
  dietas: "Dietas",
  catalogo: "Catálogo y tarifas",
  cocina: "Cocina / órdenes",
  etiquetas: "Etiquetas",
  reportes: "Reportes",
  conciliacion: "Conciliación",
  parametros: "Parámetros",
  usuarios: "Usuarios y roles",
  inicio: "Inicio",
}

/** Acciones del backend con etiqueta legible en español. */
export const ACCIONES_AUDITORIA: { valor: string; etiqueta: string }[] = [
  { valor: "Solicitar", etiqueta: "Solicitar dieta" },
  { valor: "Confirmar", etiqueta: "Confirmar dieta" },
  { valor: "ConfirmarMasivo", etiqueta: "Confirmar masivo" },
  { valor: "Cancelar", etiqueta: "Cancelar" },
  { valor: "Reactivar", etiqueta: "Reactivar dieta" },
  { valor: "Novedad", etiqueta: "Registrar novedad" },
  { valor: "Crear", etiqueta: "Crear" },
  { valor: "Actualizar", etiqueta: "Actualizar" },
  { valor: "Desactivar", etiqueta: "Desactivar" },
  { valor: "RegistrarTarifa", etiqueta: "Registrar tarifa" },
  { valor: "ActualizarEstado", etiqueta: "Actualizar estado" },
  { valor: "ActualizarChecklist", etiqueta: "Actualizar checklist" },
  { valor: "Generar", etiqueta: "Generar" },
  { valor: "Imprimir", etiqueta: "Imprimir" },
  { valor: "Reimprimir", etiqueta: "Reimprimir" },
  { valor: "PreEntrega", etiqueta: "Pre-entrega" },
  { valor: "Entrega", etiqueta: "Entrega" },
  { valor: "Devolucion", etiqueta: "Devolución" },
  { valor: "MarcarConciliado", etiqueta: "Marcar conciliado" },
  { valor: "MarcarPendiente", etiqueta: "Marcar pendiente" },
  { valor: "CargarPlanilla", etiqueta: "Cargar planilla de cocina" },
  { valor: "SubirFactura", etiqueta: "Subir factura" },
  { valor: "ActualizarTiempos", etiqueta: "Actualizar tiempos de comida" },
  { valor: "ActualizarCategoriasEdad", etiqueta: "Actualizar categorías de edad" },
  { valor: "Editar", etiqueta: "Editar" },
  { valor: "CambiarRol", etiqueta: "Cambiar rol" },
  { valor: "CambiarEstado", etiqueta: "Cambiar estado" },
  { valor: "RestablecerClave", etiqueta: "Restablecer clave" },
  { valor: "CambiarClave", etiqueta: "Cambiar clave" },
  { valor: "Login", etiqueta: "Inicio de sesión" },
  { valor: "Renombrar", etiqueta: "Renombrar rol" },
  { valor: "ActualizarPermisos", etiqueta: "Actualizar permisos" },
  { valor: "Eliminar", etiqueta: "Eliminar" },
]

export const ACCION_LABEL: Record<string, string> = Object.fromEntries(
  ACCIONES_AUDITORIA.map(({ valor, etiqueta }) => [valor, etiqueta]),
)

export function etiquetaAccion(accion: string): string {
  if (!accion) return "—"
  return ACCION_LABEL[accion] ?? accion.replace(/([a-z])([A-Z])/g, "$1 $2")
}

export const TIPO_ENTIDAD_LABEL: Record<string, string> = {
  FilaDieta: "Dieta de paciente",
  DietaCatalogo: "Dieta del catálogo",
  TarifaDieta: "Tarifa de dieta",
  OrdenCocina: "Orden de cocina",
  EtiquetaEnfermera: "Etiqueta",
  FilaConciliacion: "Fila de conciliación",
  ParametroOperativo: "Parámetro operativo",
  UsuarioModulo: "Usuario del módulo",
  RolModulo: "Rol del módulo",
  TiempoComidaConfig: "Configuración de comida",
}

export function etiquetaEntidad(tipoEntidad: string): string {
  if (!tipoEntidad) return "Registro"
  return TIPO_ENTIDAD_LABEL[tipoEntidad] ?? tipoEntidad.replace(/([a-z])([A-Z])/g, "$1 $2")
}

/** Etiquetas legibles para campos JSON frecuentes. */
export const CAMPO_LABEL: Record<string, string> = {
  estado: "Estado",
  estadoLogistica: "Estado logístico",
  consistencia: "Consistencia",
  tipoDietaId: "Tipo de dieta",
  count: "Cantidad",
  codigo: "Código",
  entregadoPor: "Entregado por",
  ordenIds: "Órdenes",
  etiquetasIds: "Etiquetas",
  ids: "Registros",
  paciente: "Paciente",
  dieta: "Dieta",
  tiempoComida: "Tiempo de comida",
  horaCierre: "Hora de cierre",
  impresora: "Impresora",
  cantidad: "Cantidad",
  turno: "Turno",
  motivo: "Motivo",
  accion: "Acción",
}

export const VALOR_ESTADO_LABEL: Record<string, string> = {
  generada: "Generada",
  impresa: "Impresa",
  pre_entregada: "Pre-entregada",
  entregada: "Entregada",
  devuelta: "Devuelta",
  // Estados de dieta tal como los persiste el backend (enum EstadoDieta).
  Pendiente: "Pendiente",
  Guardado: "Guardado",
  Solicitada: "Solicitada",
  Confirmada: "Confirmada",
  EnPreparacion: "En preparación",
  ListaEnvio: "Lista para despacho",
  EnRuta: "En ruta",
  Entregada: "Entregada",
  Consumida: "Consumida",
  Cancelada: "Cancelada",
  NoConsumida: "No consumida",
  Devuelta: "Devuelta",
  Exitoso: "Exitoso",
  Fallido: "Fallido",
}

export function etiquetaCampo(campo: string): string {
  return CAMPO_LABEL[campo] ?? campo.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ")
}

export function etiquetaValor(valor: unknown): string {
  if (valor === null || valor === undefined) return "—"
  if (typeof valor === "boolean") return valor ? "Sí" : "No"
  if (typeof valor === "number") return String(valor)
  if (typeof valor === "string") {
    return VALOR_ESTADO_LABEL[valor] ?? VALOR_ESTADO_LABEL[valor.toLowerCase()] ?? valor
  }
  if (Array.isArray(valor)) {
    if (valor.length === 0) return "Ninguno"
    const esUuid = valor.every((v) => typeof v === "string" && v.includes("-"))
    if (esUuid) return `${valor.length} registro${valor.length === 1 ? "" : "s"}`
    return valor.map((v) => etiquetaValor(v)).join(", ")
  }
  if (typeof valor === "object") {
    try {
      return JSON.stringify(valor)
    } catch {
      return String(valor)
    }
  }
  return String(valor)
}

export function acortarRegistroId(registroId: string, maxLen = 12): string {
  const texto = registroId.trim()
  if (!texto || texto === "—") return "—"
  if (texto.length <= maxLen) return texto
  if (texto.includes("-") && texto.length > 20) {
    return `…${texto.slice(-8)}`
  }
  return `${texto.slice(0, maxLen)}…`
}
