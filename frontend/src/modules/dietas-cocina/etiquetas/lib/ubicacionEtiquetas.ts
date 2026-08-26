import { normalizarPabellon } from "@/modules/dietas-cocina/dietas/lib/dietasEstilos"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"

export interface OpcionUbicacionEtiqueta {
  value: string
  label: string
}

/** Clave de filtro: pabellón/área (sin habitación). */
export function claveUbicacionEtiqueta(etiqueta: EtiquetaEnfermera): string {
  return normalizarPabellon(etiqueta.pabellon ?? "").trim()
}

/** Opciones únicas de ubicación (pabellón/área). */
export function listarUbicacionesDesdeEtiquetas(
  etiquetas: EtiquetaEnfermera[],
): OpcionUbicacionEtiqueta[] {
  const opciones = new Map<string, string>()

  for (const etiqueta of etiquetas) {
    const clave = claveUbicacionEtiqueta(etiqueta)
    if (!clave) continue
    opciones.set(clave, clave)
  }

  return [...opciones.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) =>
      a.label.localeCompare(b.label, "es", { sensitivity: "base", numeric: true }),
    )
}

export function etiquetaCoincideUbicacion(
  etiqueta: EtiquetaEnfermera,
  ubicacion: string,
): boolean {
  if (ubicacion === "todas") return true
  return claveUbicacionEtiqueta(etiqueta) === ubicacion
}
