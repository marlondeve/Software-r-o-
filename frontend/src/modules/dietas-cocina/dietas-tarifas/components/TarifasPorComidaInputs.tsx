import type { TiempoComida } from "@/modules/dietas-cocina/types/enums"
import { COMIDAS_TABS } from "@/modules/dietas-cocina/dietas/datos/mockDietas"
import {
  labelComidaTarifa,
  type TarifasPorComidaForm,
} from "@/modules/dietas-cocina/dietas-tarifas/lib/tarifasPorComida"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface TarifasPorComidaInputsProps {
  values: TarifasPorComidaForm
  onChange: (values: TarifasPorComidaForm) => void
  readOnly?: boolean
  idPrefix?: string
}

export function TarifasPorComidaInputs({
  values,
  onChange,
  readOnly = false,
  idPrefix = "tarifa",
}: TarifasPorComidaInputsProps) {
  function patch(comida: TiempoComida, monto: string) {
    onChange({ ...values, [comida]: monto })
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {COMIDAS_TABS.map((comida) => (
        <div key={comida.id} className="space-y-2">
          <Label htmlFor={`${idPrefix}-${comida.id}`}>
            {labelComidaTarifa(comida.id)}
          </Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              $
            </span>
            <Input
              id={`${idPrefix}-${comida.id}`}
              className="pl-7"
              placeholder="0"
              inputMode="numeric"
              readOnly={readOnly}
              value={values[comida.id]}
              onChange={(event) => patch(comida.id, event.target.value)}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
