import { normalizarClave } from "@/modules/dietas-cocina/api/utils"
import type { MetaPaginacionDto } from "@/modules/dietas-cocina/types/api-dtos"
import type { EstadoUsuario, OrigenUsuario, RolDietas } from "@/modules/dietas-cocina/types/enums"
import type { UsuarioModulo } from "@/modules/dietas-cocina/types/users"

const ROLES_DOMINIO: RolDietas[] = [
  "Administrador",
  "Nutricionista",
  "Doctor",
  "Proveedor",
  "Enfermera",
]

/** Roles expuestos por la API .NET (`RolDietas`). */
const ROL_API_A_DOMINIO: Record<string, RolDietas> = {
  admin: "Administrador",
  administrador: "Administrador",
  nutricionista: "Nutricionista",
  cocinero: "Proveedor",
  proveedor: "Proveedor",
  enfermera: "Enfermera",
  doctor: "Doctor",
}

const ROL_DOMINIO_A_API: Record<RolDietas, string> = {
  Administrador: "Admin",
  Nutricionista: "Nutricionista",
  Doctor: "Enfermera",
  Proveedor: "Cocinero",
  Enfermera: "Enfermera",
}

/** Valores numéricos de `RolDietas` en .NET (Admin=1, Nutricionista=2, Cocinero=3, Enfermera=4). */
const ROL_DOMINIO_A_API_NUM: Record<RolDietas, number> = {
  Administrador: 1,
  Nutricionista: 2,
  Doctor: 4,
  Proveedor: 3,
  Enfermera: 4,
}

const ROL_API_NUM_A_DOMINIO: Record<number, RolDietas> = {
  1: "Administrador",
  2: "Nutricionista",
  3: "Proveedor",
  4: "Enfermera",
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null
}

function normalizarRol(valor: unknown): RolDietas {
  if (typeof valor === "number" && valor in ROL_API_NUM_A_DOMINIO) {
    return ROL_API_NUM_A_DOMINIO[valor]!
  }

  const clave = String(valor ?? "").trim().toLowerCase()
  if (clave in ROL_API_A_DOMINIO) return ROL_API_A_DOMINIO[clave]!
  return ROLES_DOMINIO.find((rol) => rol.toLowerCase() === clave) ?? "Nutricionista"
}

export function mapRolDominioAApi(rol: RolDietas | string): string {
  const dominio = normalizarRolDominio(rol)
  return ROL_DOMINIO_A_API[dominio] ?? "Nutricionista"
}

export function mapRolDominioAApiNum(rol: RolDietas | string): number {
  const dominio = normalizarRolDominio(rol)
  return ROL_DOMINIO_A_API_NUM[dominio] ?? 2
}

function normalizarRolDominio(rol: RolDietas | string): RolDietas {
  const clave = String(rol ?? "").trim()
  if (clave in ROL_DOMINIO_A_API) return clave as RolDietas
  return normalizarRol(rol)
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
  const rolNombre = normalizarClave(registro, "rolNombre", "RolNombre")
  const rolCodigo = normalizarClave(registro, "rol", "Rol")
  const rolRaw = rolNombre ?? rolCodigo ?? "Nutricionista"
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
    rol: normalizarRol(rolRaw),
    servicioArea: observaciones || "Sin asignar",
    orgProveedora:
      normalizarRol(rolRaw) === "Proveedor" ? "Catering Hospitalario SL" : null,
    estado: normalizarEstado(normalizarClave(registro, "estado", "Estado", "activo", "Activo")),
    ultimoAcceso: formatearUltimoAcceso(
      normalizarClave(registro, "ultimoAcceso", "UltimoAcceso"),
    ),
    origen: (String(normalizarClave(registro, "origen", "Origen") ?? "Bital") as OrigenUsuario),
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
    rol: mapRolDominioAApiNum(usuario.rol),
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
