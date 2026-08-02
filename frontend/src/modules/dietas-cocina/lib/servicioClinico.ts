const SERVICIOS_IGNORADOS = new Set([
  "",
  "sin información",
  "sin informacion",
  "sin servicio",
])

/** ClaPro u otros códigos HIS (ej. "2", "03") no son etiquetas para filtros/UI. */
export function esServicioDescriptivo(servicio?: string | null): boolean {
  const valor = servicio?.trim()
  if (!valor) return false
  if (/^\d+$/.test(valor)) return false
  if (valor.length <= 2 && !/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(valor)) return false
  if (SERVICIOS_IGNORADOS.has(valor.toLowerCase())) return false
  return true
}

export function inferirServicioDesdePabellon(pabellon: string): string {
  if (!pabellon.trim()) return "Sin servicio"

  const normalizado = pabellon.toUpperCase()
  if (normalizado.includes("UCI")) return "UCI"
  if (normalizado.includes("URGENCI")) return "Urgencias"
  if (normalizado.includes("NEONATAL")) return "Neonatal"
  if (normalizado.includes("HOSPITALIZ") || normalizado.includes("PISO")) {
    return "Hospitalización"
  }

  return pabellon
    .toLowerCase()
    .split(" ")
    .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(" ")
}

/** Resuelve el servicio clínico legible desde HIS o pabellón. */
export function resolverServicioClinico(
  servicio?: string | null,
  pabellon?: string | null,
): string {
  if (esServicioDescriptivo(servicio)) return servicio!.trim()
  return inferirServicioDesdePabellon(pabellon?.trim() ?? "")
}

export function listarServiciosDesdeFilas(
  filas: Array<{ servicio?: string | null; pabellon?: string | null }>,
): string[] {
  const valores = filas.map((fila) =>
    resolverServicioClinico(fila.servicio, fila.pabellon),
  )
  return [...new Set(valores.filter((valor) => esServicioDescriptivo(valor)))].sort(
    (a, b) => a.localeCompare(b, "es"),
  )
}
