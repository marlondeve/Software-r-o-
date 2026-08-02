import type { ReactNode } from "react"
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"

import { useAuth } from "@/features/autenticacion/hooks/useAuth"
import { obtenerNombreRolDietas } from "@/modules/dietas-cocina/lib/roles"
import {
  cargarVistaRolAdmin,
  guardarVistaRolAdmin,
  resolverRolVistaEfectivo,
} from "@/modules/dietas-cocina/lib/vistaRolAdmin"

interface VistaRolAdminContextValue {
  esAdminReal: boolean
  rolReal: string | null
  rolVistaPreview: string | null
  rolVistaEfectivo: string | null
  vistaPreviewActiva: boolean
  setRolVistaPreview: (rol: string | null) => void
}

const VistaRolAdminContext = createContext<VistaRolAdminContextValue | null>(
  null,
)

export function VistaRolAdminProvider({
  children,
  rolesPreview = [],
}: {
  children: ReactNode
  rolesPreview?: string[]
}) {
  const { usuario } = useAuth()
  const rolReal = obtenerNombreRolDietas(usuario)
  const esAdminReal = rolReal?.toLowerCase() === "administrador"
  const [rolVistaPreview, setRolVistaPreviewState] = useState<string | null>(
    () => (esAdminReal ? cargarVistaRolAdmin(rolesPreview) : null),
  )

  const setRolVistaPreview = useCallback(
    (rol: string | null) => {
      if (!esAdminReal) return
      setRolVistaPreviewState(rol)
      guardarVistaRolAdmin(rol)
    },
    [esAdminReal],
  )

  const rolVistaEfectivo =
    resolverRolVistaEfectivo(rolReal, rolVistaPreview) ?? rolReal

  const value = useMemo(
    () => ({
      esAdminReal,
      rolReal,
      rolVistaPreview,
      rolVistaEfectivo,
      vistaPreviewActiva: esAdminReal && rolVistaPreview !== null,
      setRolVistaPreview,
    }),
    [esAdminReal, rolReal, rolVistaPreview, rolVistaEfectivo, setRolVistaPreview],
  )

  return (
    <VistaRolAdminContext.Provider value={value}>
      {children}
    </VistaRolAdminContext.Provider>
  )
}

export function useVistaRolAdmin(): VistaRolAdminContextValue {
  const ctx = useContext(VistaRolAdminContext)
  if (!ctx) {
    return {
      esAdminReal: false,
      rolReal: null,
      rolVistaPreview: null,
      rolVistaEfectivo: null,
      vistaPreviewActiva: false,
      setRolVistaPreview: () => {},
    }
  }
  return ctx
}

export function useRolVistaEfectivo(): string | null {
  const { rolVistaEfectivo, rolReal } = useVistaRolAdmin()
  return rolVistaEfectivo ?? rolReal
}
