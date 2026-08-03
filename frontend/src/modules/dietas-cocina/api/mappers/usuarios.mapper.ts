import { normalizarClave } from "@/modules/dietas-cocina/api/utils"
import type { MetaPaginacionDto } from "@/modules/dietas-cocina/types/api-dtos"
import type { EstadoUsuario, OrigenUsuario } from "@/modules/dietas-cocina/types/enums"
import type { UsuarioModulo } from "@/modules/dietas-cocina/types/users"

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null
}

function normalizarEstado(valor: unknown): EstadoUsuario {
  if (typeof valor === "boolean") return valor ? "activo" : "inactivo"
  const texto = String(valor ?? "activo").toLowerCase()
  return texto === "inactivo" || texto === "false" ? "inactivo" : "activo"
}

function formatearUltimoAcceso(valor: unknown): string {
  if (valor == null || valor === "") return "Sin acceso"
  if (typeof valor === "string") return valor
  if (valor instanceof Date) return valor.toLocaleString("es-CO")
  return String(valor)
}

export function mapUsuarioDtoToDomain(dto: unknown): UsuarioModulo {
  const registro = asRecord(dto) ?? {}
  const rolNombre = String(
    normalizarClave(registro, "rolNombre", "RolNombre") ?? "Usuario",
  )
  const observaciones = String(
    normalizarClave(registro, "observaciones", "Observaciones") ?? "",
  )

  return {
    id: String(normalizarClave(registro, "id", "Id") ?? ""),
    nombre: String(
      normalizarClave(registro, "nombre", "Nombre", "nombreCompleto", "NombreCompleto") ?? "",
    ),
    usuario: String(
      normalizarClave(registro, "usuario", "Usuario", "identificacion", "Identificacion") ?? "",
    ),
    correo: String(
      normalizarClave(registro, "correo", "Correo", "email", "Email") ?? "",
    ),
    rolId: String(
      normalizarClave(registro, "rolModuloId", "RolModuloId") ?? "",
    ),
    rol: rolNombre,
    servicioArea: observaciones || "Sin asignar",
    orgProveedora:
      rolNombre.toLowerCase() === "proveedor" ? "Catering Hospitalario SL" : null,
    estado: normalizarEstado(normalizarClave(registro, "estado", "Estado", "activo", "Activo")),
    ultimoAcceso: formatearUltimoAcceso(
      normalizarClave(registro, "ultimoAcceso", "UltimoAcceso"),
    ),
    origen: (String(normalizarClave(registro, "origen", "Origen") ?? "RioSoft") as OrigenUsuario),
  }
}

export function mapUsuarioList(dtos: unknown): UsuarioModulo[] {
  if (!Array.isArray(dtos)) return []
  return dtos.map(mapUsuarioDtoToDomain)
}

export function mapUsuarioToCrearRequest(usuario: Omit<UsuarioModulo, "id">) {
  const observaciones = [
    usuario.servicioArea !== "Sin asignar" ? usuario.servicioArea : null,
    usuario.orgProveedora ? `Org: ${usuario.orgProveedora}` : null,
  ]
    .filter(Boolean)
    .join(" · ")

  return {
    nombreCompleto: usuario.nombre,
    email: usuario.correo,
    identificacion: usuario.usuario,
    rolModuloId: usuario.rolId,
    observaciones: observaciones || null,
  }
}

export function mapUsuarioToEditarRequest(usuario: Omit<UsuarioModulo, "id">) {
  const base = mapUsuarioToCrearRequest(usuario)
  return {
    nombreCompleto: base.nombreCompleto,
    email: base.email,
    identificacion: base.identificacion,
    observaciones: base.observaciones,
  }
}

export function mapListadoUsuariosResponse(payload: unknown): {
  usuarios: UsuarioModulo[]
  meta?: MetaPaginacionDto
} {
  const registro = asRecord(payload) ?? {}
  const items =
    normalizarClave(registro, "data", "Data", "items", "Items") ?? registro
  const metaRaw = normalizarClave(registro, "meta", "Meta")
  const meta = asRecord(metaRaw)

  return {
    usuarios: mapUsuarioList(items),
    meta: meta
      ? ({
          page: Number(normalizarClave(meta, "page", "Page") ?? 1),
          pageSize: Number(normalizarClave(meta, "pageSize", "PageSize") ?? 10),
          total: Number(normalizarClave(meta, "total", "Total") ?? 0),
          totalPages: Number(normalizarClave(meta, "totalPages", "TotalPages") ?? 1),
        } satisfies MetaPaginacionDto)
      : undefined,
  }
}

export function mapRolesModuloResponse(payload: unknown) {
  const registro = asRecord(payload) ?? {}
  const items = normalizarClave(registro, "data", "Data") ?? payload
  if (!Array.isArray(items)) return []

  return items.map((item) => {
    const rol = asRecord(item) ?? {}
    return {
      id: String(normalizarClave(rol, "id", "Id") ?? ""),
      nombre: String(normalizarClave(rol, "nombre", "Nombre") ?? ""),
      esSistema: Boolean(normalizarClave(rol, "esSistema", "EsSistema")),
      activo: Boolean(normalizarClave(rol, "activo", "Activo") ?? true),
      totalPermisos: Number(normalizarClave(rol, "totalPermisos", "TotalPermisos") ?? 0),
    }
  })
}
