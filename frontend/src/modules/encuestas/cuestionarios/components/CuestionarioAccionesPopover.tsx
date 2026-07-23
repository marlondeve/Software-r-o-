import { useState } from "react"
import { Archive, ArchiveRestore, Copy, Eye, MoreHorizontal, PencilLine, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { Cuestionario } from "@/modules/encuestas/cuestionarios/datos/mockCuestionarios"
import { cn } from "@/lib/utils"

interface CuestionarioAccionesPopoverProps {
  cuestionario: Cuestionario
  onEditar: (cuestionario: Cuestionario) => void
  onVerPreguntas: (cuestionario: Cuestionario) => void
  onDuplicar: (cuestionario: Cuestionario) => void
  onToggleEstado: (cuestionario: Cuestionario) => void
  onEliminar: (cuestionario: Cuestionario) => void
}

const opcionClassName =
  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted"

export function CuestionarioAccionesPopover({
  cuestionario,
  onEditar,
  onVerPreguntas,
  onDuplicar,
  onToggleEstado,
  onEliminar,
}: CuestionarioAccionesPopoverProps) {
  const [open, setOpen] = useState(false)

  function ejecutar(accion: () => void) {
    accion()
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="icon">
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Acciones para {cuestionario.nombre}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-1">
        <button
          type="button"
          className={opcionClassName}
          onClick={() => ejecutar(() => onEditar(cuestionario))}
        >
          <PencilLine className="size-4 text-muted-foreground" />
          Editar cuestionario
        </button>
        <button
          type="button"
          className={opcionClassName}
          onClick={() => ejecutar(() => onVerPreguntas(cuestionario))}
        >
          <Eye className="size-4 text-muted-foreground" />
          Ver preguntas
        </button>
        <button
          type="button"
          className={opcionClassName}
          onClick={() => ejecutar(() => onDuplicar(cuestionario))}
        >
          <Copy className="size-4 text-muted-foreground" />
          Duplicar
        </button>
        <button
          type="button"
          className={opcionClassName}
          onClick={() => ejecutar(() => onToggleEstado(cuestionario))}
        >
          {cuestionario.estado === "inactivo" ? (
            <ArchiveRestore className="size-4 text-muted-foreground" />
          ) : (
            <Archive className="size-4 text-muted-foreground" />
          )}
          {cuestionario.estado === "inactivo" ? "Activar" : "Desactivar"}
        </button>
        <div className="my-1 h-px bg-border" />
        <button
          type="button"
          className={cn(opcionClassName, "text-destructive hover:bg-destructive/10")}
          onClick={() => ejecutar(() => onEliminar(cuestionario))}
        >
          <Trash2 className="size-4" />
          Eliminar
        </button>
      </PopoverContent>
    </Popover>
  )
}
