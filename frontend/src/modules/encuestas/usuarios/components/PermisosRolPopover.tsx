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
import {
  RUTAS_ENCUESTAS_MODULO,
  type RutaEncuestasModulo,
} from "@/modules/encuestas/lib/permisos"
import type { RolEncuestas } from "@/modules/encuestas/lib/roles"

interface PermisosRolPopoverProps {
  rol: RolEncuestas
  rutasActivas: RutaEncuestasModulo[]
  onToggle: (ruta: RutaEncuestasModulo, activo: boolean) => void
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
      <Switch id={id} checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  )
}

export function PermisosRolPopover({ rol, rutasActivas, onToggle }: PermisosRolPopoverProps) {
  const activas = new Set(rutasActivas)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="h-10">
          <Settings2 data-icon="inline-start" />
          Editar
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <PopoverHeader className="border-b px-4 py-3">
          <PopoverTitle>Permisos — {rol}</PopoverTitle>
          <PopoverDescription>
            Secciones habilitadas en el módulo Encuestas.
          </PopoverDescription>
        </PopoverHeader>
        <ScrollArea className="max-h-72">
          <div className="space-y-0.5 px-4 py-2">
            {RUTAS_ENCUESTAS_MODULO.map((ruta) => (
              <SwitchPermiso
                key={ruta.id}
                id={`${rol}-${ruta.id}`}
                label={ruta.label}
                checked={activas.has(ruta.id)}
                onChange={(activo) => onToggle(ruta.id, activo)}
              />
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
