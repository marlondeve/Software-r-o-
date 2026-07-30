import type { DietaCatalogo } from "@/modules/dietas-cocina/types/catalog"
import { useState } from "react"
import {
  Ban,
  History,
  MoreHorizontal,
  PencilLine,
  Power,
  Receipt,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DietasTarifasAccionesPopoverProps {
  dieta: DietaCatalogo
  onEditar: (dieta: DietaCatalogo) => void
  onHistorico: (dieta: DietaCatalogo) => void
  onNuevaTarifa: (dieta: DietaCatalogo) => void
  onDesactivar: (dieta: DietaCatalogo) => void
  onActivar: (dieta: DietaCatalogo) => void
}

const opcionClassName =
  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted"

export function DietasTarifasAccionesPopover({
  dieta,
  onEditar,
  onHistorico,
  onNuevaTarifa,
  onDesactivar,
  onActivar,
}: DietasTarifasAccionesPopoverProps) {
  const [open, setOpen] = useState(false)

  function ejecutar(accion: () => void) {
    accion()
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm">
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Acciones para {dieta.nombre}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-52 p-1">
        <button
          type="button"
          className={opcionClassName}
          onClick={() => ejecutar(() => onEditar(dieta))}
        >
          <PencilLine className="size-4 shrink-0" />
          Editar información
        </button>
        <button
          type="button"
          className={opcionClassName}
          onClick={() => ejecutar(() => onHistorico(dieta))}
        >
          <History className="size-4 shrink-0" />
          Consultar histórico
        </button>
        {dieta.activa && (
          <button
            type="button"
            className={opcionClassName}
            onClick={() => ejecutar(() => onNuevaTarifa(dieta))}
          >
            <Receipt className="size-4 shrink-0" />
            Crear nueva tarifa
          </button>
        )}
        {dieta.activa ? (
          <button
            type="button"
            className={cn(
              opcionClassName,
              "text-destructive hover:bg-destructive/10",
            )}
            onClick={() => ejecutar(() => onDesactivar(dieta))}
          >
            <Ban className="size-4 shrink-0" />
            Desactivar dieta
          </button>
        ) : (
          <button
            type="button"
            className={cn(opcionClassName, "text-primary hover:bg-primary/10")}
            onClick={() => ejecutar(() => onActivar(dieta))}
          >
            <Power className="size-4 shrink-0" />
            Activar dieta
          </button>
        )}
      </PopoverContent>
    </Popover>
  )
}
