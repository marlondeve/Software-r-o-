import type { AccionDietaFila } from "@/modules/dietas-cocina/dietas/lib/dietasAcciones"
import { useState } from "react"
import { MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DietasFilaAccionesPopoverProps {
  acciones: AccionDietaFila[]
  ariaLabel?: string
}

export function DietasFilaAccionesPopover({
  acciones,
  ariaLabel = "Más acciones",
}: DietasFilaAccionesPopoverProps) {
  const [open, setOpen] = useState(false)

  function ejecutar(onClick: () => void) {
    onClick()
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="size-8 border-border bg-background shadow-xs"
          aria-label={ariaLabel}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 p-1">
        {acciones.map((accion) => (
          <button
            key={accion.key}
            type="button"
            className={
              accion.destructive
                ? "flex w-full rounded-md px-2 py-1.5 text-left text-sm text-destructive hover:bg-destructive/10"
                : "flex w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
            }
            onClick={() => ejecutar(accion.onClick)}
          >
            {accion.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}
