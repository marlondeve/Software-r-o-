import { Loader2 } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ProgressBar } from "@/modules/dietas-cocina/inicio/components/ProgressBar"

export interface EtiquetasProgresoDialogProps {
  open: boolean
  titulo: string
  descripcion?: string
  /** 0–100. Si no se pasa, la barra queda indeterminada. */
  progreso?: number
}

export function EtiquetasProgresoDialog({
  open,
  titulo,
  descripcion,
  progreso,
}: EtiquetasProgresoDialogProps) {
  const indeterminado = progreso == null

  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        /* No se cierra mientras corre la generación. */
      }}
    >
      <DialogContent
        showCloseButton={false}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
        className="sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Loader2 className="size-4 shrink-0 animate-spin" />
            {titulo}
          </DialogTitle>
          {descripcion ? (
            <DialogDescription>{descripcion}</DialogDescription>
          ) : (
            <DialogDescription className="sr-only">
              Operación en curso. Espere a que termine.
            </DialogDescription>
          )}
        </DialogHeader>
        {indeterminado ? (
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
          </div>
        ) : (
          <ProgressBar value={progreso} showLabel label="Avance" />
        )}
      </DialogContent>
    </Dialog>
  )
}
