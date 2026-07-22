import type { AccesoModulo } from "@/tipos/modulo"
import type { Usuario } from "@/tipos/usuario"

import {
  limpiarModuloActivo,
} from "@/lib/modulos"

const SESSION_KEY = "bital:session"

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

export async function iniciarSesion(
  email: string,
  password: string,
): Promise<Usuario> {
  // Mock temporal: reemplazar con llamada a la API institucional.
  await new Promise((resolve) => setTimeout(resolve, 400))

  if (!email.trim() || !password.trim()) {
    throw new Error("Credenciales inválidas.")
  }

  const perfil = resolverPerfil(email)
  const usuario: Usuario = {
    id: crypto.randomUUID(),
    email,
    nombre: perfil.nombre,
    iniciales: perfil.iniciales,
    esAdministrador: perfil.esAdministrador,
    accesos: perfil.accesos,
  }

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(usuario))
  return usuario
}

export function cerrarSesion(): void {
  sessionStorage.removeItem(SESSION_KEY)
  limpiarModuloActivo()
}
