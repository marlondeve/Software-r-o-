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
import { descargarArchivoDemo } from "@/modules/dietas-cocina/lib/demoFeedback"
import type { FiltrosReportes } from "@/modules/dietas-cocina/reportes/lib/aplicarFiltrosReportes"

interface ReportesFiltrosProps {
  rangoFechas: string
  servicio: string
  horario: string
  ultimaActualizacion: string
  filtros: FiltrosReportes
  onFiltrosChange: (filtros: FiltrosReportes) => void
}

export function ReportesFiltros({
  rangoFechas,
  servicio,
  horario,
  ultimaActualizacion,
  filtros,
  onFiltrosChange,
}: ReportesFiltrosProps) {
  function exportar() {
    descargarArchivoDemo(
      "Reporte demo — módulo Dietas y Cocina\n",
      "reportes-dietas-cocina.txt",
    )
  }

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
        <DateRangePickerFromString
          from={filtros.desde}
          to={filtros.hasta}
          onChange={({ from, to }) => {
            onFiltrosChange({
              ...filtros,
              ...(from ? { desde: from } : {}),
              ...(to ? { hasta: to } : {}),
            })
          }}
          placeholder={rangoFechas}
          className="h-8 shrink-0 bg-card"
        />
        <Select
          value={filtros.servicio}
          onValueChange={(servicio) =>
            onFiltrosChange({ ...filtros, servicio })
          }
        >
          <SelectTrigger className="h-8 w-auto shrink-0 bg-card">
            <SelectValue placeholder={servicio} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">{servicio}</SelectItem>
            <SelectItem value="cardiologia">Cardiología</SelectItem>
            <SelectItem value="pediatria">Pediatría</SelectItem>
            <SelectItem value="urgencias">Urgencias</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filtros.horario}
          onValueChange={(horario) =>
            onFiltrosChange({ ...filtros, horario })
          }
        >
          <SelectTrigger className="h-8 w-auto shrink-0 bg-card">
            <SelectValue placeholder={horario} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">{horario}</SelectItem>
            <SelectItem value="desayuno">Desayuno</SelectItem>
            <SelectItem value="almuerzo">Almuerzo</SelectItem>
            <SelectItem value="cena">Cena</SelectItem>
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
        <Button size="sm" className="shrink-0" onClick={exportar}>
          <Download data-icon="inline-start" />
          Exportar
        </Button>
      </div>
    </div>
  )
}
