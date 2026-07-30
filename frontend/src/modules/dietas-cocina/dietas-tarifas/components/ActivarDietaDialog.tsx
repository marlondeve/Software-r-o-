import type { DietaCatalogo } from "@/modules/dietas-cocina/types/catalog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatearFechaHoraCatalogo } from "@/modules/dietas-cocina/dietas-tarifas/lib/dietasTarifasEstilos"

interface ActivarDietaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dieta: DietaCatalogo | null
  onConfirmar: (dieta: DietaCatalogo) => void | Promise<void>
}

export function ActivarDietaDialog({
  open,
  onOpenChange,
  dieta,
  onConfirmar,
}: ActivarDietaDialogProps) {
  if (!dieta) return null

  async function confirmar() {
    if (!dieta) return
    try {
      await onConfirmar({
        ...dieta,
        activa: true,
        estado: "vigente",
        ultimaActualizacion: formatearFechaHoraCatalogo(new Date()),
      })
      onOpenChange(false)
    } catch {
      // El padre muestra el error; mantener el diálogo abierto.
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Activar dieta</DialogTitle>
          <DialogDescription>
            ¿Activar <strong>{dieta.nombre}</strong> ({dieta.codigo})? Volverá a
            estar disponible para nuevas prescripciones.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={confirmar}>
            Activar dieta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
