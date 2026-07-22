import { ArrowRight, LogOut, Settings } from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import { ClinicaLogo } from "@/components/layout/ClinicaLogo"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ConfiguracionAccesoModulosDialog } from "@/features/autenticacion/components/ConfiguracionAccesoModulosDialog"
import { useAuth } from "@/features/autenticacion/hooks/useAuth"
import {
  modulosConfig,
  guardarModuloActivo,
  obtenerDestinoPostLogin,
  obtenerModulosDisponibles,
  obtenerRolEnModulo,
  usuarioEsAdministrador,
} from "@/lib/modulos"
import type { ModuloId } from "@/tipos/modulo"

export function SeleccionModuloPage() {
  const navigate = useNavigate()
  const { usuario, cerrarSesion } = useAuth()
  const [configAbierta, setConfigAbierta] = useState(false)
  const esAdmin = usuarioEsAdministrador(usuario)

  useEffect(() => {
    if (usuario?.accesos.length === 1) {
      navigate(obtenerDestinoPostLogin(usuario), { replace: true })
    }
  }, [usuario, navigate])

  if (!usuario) return null

  const modulos = obtenerModulosDisponibles(usuario)

  function entrarModulo(moduloId: ModuloId) {
    guardarModuloActivo(moduloId)
    navigate(modulosConfig[moduloId].rutaInicio)
  }

  function handleLogout() {
    cerrarSesion()
    navigate("/login", { replace: true })
  }

  return (
    <main className="relative min-h-screen bg-background px-4 py-6">
      {esAdmin && (
        <div className="absolute top-4 right-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Configurar roles y permisos"
                onClick={() => setConfigAbierta(true)}
              >
                <Settings className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Roles y permisos por módulo</TooltipContent>
          </Tooltip>
        </div>
      )}

      <ConfiguracionAccesoModulosDialog
        open={configAbierta}
        onOpenChange={setConfigAbierta}
      />

      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <ClinicaLogo className="mb-3 h-10" />
          <h1 className="text-xl font-bold text-foreground">BITAL</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Hola, {usuario.nombre}. Selecciona el módulo al que deseas ingresar.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {modulos.map((modulo) => {
            const rol = obtenerRolEnModulo(usuario, modulo.id)
            const Icon = modulo.icon

            return (
              <Card
                key={modulo.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => entrarModulo(modulo.id)}
              >
                <CardHeader className="pb-2">
                  <div className="mb-1.5 flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </div>
                  <CardTitle className="text-base">{modulo.titulo}</CardTitle>
                  <CardDescription className="text-xs">{modulo.descripcion}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between pt-0">
                  {rol && <Badge variant="secondary" className="text-[11px]">{rol}</Badge>}
                  <span className="flex items-center gap-1 text-xs font-medium text-primary">
                    Entrar
                    <ArrowRight className="size-3.5" />
                  </span>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-8 flex justify-center">
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="size-4" />
            Cerrar sesión
          </Button>
        </div>
      </div>
    </main>
  )
}
