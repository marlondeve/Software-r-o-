import { Settings2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { useConfigAccesoModulos } from "@/hooks/useConfigAccesoModulos"
import {
  RUTAS_DIETAS,
  alternarPermisoRutaDietas,
  type RutaDietasConfig,
} from "@/lib/configAccesoModulos"
import type { RolDietas } from "@/modules/dietas-cocina/lib/roles"
import { cn } from "@/lib/utils"

interface PermisosRolPopoverProps {
  rol: RolDietas
}

function SwitchPermiso({
  id,
  label,
  checked,
  onChange,
}: {
  id: string
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer text-sm">
        {label}
      </label>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        aria-label={label}
      />
    </div>
  )
}

export function PermisosRolPopover({ rol }: PermisosRolPopoverProps) {
  const { config, actualizar } = useConfigAccesoModulos()
  const rutasActivas = new Set(config.permisosDietas[rol] ?? [])

  function alternarRuta(ruta: RutaDietasConfig, activo: boolean) {
    actualizar(alternarPermisoRutaDietas(config, rol, ruta, activo))
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Settings2 data-icon="inline-start" />
          Editar
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <PopoverHeader className="border-b px-4 py-3">
          <PopoverTitle>Permisos — {rol}</PopoverTitle>
          <PopoverDescription>
            Secciones habilitadas en Dietas y Cocina.
          </PopoverDescription>
        </PopoverHeader>
        <ScrollArea className="max-h-72">
          <div className="space-y-0.5 px-4 py-2">
            {RUTAS_DIETAS.map((ruta) => (
              <SwitchPermiso
                key={ruta.id}
                id={`${rol}-${ruta.id}`}
                label={ruta.label}
                checked={rutasActivas.has(ruta.id)}
                onChange={(activo) => alternarRuta(ruta.id, activo)}
              />
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

interface PermisosRolResumenProps {
  rol: RolDietas
  className?: string
}

export function PermisosRolResumen({ rol, className }: PermisosRolResumenProps) {
  const { config } = useConfigAccesoModulos()
  const rutas = config.permisosDietas[rol] ?? []
  const etiquetas = rutas
    .map(
      (id) => RUTAS_DIETAS.find((ruta) => ruta.id === id)?.label ?? id,
    )
    .join(", ")

  return (
    <span className={cn("text-muted-foreground", className)}>
      {etiquetas || "Sin secciones asignadas"}
    </span>
  )
}
