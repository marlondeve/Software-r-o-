import type {
  DetalleAuditoriaDto,
  FilaAuditoriaDto,
} from "@/modules/dietas-cocina/types/api-dtos"
import type { ModuloAuditoria, ResultadoAuditoria } from "@/modules/dietas-cocina/types/enums"
import type { CambioAuditoria, DetalleAuditoria, FilaAuditoria } from "@/modules/dietas-cocina/types/audit"
import { formatearFechaHoraCatalogo } from "@/modules/dietas-cocina/dietas-tarifas/lib/dietasTarifasEstilos"

const MODULO_API: Record<string, ModuloAuditoria> = {
  dietas: "dietas",
  ordenes: "cocina",
  cocina: "cocina",
  etiquetas: "etiquetas",
  reportes: "reportes",
  conciliacion: "conciliacion",
  conciliación: "conciliacion",
  parametros: "parametros",
  parámetros: "parametros",
  usuarios: "usuarios",
  inicio: "inicio",
  auth: "usuarios",
}

function normalizarModulo(valor: unknown): ModuloAuditoria {
  const clave = String(valor ?? "dietas")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
  return MODULO_API[clave] ?? "dietas"
}

function normalizarResultado(valor: unknown): ResultadoAuditoria {
  return String(valor ?? "exitoso").toLowerCase() === "fallido" ? "fallido" : "exitoso"
}

function formatearFechaEvento(valor: unknown): string {
  const texto = String(valor ?? "").trim()
  if (!texto) return ""
  const fecha = new Date(texto)
  if (Number.isNaN(fecha.getTime())) return texto
  return formatearFechaHoraCatalogo(fecha)
}

function inicialesDesdeNombre(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean)
  if (partes.length >= 2) {
    return `${partes[0]![0] ?? ""}${partes[1]![0] ?? ""}`.toUpperCase()
  }
  return nombre.slice(0, 2).toUpperCase()
}

function mapUsuarioDto(
  usuario: FilaAuditoriaDto["usuario"],
): FilaAuditoria["usuario"] {
  if (typeof usuario === "string") {
    const nombre = usuario.trim()
    const esSistema = nombre.toLowerCase() === "sistema"
    return {
      nombre: esSistema ? "Sistema" : nombre,
      rol: esSistema ? "Proceso automático" : "Usuario",
      iniciales: esSistema ? "SYS" : inicialesDesdeNombre(nombre),
      esSistema,
    }
  }

  const obj = usuario ?? {}
  const nombre = String(obj.nombre ?? "").trim()
  const iniciales = String(obj.iniciales ?? "").trim() || inicialesDesdeNombre(nombre)
  return {
    nombre,
    rol: String(obj.rol ?? ""),
    iniciales,
    esSistema: obj.esSistema,
  }
}

function codigoAuditoriaDesdeId(id: string, codigo?: string): string {
  if (codigo?.trim()) return codigo.trim()
  const limpio = id.replace(/-/g, "").slice(0, 8).toUpperCase()
  return limpio ? `AUD-${limpio}` : "AUD"
}

function registroDesdeDto(dto: FilaAuditoriaDto): string {
  const registro = String(dto.registroId ?? dto.entidadId ?? "").trim()
  if (registro) return registro
  const tipo = String(dto.tipoEntidad ?? "").trim()
  return tipo || "—"
}

function mapCambiosDto(dto: FilaAuditoriaDto): CambioAuditoria {
  if (dto.cambios && typeof dto.cambios === "object" && "tipo" in dto.cambios) {
    return dto.cambios as CambioAuditoria
  }

  const antes = String(dto.datosAntes ?? dto.valorAnterior ?? "").trim()
  const despues = String(dto.datosDespues ?? dto.valorNuevo ?? "").trim()

  if (antes || despues) {
    return {
      tipo: "diff",
      lineas: [
        ...(antes ? [{ prefijo: "-" as const, texto: antes }] : []),
        ...(despues ? [{ prefijo: "+" as const, texto: despues }] : []),
      ],
    }
  }

  const texto = String(dto.cambios ?? "").trim()
  if (texto && texto !== "null" && texto !== "{}") {
    return { tipo: "texto", texto }
  }

  return { tipo: "texto", texto: "—" }
}

export function mapAuditoriaDtoToDomain(dto: FilaAuditoriaDto): FilaAuditoria {
  const id = String(dto.id ?? "")
  return {
    id,
    codigoAuditoria: codigoAuditoriaDesdeId(id, dto.codigoAuditoria),
    fechaHora: formatearFechaEvento(dto.fechaHora ?? dto.fechaEvento),
    usuario: mapUsuarioDto(dto.usuario),
    modulo: normalizarModulo(dto.modulo),
    accion: String(dto.accion ?? ""),
    registroId: registroDesdeDto(dto),
    cambios: mapCambiosDto(dto),
    resultado: normalizarResultado(dto.resultado),
  }
}

export function mapDetalleAuditoriaDto(dto: DetalleAuditoriaDto): DetalleAuditoria {
  const base = mapAuditoriaDtoToDomain(dto)
  const tipoEntidad = String(dto.tipoEntidad ?? "").trim()
  const entidadId = String(dto.entidadId ?? "").trim()

  return {
    codigoAuditoria: base.codigoAuditoria,
    usuario: {
      nombre: base.usuario.nombre,
      area: base.usuario.rol,
      iniciales: base.usuario.iniciales,
      esSistema: base.usuario.esSistema,
    },
    fechaHora: base.fechaHora,
    entidad: {
      etiqueta: String(
        dto.entidad?.etiqueta ??
          (tipoEntidad
            ? `${tipoEntidad}${entidadId ? ` · ${entidadId.slice(0, 8)}` : ""}`
            : base.registroId),
      ),
      estado: dto.entidad?.estado ?? dto.accion,
    },
    parametro: dto.parametro ?? (tipoEntidad || undefined),
    valorAnterior: dto.valorAnterior ?? dto.datosAntes ?? undefined,
    valorNuevo: dto.valorNuevo ?? dto.datosDespues ?? undefined,
    justificacion: dto.justificacion,
    metadatos: {
      ip: String(dto.metadatos?.ip ?? dto.direccionIp ?? "—"),
      dispositivo: String(dto.metadatos?.dispositivo ?? "—"),
      sistema: String(dto.metadatos?.sistema ?? dto.modulo ?? "Bital"),
    },
    historial: (dto.historial ?? []).map((h) => ({
      titulo: String(h.titulo ?? ""),
      tiempo: String(h.tiempo ?? ""),
      actual: h.actual,
    })),
    mensajeError: dto.mensajeError ?? undefined,
  }
}

export function mapAuditoriaList(dtos: FilaAuditoriaDto[] | unknown): FilaAuditoria[] {
  if (!Array.isArray(dtos)) return []
  return dtos.map(mapAuditoriaDtoToDomain)
}
