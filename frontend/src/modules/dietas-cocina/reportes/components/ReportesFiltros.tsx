import { useState } from "react"
import { Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DateRangePickerFromString } from "@/components/ui/date-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ReportesFiltrosProps {
  rangoFechas: string
  servicio: string
  horario: string
  ultimaActualizacion: string
}

export function ReportesFiltros({
  rangoFechas,
  servicio,
  horario,
  ultimaActualizacion,
}: ReportesFiltrosProps) {
  const [desde, setDesde] = useState("2023-10-01")
  const [hasta, setHasta] = useState("2023-10-24")

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
        <DateRangePickerFromString
          from={desde}
          to={hasta}
          onChange={({ from, to }) => {
            if (from) setDesde(from)
            if (to) setHasta(to)
          }}
          placeholder={rangoFechas}
          className="h-8 shrink-0 bg-card"
        />
        <Select defaultValue="servicio">
          <SelectTrigger className="h-8 w-auto shrink-0 bg-card">
            <SelectValue placeholder={servicio} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="servicio">{servicio}</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="horario">
          <SelectTrigger className="h-8 w-auto shrink-0 bg-card">
            <SelectValue placeholder={horario} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="horario">{horario}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <p className="hidden text-xs whitespace-nowrap text-muted-foreground sm:block">
          Última actualización:{" "}
          <span className="font-medium text-foreground">
            {ultimaActualizacion}
          </span>
        </p>
        <Button size="sm" className="shrink-0">
          <Download data-icon="inline-start" />
          Exportar
        </Button>
      </div>
    </div>
  )
}
