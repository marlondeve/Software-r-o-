import { Printer } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface EtiquetasToolbarProps {
  totalVisibles: number
  seleccionados: number
  todoSeleccionado: boolean
  parcialmenteSeleccionado: boolean
  imprimiendo: boolean
  reimprimiendo: boolean
  onToggleTodas: (checked: boolean) => void
  onImprimir: () => void
  onReimprimir: () => void
}

export function EtiquetasToolbar({
  totalVisibles,
  seleccionados,
  todoSeleccionado,
  parcialmenteSeleccionado,
  imprimiendo,
  reimprimiendo,
  onToggleTodas,
  onImprimir,
  onReimprimir,
}: EtiquetasToolbarProps) {
  const checkedState =
    todoSeleccionado ? true : parcialmenteSeleccionado ? "indeterminate" : false

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Checkbox
          id="seleccionar-todas-etiquetas"
          checked={checkedState}
          onCheckedChange={(checked) => onToggleTodas(checked === true)}
          disabled={totalVisibles === 0}
        />
        <Label htmlFor="seleccionar-todas-etiquetas" className="text-sm font-normal">
          Seleccionar todo
          {totalVisibles > 0 && (
            <span className="ml-1 text-muted-foreground">({totalVisibles})</span>
          )}
        </Label>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={seleccionados === 0 || reimprimiendo || imprimiendo}
          onClick={onReimprimir}
        >
          <Printer data-icon="inline-start" />
          {reimprimiendo ? "Reimprimiendo…" : `Reimprimir (${seleccionados})`}
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={seleccionados === 0 || imprimiendo || reimprimiendo}
          onClick={onImprimir}
        >
          <Printer data-icon="inline-start" />
          {imprimiendo ? "Generando PDF…" : `Imprimir (${seleccionados})`}
        </Button>
      </div>
    </div>
  )
}
