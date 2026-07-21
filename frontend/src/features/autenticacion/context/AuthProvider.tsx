import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import {
  cerrarSesion as cerrarSesionService,
  iniciarSesion as iniciarSesionService,
  obtenerSesion,
} from "@/servicios/authService"
import type { Usuario } from "@/tipos/usuario"

interface AuthContextValue {
  usuario: Usuario | null
  cargando: boolean
  iniciarSesion: (email: string, password: string) => Promise<Usuario>
  cerrarSesion: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    setUsuario(obtenerSesion())
    setCargando(false)
  }, [])

  const iniciarSesion = useCallback(async (email: string, password: string) => {
    const sesion = await iniciarSesionService(email, password)
    setUsuario(sesion)
    return sesion
  }, [])

  const cerrarSesion = useCallback(() => {
    cerrarSesionService()
    setUsuario(null)
  }, [])

  const value = useMemo(
    () => ({ usuario, cargando, iniciarSesion, cerrarSesion }),
    [usuario, cargando, iniciarSesion, cerrarSesion],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
