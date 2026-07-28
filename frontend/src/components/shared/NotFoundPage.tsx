import { Link } from "react-router-dom"

import { AppBrandName } from "@/components/layout/AppBrandName"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/autenticacion/hooks/useAuth"
import { obtenerDestinoPostLogin } from "@/lib/modulos"

export function NotFoundPage() {
  const { usuario } = useAuth()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="text-2xl font-semibold text-foreground">
        Página no encontrada
      </h1>
      <p className="max-w-md text-muted-foreground">
        La ruta solicitada no existe en <AppBrandName /> o ya no está disponible.
      </p>
      <Button asChild>
        <Link to={usuario ? obtenerDestinoPostLogin(usuario) : "/login"}>
          {usuario ? "Volver al inicio" : "Ir al inicio de sesión"}
        </Link>
      </Button>
    </main>
  )
}
