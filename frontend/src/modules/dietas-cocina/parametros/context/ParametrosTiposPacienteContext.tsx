import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { demoToast } from "@/modules/dietas-cocina/lib/demoFeedback"
import {
  mockTiposPaciente,
  type CategoriaEdad,
} from "@/modules/dietas-cocina/parametros/datos/mockTiposPaciente"

interface ParametrosTiposPacienteContextValue {
  categorias: CategoriaEdad[]
  crearCategoria: () => void
  editarCategoria: (id: string) => void
  eliminarCategoria: (id: string) => void
}

const ParametrosTiposPacienteContext =
  createContext<ParametrosTiposPacienteContextValue | null>(null)

export function ParametrosTiposPacienteProvider({
  children,
}: {
  children: ReactNode
}) {
  const [categorias, setCategorias] = useState<CategoriaEdad[]>(
    () => mockTiposPaciente.categorias.map((c) => ({ ...c })),
  )

  const crearCategoria = useCallback(() => {
    setCategorias((prev) => {
      const nums = prev
        .map((c) => Number.parseInt(c.id, 10))
        .filter((n) => !Number.isNaN(n))
      const nextId = String((nums.length ? Math.max(...nums) : 0) + 1)
      const nueva: CategoriaEdad = {
        id: nextId,
        nombre: `Nueva categoría ${nextId}`,
        rangoMin: 0,
        rangoMax: 1,
        unidad: "Años",
        estado: "borrador",
      }
      demoToast(`Categoría "${nueva.nombre}" creada en borrador.`)
      return [...prev, nueva]
    })
  }, [])

  const editarCategoria = useCallback((id: string) => {
    setCategorias((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              estado: c.estado === "activo" ? "borrador" : "activo",
            }
          : c,
      ),
    )
    demoToast("Estado de categoría alternado (demo).")
  }, [])

  const eliminarCategoria = useCallback((id: string) => {
    setCategorias((prev) => {
      const categoria = prev.find((c) => c.id === id)
      if (categoria) {
        demoToast(`Categoría "${categoria.nombre}" eliminada (demo).`)
      }
      return prev.filter((c) => c.id !== id)
    })
  }, [])

  const value = useMemo(
    () => ({
      categorias,
      crearCategoria,
      editarCategoria,
      eliminarCategoria,
    }),
    [categorias, crearCategoria, editarCategoria, eliminarCategoria],
  )

  return (
    <ParametrosTiposPacienteContext.Provider value={value}>
      {children}
    </ParametrosTiposPacienteContext.Provider>
  )
}

export function useParametrosTiposPaciente() {
  const ctx = useContext(ParametrosTiposPacienteContext)
  if (!ctx) {
    throw new Error(
      "useParametrosTiposPaciente debe usarse dentro de ParametrosTiposPacienteProvider",
    )
  }
  return ctx
}
