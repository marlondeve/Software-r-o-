import type { RolDietas } from "@/modules/dietas-cocina/types/enums"

const STORAGE_KEY = "dietas-cocina:admin-vista-rol"

/** Roles operativos cuya interfaz difiere en pantallas compartidas. */
export const ROLES_VISTA_PREVIEW: RolDietas[] = [
  "Nutricionista",
  "Proveedor",
  "Enfermera",
]

export const ETIQUETAS_VISTA_PREVIEW: Record<RolDietas | "admin", string> = {
  admin: "Administrador (acceso completo)",
  Nutricionista: "Nutricionista",
  Doctor: "Doctor",
  Proveedor: "Proveedor",
  Enfermera: "Enfermera",
  Administrador: "Administrador",
}

export function cargarVistaRolAdmin(): RolDietas | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw || raw === "admin") return null
    if (ROLES_VISTA_PREVIEW.includes(raw as RolDietas)) {
      return raw as RolDietas
    }
  } catch {
    /* ignore */
  }
  return null
}

export function guardarVistaRolAdmin(rol: RolDietas | null): void {
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
  rolReal: RolDietas | null,
  rolVistaPreview: RolDietas | null,
): RolDietas | null {
  if (rolReal !== "Administrador") return rolReal
  return rolVistaPreview ?? rolReal
}
