import { Menu } from "lucide-react"
import { useLocation } from "react-router-dom"

import { ModuleSwitcher } from "@/components/layout/ModuleSwitcher"
import { TopBarBusqueda } from "@/components/layout/TopBarBusqueda"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/autenticacion/hooks/useAuth"
import {
  esRutaDeModulo,
  obtenerRolEnModulo,
  resolverModuloActivo,
  usuarioEsAdministrador,
} from "@/lib/modulos"
import { SelectorVistaRolAdmin } from "@/modules/dietas-cocina/components/SelectorVistaRolAdmin"
import { useVistaRolAdmin } from "@/modules/dietas-cocina/context/VistaRolAdminContext"
import type { ModuloId } from "@/types/module"

interface TopBarProps {
  module: ModuloId
  onMenuClick?: () => void
}

function resolverPlaceholderBusqueda(
  pathname: string,
  modulo: ModuloId | null,
): string {
  if (pathname.startsWith("/administracion")) {
    return "Buscar usuarios o roles..."
  }
  if (modulo === "dietas-cocina") {
    return "Buscar orden, paciente o habitación..."
  }
  if (modulo === "encuestas") {
    return "Buscar paciente o encuesta..."
  }
  return "Buscar..."
}

export function TopBar({ module, onMenuClick }: TopBarProps) {
  const { usuario } = useAuth()
  const { vistaPreviewActiva, rolVistaPreview } = useVistaRolAdmin()
  const location = useLocation()
  const moduloActual =
    esRutaDeModulo(location.pathname) ?? module ?? resolverModuloActivo(usuario)
  const rol = obtenerRolEnModulo(usuario, moduloActual)
  const enAdministracion = location.pathname.startsWith("/administracion")
  const placeholderBusqueda = resolverPlaceholderBusqueda(
    location.pathname,
    moduloActual,
  )

  return (
    <header
      className="border-b border-border bg-card px-4 py-2"
      style={{ minHeight: "var(--header-height)" }}
    >
      <div className="flex h-8 items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0 lg:hidden"
            onClick={onMenuClick}
            aria-label="Abrir menú"
          >
            <Menu className="size-4" />
          </Button>

          <ModuleSwitcher moduloActual={moduloActual} />

          {module === "dietas-cocina" && <SelectorVistaRolAdmin />}

          <div className="relative hidden min-w-0 flex-1 sm:block lg:max-w-sm xl:max-w-md">
            <TopBarBusqueda
              modulo={moduloActual}
              rol={rol}
              placeholder={placeholderBusqueda}
              className="relative w-full"
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {usuario && (
            <div className="hidden text-right md:block">
              <p className="text-sm leading-tight font-medium text-foreground">
                {usuario.nombre}
              </p>
              <div className="mt-0.5 flex justify-end gap-1">
                {rol && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[11px]">
                    {vistaPreviewActiva && rolVistaPreview ? rolVistaPreview : rol}
                  </Badge>
                )}
                {enAdministracion && usuarioEsAdministrador(usuario) && (
                  <Badge variant="outline" className="h-5 px-1.5 text-[11px]">
                    Administración
                  </Badge>
                )}
              </div>
            </div>
          )}
          <Avatar className="size-8 ring-1 ring-border">
            <AvatarImage src="" alt={usuario?.nombre ?? "Usuario"} />
            <AvatarFallback className="bg-muted text-[11px] text-muted-foreground">
              {usuario?.iniciales ?? "CR"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="relative mt-2 sm:hidden">
        <TopBarBusqueda
          modulo={moduloActual}
          rol={rol}
          placeholder={placeholderBusqueda}
          className="relative w-full"
        />
      </div>
    </header>
  )
}
