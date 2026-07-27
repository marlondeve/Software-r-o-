import type { CategoriaEdad } from "@/modules/dietas-cocina/types/parameters"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { useAuth } from "@/features/autenticacion/hooks/useAuth"
import { usarApiDietasCocina } from "@/modules/dietas-cocina/api"
import {
  actualizarTiposPaciente,
  obtenerTiposPaciente,
} from "@/modules/dietas-cocina/api/services/parametros.service"
import { demoToast } from "@/modules/dietas-cocina/lib/demoFeedback"
import { mockTiposPaciente } from "@/modules/dietas-cocina/parametros/datos/mockTiposPaciente"

interface ParametrosTiposPacienteContextValue {
  categorias: CategoriaEdad[]
  cargando: boolean
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
  const apiActiva = usarApiDietasCocina()
  const { usuario } = useAuth()
  const [categorias, setCategorias] = useState<CategoriaEdad[]>(() =>
    apiActiva ? [] : mockTiposPaciente.categorias.map((c) => ({ ...c })),
  )
  const [cargando, setCargando] = useState(apiActiva)

  const persistirCategorias = useCallback(
    (next: CategoriaEdad[], mensaje?: string) => {
      const usuarioParametros = usuario?.nombre ?? usuario?.email ?? "admin"

      if (apiActiva) {
        void actualizarTiposPaciente(next, usuarioParametros)
          .then((actualizadas) => {
            setCategorias(actualizadas)
            if (mensaje) demoToast(mensaje, "success")
          })
          .catch((error) => {
            demoToast(
              error instanceof Error
                ? error.message
                : "No se pudieron guardar las categorías.",
              "error",
            )
          })
        return
      }
      setCategorias(next)
      if (mensaje) demoToast(mensaje)
    },
    [apiActiva, usuario?.email, usuario?.nombre],
  )

  useEffect(() => {
    if (!apiActiva) return
    setCargando(true)
    void obtenerTiposPaciente()
      .then(setCategorias)
      .catch(() => {
        demoToast("No se pudieron cargar los tipos de paciente.", "error")
      })
      .finally(() => setCargando(false))
  }, [apiActiva])

  const crearCategoria = useCallback(() => {
    const nums = categorias
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
    persistirCategorias(
      [...categorias, nueva],
      `Categoría "${nueva.nombre}" creada en borrador.`,
    )
  }, [categorias, persistirCategorias])

  const editarCategoria = useCallback(
    (id: string) => {
      const next = categorias.map((c) =>
        c.id === id
          ? {
              ...c,
              estado: c.estado === "activo" ? ("borrador" as const) : ("activo" as const),
            }
          : c,
      )
      persistirCategorias(next, "Estado de categoría actualizado.")
    },
    [categorias, persistirCategorias],
  )

  const eliminarCategoria = useCallback(
    (id: string) => {
      const categoria = categorias.find((c) => c.id === id)
      const next = categorias.filter((c) => c.id !== id)
      persistirCategorias(
        next,
        categoria ? `Categoría "${categoria.nombre}" eliminada.` : undefined,
      )
    },
    [categorias, persistirCategorias],
  )

  const value = useMemo(
    () => ({
      categorias,
      cargando,
      crearCategoria,
      editarCategoria,
      eliminarCategoria,
    }),
    [categorias, cargando, crearCategoria, editarCategoria, eliminarCategoria],
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
