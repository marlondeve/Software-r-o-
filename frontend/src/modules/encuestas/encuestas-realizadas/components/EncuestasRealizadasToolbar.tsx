import { Bookmark, Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DateRangePickerFromString } from "@/components/ui/date-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CANALES } from "@/modules/encuestas/encuestas-realizadas/datos/mockEncuestasRealizadas"

interface EncuestasRealizadasToolbarProps {
  rango: { from?: string; to?: string }
  onRangoChange: (rango: { from?: string; to?: string }) => void
  canal: string
  onCanalChange: (canal: string) => void
}

export function EncuestasRealizadasToolbar({
  rango,
  onRangoChange,
  canal,
  onCanalChange,
}: EncuestasRealizadasToolbarProps) {
  return (
    <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <DateRangePickerFromString
          from={rango.from}
          to={rango.to}
          onChange={onRangoChange}
          className="h-10 bg-card"
        />

        <Select value={canal} onValueChange={onCanalChange}>
          <SelectTrigger className="h-10 w-full bg-card sm:w-48">
            <SelectValue placeholder="Todos los canales" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los canales</SelectItem>
            {CANALES.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" className="h-10">
          <Bookmark data-icon="inline-start" />
          Filtros guardados
        </Button>
        <Button type="button" variant="outline" className="h-10">
          <Download data-icon="inline-start" />
          Exportar
        </Button>
      </div>
    </div>
  )
}
