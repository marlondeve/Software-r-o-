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
import { obtenerRolDietas } from "@/modules/dietas-cocina/lib/roles"
import {
  cargarVistaRolAdmin,
  guardarVistaRolAdmin,
  resolverRolVistaEfectivo,
} from "@/modules/dietas-cocina/lib/vistaRolAdmin"

interface VistaRolAdminContextValue {
  esAdminReal: boolean
  rolReal: RolDietas | null
  rolVistaPreview: RolDietas | null
  rolVistaEfectivo: RolDietas | null
  vistaPreviewActiva: boolean
  setRolVistaPreview: (rol: RolDietas | null) => void
}

const VistaRolAdminContext = createContext<VistaRolAdminContextValue | null>(
  null,
)

export function VistaRolAdminProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth()
  const rolReal = obtenerRolDietas(usuario)
  const esAdminReal = rolReal === "Administrador"
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

  const rolVistaEfectivo = resolverRolVistaEfectivo(rolReal, rolVistaPreview)

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

export function useRolVistaEfectivo(): RolDietas | null {
  const { rolVistaEfectivo, rolReal } = useVistaRolAdmin()
  return rolVistaEfectivo ?? rolReal
}
