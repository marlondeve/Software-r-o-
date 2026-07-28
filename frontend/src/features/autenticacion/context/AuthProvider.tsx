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
  rehidratarSesion,
} from "@/services/authService"
import type { Usuario } from "@/types/user"

interface AuthContextValue {
  usuario: Usuario | null
  cargando: boolean
  iniciarSesion: (usuario: string, password: string) => Promise<Usuario>
  cerrarSesion: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let activo = true

    void (async () => {
      const sesion = await rehidratarSesion()
      if (activo) {
        setUsuario(sesion)
        setCargando(false)
      }
    })()

    return () => {
      activo = false
    }
  }, [])

  const iniciarSesion = useCallback(
    async (usuario: string, password: string) => {
      const sesion = await iniciarSesionService(usuario, password)
      setUsuario(sesion)
      return sesion
    },
    [],
  )

  const cerrarSesion = useCallback(async () => {
    await cerrarSesionService()
    setUsuario(null)
  }, [])

  const value = useMemo(
    () => ({ usuario, cargando, iniciarSesion, cerrarSesion }),
    [usuario, cargando, iniciarSesion, cerrarSesion],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
