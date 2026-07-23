import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { DietaCatalogo } from "@/modules/dietas-cocina/dietas-tarifas/datos/mockDietasTarifas"
import { formatearFechaHoraCatalogo } from "@/modules/dietas-cocina/dietas-tarifas/lib/dietasTarifasEstilos"

interface DesactivarDietaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dieta: DietaCatalogo | null
  onConfirmar: (dieta: DietaCatalogo) => void
}

export function DesactivarDietaDialog({
  open,
  onOpenChange,
  dieta,
  onConfirmar,
}: DesactivarDietaDialogProps) {
  if (!dieta) return null

  function confirmar() {
    onConfirmar({
      ...dieta,
      activa: false,
      estado: "vencida",
      ultimaActualizacion: formatearFechaHoraCatalogo(new Date()),
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Desactivar dieta</DialogTitle>
          <DialogDescription>
            ¿Desactivar <strong>{dieta.nombre}</strong> ({dieta.codigo})? No
            estará disponible para nuevas prescripciones hasta que se reactive.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={confirmar}
          >
            Desactivar dieta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
