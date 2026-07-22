export type EstadoCategoria = "activo" | "borrador"

export interface CategoriaEdad {
  id: string
  nombre: string
  rangoMin: number
  rangoMax: number
  unidad: "Años" | "Meses" | "Días"
  estado: EstadoCategoria
}

export const mockTiposPaciente = {
  alertaSuperposicion:
    "Los rangos superpuestos pueden generar clasificaciones ambiguas en el censo automático. Verifica las edades máximas y mínimas.",
  categorias: [
    {
      id: "1",
      nombre: "Adulto",
      rangoMin: 15,
      rangoMax: 130,
      unidad: "Años",
      estado: "activo",
    },
    {
      id: "2",
      nombre: "Pediátrico",
      rangoMin: 1,
      rangoMax: 14,
      unidad: "Años",
      estado: "activo",
    },
    {
      id: "3",
      nombre: "Pediátrico BC",
      rangoMin: 0,
      rangoMax: 11,
      unidad: "Meses",
      estado: "activo",
    },
    {
      id: "4",
      nombre: "Neonato",
      rangoMin: 0,
      rangoMax: 28,
      unidad: "Días",
      estado: "borrador",
    },
  ] satisfies CategoriaEdad[],
  simulador: {
    fechaNacimiento: "2015-06-15",
    fechaReferencia: "2023-10-26",
    resultado: {
      edadCalculada: "8 Años, 4 Meses",
      categoria: "Pediátrico",
      regla: "1 - 14 Años",
    },
  },
}
