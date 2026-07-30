import type { RolModuloDto } from "@/modules/dietas-cocina/types/api-dtos"
import type { UsuarioModulo } from "@/modules/dietas-cocina/types/users"

function normalizarId(id: string | null | undefined): string {
  return (id ?? "").trim().toLowerCase()
}

/** Resuelve el id de rol del catálogo a partir del usuario (por id o por nombre). */
export function resolverRolIdParaUsuario(
  usuario: Pick<UsuarioModulo, "rolId" | "rol"> | null | undefined,
  roles: RolModuloDto[],
  fallback = "",
): string {
  if (!roles.length) return fallback

  const idUsuario = normalizarId(usuario?.rolId)
  if (idUsuario) {
    const porId = roles.find((rol) => normalizarId(rol.id) === idUsuario)
    if (porId?.id) return porId.id
  }

  const nombreRol = usuario?.rol?.trim().toLowerCase()
  if (nombreRol) {
    const porNombre = roles.find(
      (rol) => (rol.nombre ?? "").trim().toLowerCase() === nombreRol,
    )
    if (porNombre?.id) return porNombre.id
  }

  return fallback || roles[0]?.id || ""
}
