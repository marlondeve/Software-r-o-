import type { AccesoModulo } from "@/types/module"
import type { Usuario } from "@/types/user"

import { usarAuthModuloApi } from "@/api/authFlags"
import {
  cambiarPasswordModulo,
  loginModulo,
} from "@/api/authModulo.service"
import {
  limpiarModuloActivo,
} from "@/lib/modulos"

const SESSION_KEY = "bital:session"

/** TODO(producción): quitar modo demo y usar solo `institucional`. */
export type ModoLoginAuth = "demo" | "institucional"

export function authInstitucionalDisponible(): boolean {
  return usarAuthModuloApi()
}

interface PerfilMock {
  nombre: string
  iniciales: string
  accesos: AccesoModulo[]
  esAdministrador: boolean
}

function resolverPerfil(email: string): PerfilMock {
  const correo = email.toLowerCase()

  if (correo.startsWith("admin@")) {
    return {
      esAdministrador: true,
      nombre: "Admin",
      iniciales: "AD",
      accesos: [
        { moduloId: "dietas-cocina", rol: "Administrador" },
        { moduloId: "encuestas", rol: "Administrador" },
      ],
    }
  }

  if (correo.startsWith("nutricionista@")) {
    return {
      esAdministrador: false,
      nombre: "Dra. Elena",
      iniciales: "DE",
      accesos: [{ moduloId: "dietas-cocina", rol: "Nutricionista" }],
    }
  }

  if (correo.startsWith("doctor@")) {
    return {
      esAdministrador: false,
      nombre: "Dr. Ramírez",
      iniciales: "DR",
      accesos: [{ moduloId: "dietas-cocina", rol: "Doctor" }],
    }
  }

  if (correo.startsWith("proveedor@") || correo.startsWith("dietas@")) {
    return {
      esAdministrador: false,
      nombre: "Operador Principal",
      iniciales: "OP",
      accesos: [{ moduloId: "dietas-cocina", rol: "Proveedor" }],
    }
  }

  if (correo.startsWith("enfermera@")) {
    return {
      esAdministrador: false,
      nombre: "Enf. Laura",
      iniciales: "EL",
      accesos: [{ moduloId: "dietas-cocina", rol: "Enfermera" }],
    }
  }

  if (correo.startsWith("encuestas@")) {
    return {
      esAdministrador: false,
      nombre: "Analista SIAO",
      iniciales: "AS",
      accesos: [{ moduloId: "encuestas", rol: "Analista SIAO" }],
    }
  }

  const nombre = email.split("@")[0] ?? "Usuario"
  return {
    esAdministrador: false,
    nombre,
    iniciales: nombre.slice(0, 2).toUpperCase(),
    accesos: [
      { moduloId: "dietas-cocina", rol: "Proveedor" },
      { moduloId: "encuestas", rol: "Operador de encuestas" },
    ],
  }
}

function normalizarUsuario(raw: Usuario): Usuario | null {
  const accesos = (raw.accesos ?? []).filter(
    (acceso): acceso is AccesoModulo =>
      acceso.moduloId === "dietas-cocina" || acceso.moduloId === "encuestas",
  )

  const esAdministrador =
    raw.esAdministrador === true ||
    (raw.accesos ?? []).some(
      (acceso) => (acceso.moduloId as string) === "administracion",
    )

  if (accesos.length === 0) {
    return null
  }

  return {
    ...raw,
    esAdministrador,
    accesos,
  }
}

function guardarSesion(usuario: Usuario): Usuario {
  const normalizado = normalizarUsuario(usuario)
  if (!normalizado) {
    throw new Error("El usuario no tiene acceso a ningún módulo.")
  }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(normalizado))
  return normalizado
}

export function obtenerSesion(): Usuario | null {
  const raw = sessionStorage.getItem(SESSION_KEY)
  if (!raw) return null

  try {
    const usuario = normalizarUsuario(JSON.parse(raw) as Usuario)
    if (!usuario) {
      sessionStorage.removeItem(SESSION_KEY)
      return null
    }
    return usuario
  } catch {
    sessionStorage.removeItem(SESSION_KEY)
    return null
  }
}

async function iniciarSesionMock(email: string, password: string): Promise<Usuario> {
  await new Promise((resolve) => setTimeout(resolve, 400))

  if (!email.trim() || !password.trim()) {
    throw new Error("Credenciales inválidas.")
  }

  const perfil = resolverPerfil(email)
  return guardarSesion({
    id: crypto.randomUUID(),
    email,
    nombre: perfil.nombre,
    iniciales: perfil.iniciales,
    esAdministrador: perfil.esAdministrador,
    accesos: perfil.accesos,
  })
}

export async function iniciarSesion(
  email: string,
  password: string,
  modo: ModoLoginAuth = "demo",
): Promise<Usuario> {
  if (modo === "institucional") {
    if (!usarAuthModuloApi()) {
      throw new Error("El login institucional no está disponible en este entorno.")
    }
    const usuario = await loginModulo(email, password)
    return guardarSesion(usuario)
  }

  return iniciarSesionMock(email, password)
}

export async function cambiarPasswordSesion(
  email: string,
  passwordActual: string,
  passwordNueva: string,
): Promise<string> {
  if (usarAuthModuloApi()) {
    return cambiarPasswordModulo({ email, passwordActual, passwordNueva })
  }

  await new Promise((resolve) => setTimeout(resolve, 400))
  if (!email.trim() || !passwordActual.trim() || passwordNueva.length < 8) {
    throw new Error("Revise los datos ingresados.")
  }
  return "Contraseña actualizada correctamente (demo)."
}

export function cerrarSesion(): void {
  sessionStorage.removeItem(SESSION_KEY)
  limpiarModuloActivo()
}
