import type { RutaDietasConfig } from "@/lib/configAccesoModulos"
import { RUTAS_DIETAS } from "@/lib/configAccesoModulos"
import type { RolDietas } from "@/modules/dietas-cocina/lib/roles"
import { obtenerRutasPermitidas } from "@/modules/dietas-cocina/lib/permisos"

export interface ResultadoValidacion {
  valido: boolean
  mensaje?: string
  advertencia?: string
}

export function puedeGestionarUsuariosRoles(
  rol: RolDietas | string | null,
): boolean {
  if (!rol) return false
  if (rol === "Administrador") return true
  return obtenerRutasPermitidas(rol).includes("usuarios")
}

export function validarCambioRol(
  rolActual: RolDietas,
  rolNuevo: RolDietas,
): ResultadoValidacion {
  if (rolActual === rolNuevo) {
    return {
      valido: false,
      mensaje: "Seleccione un rol distinto al actual.",
    }
  }

  if (rolNuevo === "Administrador") {
    return {
      valido: true,
      advertencia:
        "Este usuario obtendrá acceso completo al módulo, incluyendo usuarios, permisos y auditoría.",
    }
  }

  if (rolActual === "Administrador") {
    return {
      valido: true,
      advertencia:
        "Se revocarán los privilegios administrativos de este usuario.",
    }
  }

  return { valido: true }
}

export function validarPermisosRol(
  rutas: RutaDietasConfig[],
): ResultadoValidacion {
  if (rutas.length === 0) {
    return {
      valido: false,
      mensaje: "Asigne al menos una sección al rol.",
    }
  }

  if (!rutas.includes("inicio")) {
    return {
      valido: false,
      mensaje: 'El rol debe conservar acceso a "Inicio".',
    }
  }

  if (
    rutas.includes("usuarios") &&
    !rutas.includes("auditoria")
  ) {
    return {
      valido: true,
      advertencia:
        "Este rol puede gestionar usuarios pero no tiene acceso a auditoría.",
    }
  }

  return { valido: true }
}

export function etiquetaRuta(ruta: RutaDietasConfig): string {
  return RUTAS_DIETAS.find((item) => item.id === ruta)?.label ?? ruta
}

export function diffPermisosRol(
  anteriores: RutaDietasConfig[],
  nuevas: RutaDietasConfig[],
) {
  const setAnteriores = new Set(anteriores)
  const setNuevas = new Set(nuevas)

  return {
    agregadas: nuevas.filter((ruta) => !setAnteriores.has(ruta)),
    removidas: anteriores.filter((ruta) => !setNuevas.has(ruta)),
    sinCambios:
      anteriores.length === nuevas.length &&
      anteriores.every((ruta) => setNuevas.has(ruta)),
  }
}
