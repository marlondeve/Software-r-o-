export type SeccionParametros = "tiempos" | "tipos-paciente"

export interface SeccionParametrosConfig {
  id: SeccionParametros
  label: string
  titulo: string
  descripcion?: string
  path: string
}

export const SECCIONES_PARAMETROS: SeccionParametrosConfig[] = [
  {
    id: "tiempos",
    label: "Tiempos y restricciones",
    titulo: "Configuración de Tiempos y Restricciones",
    path: "/dietas-cocina/parametros/tiempos",
  },
  {
    id: "tipos-paciente",
    label: "Tipos de paciente y edades",
    titulo: "Tipos de paciente y edades",
    descripcion:
      "Configura los rangos de edad para la clasificación automática en el censo",
    path: "/dietas-cocina/parametros/tipos-paciente",
  },
]

export function obtenerSeccionParametros(
  pathname: string,
): SeccionParametrosConfig {
  return (
    SECCIONES_PARAMETROS.find((seccion) => pathname.startsWith(seccion.path)) ??
    SECCIONES_PARAMETROS[0]
  )
}
