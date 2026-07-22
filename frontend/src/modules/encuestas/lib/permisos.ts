import { normalizarRolEncuestas, type RolEncuestas } from "@/modules/encuestas/lib/roles"

export type RutaEncuestasModulo =
  | "inicio"
  | "captura-presencial"
  | "captura-telefonica"
  | "encuestas-realizadas"
  | "cuestionarios"
  | "indicadores"
  | "parametros"
  | "auditoria"
  | "usuarios"

export const RUTAS_ENCUESTAS_MODULO: { id: RutaEncuestasModulo; label: string }[] = [
  { id: "inicio", label: "Inicio" },
  { id: "captura-presencial", label: "Captura presencial" },
  { id: "captura-telefonica", label: "Captura telefónica" },
  { id: "encuestas-realizadas", label: "Encuestas realizadas" },
  { id: "cuestionarios", label: "Cuestionarios" },
  { id: "indicadores", label: "Indicadores" },
  { id: "parametros", label: "Parámetros" },
  { id: "auditoria", label: "Auditoría" },
  { id: "usuarios", label: "Usuarios y roles" },
]

const TODAS_LAS_RUTAS = RUTAS_ENCUESTAS_MODULO.map((ruta) => ruta.id)

/**
 * Sin restricciones todavía: mientras no se defina la política de permisos
 * de Encuestas, ambos roles tienen acceso a todas las secciones del módulo.
 */
export const PERMISOS_POR_ROL_DEFAULT: Record<RolEncuestas, RutaEncuestasModulo[]> = {
  Administrador: TODAS_LAS_RUTAS,
  Encuestador: TODAS_LAS_RUTAS,
}

export function obtenerRutasPermitidas(
  rol: RolEncuestas | string | null,
): RutaEncuestasModulo[] {
  const rolNormalizado = normalizarRolEncuestas(rol)
  if (!rolNormalizado) return []
  return PERMISOS_POR_ROL_DEFAULT[rolNormalizado] ?? []
}
