import { useState } from "react"

import { Label } from "@/components/ui/label"
import { TimePicker } from "@/components/ui/time-picker"
import type { HitoTiempo } from "@/modules/dietas-cocina/parametros/datos/mockTiempos"

interface TiemposComidaFormularioProps {
  hitos: HitoTiempo[]
  deshabilitado?: boolean
}

export function TiemposComidaFormulario({
  hitos,
  deshabilitado,
}: TiemposComidaFormularioProps) {
  const [horas, setHoras] = useState<Record<string, string>>(() =>
    Object.fromEntries(hitos.map((hito) => [hito.id, hito.hora])),
  )

  function actualizarHora(id: string, hora: string) {
    setHoras((prev) => ({ ...prev, [id]: hora }))
  }

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
            onChange={(hora) => actualizarHora(hito.id, hora)}
            disabled={deshabilitado}
            className="bg-card"
          />
        </div>
      ))}
    </div>
  )
}
