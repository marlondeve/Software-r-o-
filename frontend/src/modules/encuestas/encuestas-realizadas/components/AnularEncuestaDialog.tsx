import { useEffect, useState } from "react"
import { TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { FilaEncuestaRealizada } from "@/modules/encuestas/encuestas-realizadas/datos/mockEncuestasRealizadas"

interface AnularEncuestaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fila: FilaEncuestaRealizada | null
  onConfirmar: (fila: FilaEncuestaRealizada, motivo: string) => void
}

export function AnularEncuestaDialog({
  open,
  onOpenChange,
  fila,
  onConfirmar,
}: AnularEncuestaDialogProps) {
  const [motivo, setMotivo] = useState("")
  const [entendido, setEntendido] = useState(false)

  useEffect(() => {
    if (open) {
      setMotivo("")
      setEntendido(false)
    }
  }, [open])

  if (!fila) return null

  const puedeConfirmar = motivo.trim().length > 0 && entendido

  function confirmar() {
    if (!fila || !puedeConfirmar) return
    onConfirmar(fila, motivo.trim())
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="flex-row items-start gap-3 bg-destructive/10 px-5 py-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive">
            <TriangleAlert className="size-5" />
          </span>
          <div>
            <DialogTitle className="text-lg">Anular Encuesta</DialogTitle>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Acción irreversible. La encuesta quedará registrada en auditoría.
            </p>
          </div>
        </DialogHeader>

        <div className="space-y-4 px-5 py-4">
          <div className="space-y-2 rounded-lg bg-muted/50 px-4 py-3.5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                ID Encuesta
              </p>
              <p className="text-sm font-semibold text-foreground">{fila.consecutivo}</p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Auditor Actual
              </p>
              <p className="text-sm text-foreground">{fila.encuestador}</p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Fecha y Hora
              </p>
              <p className="text-sm text-foreground">{fila.fecha}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">
              Motivo de la anulación <span className="text-destructive">*</span>
            </Label>
            <Textarea
              value={motivo}
              onChange={(event) => setMotivo(event.target.value)}
              placeholder="Especifique detalladamente el motivo de la anulación..."
              className="min-h-28"
            />
          </div>

          <label className="flex cursor-pointer items-start gap-2.5 text-sm text-foreground">
            <Checkbox
              checked={entendido}
              onCheckedChange={(checked) => setEntendido(checked === true)}
              className="mt-0.5"
            />
            Entiendo que esta encuesta será excluida de los indicadores activos pero
            permanecerá en la auditoría para trazabilidad del sistema.
          </label>
        </div>

        <DialogFooter className="mx-0 mb-0 flex-row items-center justify-end gap-3 rounded-b-xl border-t bg-muted/30 px-5 py-4">
          <Button
            type="button"
            variant="ghost"
            className="h-11 px-4"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="h-11 bg-destructive px-5 text-destructive-foreground hover:bg-destructive/90"
            disabled={!puedeConfirmar}
            onClick={confirmar}
          >
            Confirmar Anulación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
