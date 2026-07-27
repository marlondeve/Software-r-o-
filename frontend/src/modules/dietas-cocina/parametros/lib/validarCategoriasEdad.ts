import type { CategoriaEdad } from "@/modules/dietas-cocina/types/parameters"

export function detectarSuperposicionCategorias(categorias: CategoriaEdad[]): boolean {
  const activas = categorias.filter((categoria) => categoria.estado === "activo")
  for (let i = 0; i < activas.length; i++) {
    for (let j = i + 1; j < activas.length; j++) {
      const a = activas[i]
      const b = activas[j]
      if (a.unidad !== b.unidad) continue
      const solapa = a.rangoMin <= b.rangoMax && b.rangoMin <= a.rangoMax
      if (solapa) return true
    }
  }
  return false
}

export function mensajeSuperposicionCategorias(): string {
  return "Los rangos superpuestos pueden generar clasificaciones ambiguas en el censo automático. Verifica las edades máximas y mínimas."
}
