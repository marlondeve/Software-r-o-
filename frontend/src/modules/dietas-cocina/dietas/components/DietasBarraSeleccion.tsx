import { ClipboardCheck, Download, UtensilsCrossed } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DietasBarraSeleccionProps {
  cantidad: number
  visible: boolean
  onExportar?: () => void
  onAsignarConsistencia?: () => void
  onConfirmarSeleccionados?: () => void
}

export function DietasBarraSeleccion({
  cantidad,
  visible,
  onExportar,
  onAsignarConsistencia,
  onConfirmarSeleccionados,
}: DietasBarraSeleccionProps) {
  const etiqueta =
    cantidad === 1
      ? "1 paciente seleccionado"
      : `${cantidad} pacientes seleccionados`

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-4 py-3 shadow-lg backdrop-blur-sm transition-transform duration-200 md:px-6",
        visible ? "translate-y-0" : "translate-y-full pointer-events-none",
      )}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-foreground">{etiqueta}</p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onExportar}>
            <Download data-icon="inline-start" />
            Exportar
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAsignarConsistencia}
          >
            <UtensilsCrossed data-icon="inline-start" />
            Asignar consistencia
          </Button>
          <Button type="button" size="sm" onClick={onConfirmarSeleccionados}>
            <ClipboardCheck data-icon="inline-start" />
            Confirmar seleccionados
          </Button>
        </div>
      </div>
    </div>
  )
}
