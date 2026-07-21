import { Menu, Search } from "lucide-react"
import { useLocation } from "react-router-dom"

import { ModuleSwitcher } from "@/components/layout/ModuleSwitcher"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/features/autenticacion/hooks/useAuth"
import {
  esRutaDeModulo,
  obtenerRolEnModulo,
  resolverModuloActivo,
  usuarioEsAdministrador,
} from "@/lib/modulos"
import type { ModuloId } from "@/tipos/modulo"

interface TopBarProps {
  module: ModuloId
  onMenuClick?: () => void
}

export function TopBar({ module, onMenuClick }: TopBarProps) {
  const { usuario } = useAuth()
  const location = useLocation()
  const moduloActual =
    esRutaDeModulo(location.pathname) ?? module ?? resolverModuloActivo(usuario)
  const rol = obtenerRolEnModulo(usuario, moduloActual)
  const enAdministracion = location.pathname.startsWith("/administracion")

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

          <div className="relative hidden min-w-0 flex-1 sm:block lg:max-w-sm xl:max-w-md">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar usuarios o roles..."
              className="h-8 w-full rounded-full border-0 bg-muted py-0 pl-9 text-sm shadow-none focus-visible:ring-1"
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
                    {rol}
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
        <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar usuarios o roles..."
          className="h-8 w-full rounded-full border-0 bg-muted py-0 pl-9 text-sm shadow-none focus-visible:ring-1"
        />
      </div>
    </header>
  )
}
