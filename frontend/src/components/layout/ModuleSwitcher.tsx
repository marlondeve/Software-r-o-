import { ChevronsUpDown } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/features/autenticacion/hooks/useAuth"
import {
  guardarModuloActivo,
  modulosConfig,
  obtenerModulosDisponibles,
} from "@/lib/modulos"
import { cn } from "@/lib/utils"
import type { ModuloId } from "@/tipos/modulo"

const moduleShortLabels: Record<ModuloId, string> = {
  "dietas-cocina": "Gestión de Dietas",
  encuestas: "Encuestas",
}

interface ModuleSwitcherProps {
  moduloActual: ModuloId
}

export function ModuleSwitcher({ moduloActual }: ModuleSwitcherProps) {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const modulos = obtenerModulosDisponibles(usuario)

  if (modulos.length <= 1) return null

  const moduloSeleccionado = modulosConfig[moduloActual]

  function cambiarModulo(moduloId: ModuloId) {
    if (moduloId === moduloActual) return
    guardarModuloActivo(moduloId)
    navigate(modulosConfig[moduloId].rutaInicio)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 max-w-[9.5rem] shrink-0 gap-1.5 rounded-full border-border bg-background px-2.5 font-normal shadow-none sm:max-w-[11rem]"
        >
          <moduloSeleccionado.icon className="size-3.5 shrink-0 text-primary" />
          <span className="truncate text-xs">
            {moduleShortLabels[moduloActual]}
          </span>
          <ChevronsUpDown className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuLabel className="text-xs">Cambiar módulo</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {modulos.map((modulo) => {
          const Icon = modulo.icon
          const activo = modulo.id === moduloActual

          return (
            <DropdownMenuItem
              key={modulo.id}
              onClick={() => cambiarModulo(modulo.id)}
              className={cn("text-sm", activo && "bg-accent/50")}
            >
              <Icon className="size-3.5 text-primary" />
              <span>{modulo.titulo}</span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
