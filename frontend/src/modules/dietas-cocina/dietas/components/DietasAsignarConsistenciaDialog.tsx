import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { UtensilsCrossed, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SeccionTitulo } from "@/modules/dietas-cocina/dietas/components/shared/dietasSheetUi"

interface DietasAsignarConsistenciaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cantidad: number
  consistencias: string[]
  onConfirmar: (consistencia: string) => void
}

export function DietasAsignarConsistenciaDialog({
  open,
  onOpenChange,
  cantidad,
  consistencias,
  onConfirmar,
}: DietasAsignarConsistenciaDialogProps) {
  const [consistencia, setConsistencia] = useState(consistencias[0] ?? "Sólida")

  useEffect(() => {
    if (open) {
      setConsistencia(consistencias[0] ?? "Sólida")
    }
  }, [open, consistencias])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false)
    }

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    document.addEventListener("keydown", onKeyDown)

    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open, onOpenChange])

  if (!open) return null

  const etiqueta =
    cantidad === 1
      ? "1 paciente seleccionado"
      : `${cantidad} pacientes seleccionados`

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/10 supports-backdrop-filter:backdrop-blur-xs"
        aria-hidden
        onClick={() => onOpenChange(false)}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="asignar-consistencia-titulo"
        className="relative w-full max-w-md overflow-hidden rounded-xl bg-popover text-sm text-popover-foreground shadow-lg ring-1 ring-foreground/10"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="space-y-2 border-b px-6 py-4 pr-14">
          <h2
            id="asignar-consistencia-titulo"
            className="flex items-center gap-2 text-base font-semibold"
          >
            <UtensilsCrossed className="size-5 shrink-0 text-primary" />
            Asignar consistencia
          </h2>
          <p className="text-sm text-muted-foreground">{etiqueta}</p>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute top-3 right-3"
            aria-label="Cerrar"
            onClick={() => onOpenChange(false)}
          >
            <XIcon />
          </Button>
        </header>

        <div className="space-y-4 px-6 py-5">
          <div className="space-y-2">
            <SeccionTitulo>Consistencia</SeccionTitulo>
            <Label htmlFor="consistencia-masiva" className="sr-only">
              Consistencia
            </Label>
            <Select value={consistencia} onValueChange={setConsistencia}>
              <SelectTrigger id="consistencia-masiva" className="w-full">
                <SelectValue placeholder="Seleccione consistencia" />
              </SelectTrigger>
              <SelectContent>
                {consistencias.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            La consistencia se aplicará a todos los pacientes seleccionados. Puede
            ajustar individualmente desde el detalle de cada solicitud.
          </p>
        </div>

        <footer className="flex items-center justify-end gap-2 border-t bg-muted/30 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => {
              onConfirmar(consistencia)
              onOpenChange(false)
            }}
          >
            Aplicar a seleccionados
          </Button>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
