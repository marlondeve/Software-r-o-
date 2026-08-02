const STORAGE_KEY = "dietas-cocina:admin-vista-rol"

export function cargarVistaRolAdmin(rolesValidos: string[]): string | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw || raw === "admin") return null
    const clave = raw.trim().toLowerCase()
    if (rolesValidos.some((rol) => rol.toLowerCase() === clave)) {
      return rolesValidos.find((rol) => rol.toLowerCase() === clave) ?? raw
    }
  } catch {
    /* ignore */
  }
  return null
}

export function guardarVistaRolAdmin(rol: string | null): void {
  try {
    if (!rol) {
      sessionStorage.removeItem(STORAGE_KEY)
      return
    }
    sessionStorage.setItem(STORAGE_KEY, rol)
  } catch {
    /* ignore */
  }
}

export function resolverRolVistaEfectivo(
  rolReal: string | null,
  rolVistaPreview: string | null,
): string | null {
  if (rolReal?.trim().toLowerCase() !== "administrador") return rolReal
  return rolVistaPreview ?? rolReal
}
