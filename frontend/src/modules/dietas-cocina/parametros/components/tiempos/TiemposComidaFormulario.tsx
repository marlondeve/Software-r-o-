import { Label } from "@/components/ui/label"
import { TimePicker } from "@/components/ui/time-picker"
import type { HitoTiempo } from "@/modules/dietas-cocina/parametros/datos/mockTiempos"

interface TiemposComidaFormularioProps {
  hitos: HitoTiempo[]
  horas: Record<string, string>
  onHoraChange: (id: string, hora: string) => void
  deshabilitado?: boolean
}

export function TiemposComidaFormulario({
  hitos,
  horas,
  onHoraChange,
  deshabilitado,
}: TiemposComidaFormularioProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {hitos.map((hito) => (
        <div key={hito.id} className="space-y-1.5">
          <Label
            htmlFor={hito.id}
            className="text-[11px] font-semibold tracking-wide text-muted-foreground"
          >
            {hito.label}
          </Label>
          <TimePicker
            id={hito.id}
            value={horas[hito.id] ?? hito.hora}
            onChange={(hora) => onHoraChange(hito.id, hora)}
            disabled={deshabilitado}
            className="bg-card"
          />
        </div>
      ))}
    </div>
  )
}
