import { DatePickerFromString } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { DietaCatalogoFormValues } from "@/modules/dietas-cocina/dietas-tarifas/lib/dietaCatalogoFormDefaults"
import { TarifasPorComidaInputs } from "@/modules/dietas-cocina/dietas-tarifas/components/TarifasPorComidaInputs"

interface DietaCatalogoFormProps {
  values: DietaCatalogoFormValues
  onChange: (values: DietaCatalogoFormValues) => void
  codigoReadOnly?: boolean
  tarifaReadOnly?: boolean
}

export function DietaCatalogoForm({
  values,
  onChange,
  codigoReadOnly = false,
  tarifaReadOnly = false,
}: DietaCatalogoFormProps) {
  function patch(partial: Partial<DietaCatalogoFormValues>) {
    onChange({ ...values, ...partial })
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="codigo-dieta">Código</Label>
        <Input
          id="codigo-dieta"
          placeholder="Ej. D-HIPO-01"
          value={values.codigo}
          readOnly={codigoReadOnly}
          onChange={(e) => patch({ codigo: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="nombre-dieta">Nombre de la Dieta</Label>
        <Input
          id="nombre-dieta"
          placeholder="Ej. Hiposódica Estricta"
          value={values.nombre}
          onChange={(e) => patch({ nombre: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="descripcion-dieta">Descripción / Observaciones</Label>
        <Textarea
          id="descripcion-dieta"
          rows={4}
          placeholder="Especificaciones detalladas de la dieta para cocina..."
          value={values.descripcion}
          onChange={(e) => patch({ descripcion: e.target.value })}
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <div>
          <Label>
            {tarifaReadOnly
              ? "Tarifas vigentes por comida (COP)"
              : "Tarifas iniciales por comida (COP, opcional)"}
          </Label>
          <p className="text-xs text-muted-foreground">
            Cada tiempo de comida puede tener un valor distinto.
          </p>
        </div>
        {tarifaReadOnly ? (
          <TarifasPorComidaInputs
            values={values.tarifasPorComida}
            onChange={() => {}}
            readOnly
            idPrefix="tarifa-vigente"
          />
        ) : (
          <TarifasPorComidaInputs
            values={values.tarifasPorComida}
            onChange={(tarifasPorComida) => patch({ tarifasPorComida })}
          />
        )}
        {tarifaReadOnly && (
          <p className="text-xs text-muted-foreground">
            Para cambiar las tarifas use la acción &quot;Nueva tarifa&quot; en el catálogo.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="inicio-vigencia">Inicio vigencia</Label>
          <DatePickerFromString
            id="inicio-vigencia"
            value={values.fechaInicio}
            onChange={(fechaInicio) => patch({ fechaInicio })}
            placeholder="Seleccionar inicio"
            className="bg-card"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fin-vigencia">Fin (opcional)</Label>
          <DatePickerFromString
            id="fin-vigencia"
            value={values.fechaFin}
            onChange={(fechaFin) => patch({ fechaFin })}
            placeholder="Seleccionar fin"
            className="bg-card"
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
        <div>
          <p className="text-sm font-medium">Estado de la Dieta</p>
          <p className="text-xs text-muted-foreground">
            Determina si está disponible para prescripción.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="activa-dieta" className="text-sm font-normal">
            Activa
          </Label>
          <Switch
            id="activa-dieta"
            checked={values.activa}
            onCheckedChange={(checked) => patch({ activa: checked })}
          />
        </div>
      </div>
    </div>
  )
}
