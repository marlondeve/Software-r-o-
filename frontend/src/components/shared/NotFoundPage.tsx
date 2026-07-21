import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/autenticacion/hooks/useAuth"

export function NotFoundPage() {
  const { usuario } = useAuth()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="text-2xl font-semibold text-foreground">
        Página no encontrada
      </h1>
      <p className="max-w-md text-muted-foreground">
        La ruta solicitada no existe en BITAL o ya no está disponible.
      </p>
      <Button asChild>
        <Link to={usuario ? "/modulos" : "/login"}>
          {usuario ? "Volver a módulos" : "Ir al inicio de sesión"}
        </Link>
      </Button>
    </main>
  )
}
