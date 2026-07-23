import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { FiltrosEstadoEtiqueta } from "@/modules/dietas-cocina/etiquetas/lib/etiquetasEstilos"

interface EtiquetasFiltrosPanelProps {
  filtrosEstado: FiltrosEstadoEtiqueta
  pabellon: string
  habitacion: string
  tipoDieta: string
  pabellones: string[]
  habitaciones: string[]
  tiposDieta: string[]
  onFiltrosEstadoChange: (filtros: FiltrosEstadoEtiqueta) => void
  onPabellonChange: (value: string) => void
  onHabitacionChange: (value: string) => void
  onTipoDietaChange: (value: string) => void
  onLimpiar: () => void
}

const OPCIONES_ESTADO: Array<{
  key: keyof FiltrosEstadoEtiqueta
  label: string
}> = [
  { key: "pendientes", label: "Pendientes por generar" },
  { key: "generadas", label: "Generadas" },
  { key: "impresas", label: "Impresas" },
  { key: "reimpresas", label: "Re-impresas" },
]

export function EtiquetasFiltrosPanel({
  filtrosEstado,
  pabellon,
  habitacion,
  tipoDieta,
  pabellones,
  habitaciones,
  tiposDieta,
  onFiltrosEstadoChange,
  onPabellonChange,
  onHabitacionChange,
  onTipoDietaChange,
  onLimpiar,
}: EtiquetasFiltrosPanelProps) {
  function toggleEstado(key: keyof FiltrosEstadoEtiqueta, checked: boolean) {
    onFiltrosEstadoChange({ ...filtrosEstado, [key]: checked })
  }

  return (
    <aside className="w-full shrink-0 space-y-5 rounded-xl border border-border bg-card p-4 lg:w-56 xl:w-60">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Filtros</h2>
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto px-0 text-xs"
          onClick={onLimpiar}
        >
          Limpiar
        </Button>
      </div>

      <div className="space-y-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Estado de impresión
        </p>
        <div className="space-y-2">
          {OPCIONES_ESTADO.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <Checkbox
                id={`filtro-${key}`}
                checked={filtrosEstado[key]}
                onCheckedChange={(checked) => toggleEstado(key, checked === true)}
              />
              <Label htmlFor={`filtro-${key}`} className="text-sm font-normal">
                {label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Ubicación
        </p>
        <Select value={pabellon} onValueChange={onPabellonChange}>
          <SelectTrigger className="h-9 w-full bg-background">
            <SelectValue placeholder="Pabellón" />
          </SelectTrigger>
          <SelectContent>
            {pabellones.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={habitacion} onValueChange={onHabitacionChange}>
          <SelectTrigger className="h-9 w-full bg-background">
            <SelectValue placeholder="Habitación" />
          </SelectTrigger>
          <SelectContent>
            {habitaciones.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Tipo de dieta
        </p>
        <Select value={tipoDieta} onValueChange={onTipoDietaChange}>
          <SelectTrigger className="h-9 w-full bg-background">
            <SelectValue placeholder="Tipo de dieta" />
          </SelectTrigger>
          <SelectContent>
            {tiposDieta.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </aside>
  )
}
