import type { RolDietas } from "@/modules/dietas-cocina/types/enums"
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { useAuth } from "@/features/autenticacion/hooks/useAuth"
import { obtenerRolDietas, obtenerNombreRolDietas } from "@/modules/dietas-cocina/lib/roles"
import {
  cargarVistaRolAdmin,
  guardarVistaRolAdmin,
  resolverRolVistaEfectivo,
} from "@/modules/dietas-cocina/lib/vistaRolAdmin"

interface VistaRolAdminContextValue {
  esAdminReal: boolean
  rolReal: string | null
  rolVistaPreview: RolDietas | null
  rolVistaEfectivo: string | null
  vistaPreviewActiva: boolean
  setRolVistaPreview: (rol: RolDietas | null) => void
}

const VistaRolAdminContext = createContext<VistaRolAdminContextValue | null>(
  null,
)

export function VistaRolAdminProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth()
  const rolReal = obtenerNombreRolDietas(usuario)
  const esAdminReal = rolReal?.toLowerCase() === "administrador"
  const [rolVistaPreview, setRolVistaPreviewState] = useState<RolDietas | null>(
    () => (esAdminReal ? cargarVistaRolAdmin() : null),
  )

  const setRolVistaPreview = useCallback(
    (rol: RolDietas | null) => {
      if (!esAdminReal) return
      setRolVistaPreviewState(rol)
      guardarVistaRolAdmin(rol)
    },
    [esAdminReal],
  )

  const rolVistaEfectivo = resolverRolVistaEfectivo(
    obtenerRolDietas(usuario),
    rolVistaPreview,
  ) ?? rolReal

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
