import type { ReactNode } from "react"
import { AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ConfirmarAccionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  titulo: string
  descripcion: ReactNode
  advertencia?: string
  confirmarLabel?: string
  cancelarLabel?: string
  onConfirmar: () => void
  destructivo?: boolean
}

export function ConfirmarAccionDialog({
  open,
  onOpenChange,
  titulo,
  descripcion,
  advertencia,
  confirmarLabel = "Confirmar",
  cancelarLabel = "Cancelar",
  onConfirmar,
  destructivo = false,
}: ConfirmarAccionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              {descripcion}
            </div>
          </DialogDescription>
        </DialogHeader>

        {advertencia && (
          <div className="flex gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>{advertencia}</p>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {cancelarLabel}
          </Button>
          <Button
            type="button"
            variant={destructivo ? "destructive" : "default"}
            onClick={() => {
              onConfirmar()
              onOpenChange(false)
            }}
          >
            {confirmarLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
