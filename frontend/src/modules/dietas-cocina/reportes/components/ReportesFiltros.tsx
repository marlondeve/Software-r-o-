import type { FiltrosReportes } from "@/modules/dietas-cocina/types/reports"
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
import { COMIDAS_TABS } from "@/modules/dietas-cocina/dietas/datos/mockDietas"
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
      "Reporte — módulo Dietas y Cocina\n",
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
            <SelectItem value="todos">Todos los servicios</SelectItem>
            <SelectItem value="cardiologia">Cardiología · Pab Central</SelectItem>
            <SelectItem value="pediatria">Pediatría · Pab Norte</SelectItem>
            <SelectItem value="urgencias">Urgencias · Pab Sur</SelectItem>
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
            <SelectItem value="todos">Todos los turnos</SelectItem>
            {COMIDAS_TABS.map((comida) => (
              <SelectItem key={comida.id} value={comida.id}>
                {comida.label}
              </SelectItem>
            ))}
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
