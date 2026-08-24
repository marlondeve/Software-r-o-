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

/** Especialidades que se leen del pabellón aunque el HIS traiga otro servicio. */
function especialidadDesdePabellon(pabellon: string): string | null {
  const normalizado = pabellon.toUpperCase()
  if (normalizado.includes("UCI")) return "UCI"
  if (normalizado.includes("URGENCI")) return "Urgencias"
  if (normalizado.includes("NEONATAL")) return "Neonatal"
  return null
}

/** Resuelve el servicio clínico legible desde HIS o pabellón. */
export function resolverServicioClinico(
  servicio?: string | null,
  pabellon?: string | null,
): string {
  const pab = pabellon?.trim() ?? ""
  const especialidad = especialidadDesdePabellon(pab)
  // UCI ADULTO / UCI PEDIÁTRICA, etc.: el pabellón manda sobre un servicio genérico del HIS.
  if (especialidad) return especialidad
  if (esServicioDescriptivo(servicio)) return servicio!.trim()
  return inferirServicioDesdePabellon(pab)
}

/** Compara filtro de servicio con la fila (UCI abarca UCI ADULTO y variantes). */
export function servicioCoincideFila(
  fila: { servicio?: string | null; pabellon?: string | null },
  filtroServicio: string,
): boolean {
  if (filtroServicio === "todos") return true
  const resuelto = resolverServicioClinico(fila.servicio, fila.pabellon)
  if (resuelto === filtroServicio) return true

  const filtro = filtroServicio.trim().toUpperCase()
  const pabellon = (fila.pabellon ?? "").toUpperCase()
  const servicio = (fila.servicio ?? "").toUpperCase()

  if (filtro === "UCI") {
    return pabellon.includes("UCI") || servicio.includes("UCI") || resuelto === "UCI"
  }

  return (
    pabellon.includes(filtro) ||
    servicio.includes(filtro) ||
    resuelto.toUpperCase().includes(filtro)
  )
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
