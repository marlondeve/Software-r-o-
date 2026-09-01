import { Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DateRangePickerFromString } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CONCILIACION_FILTROS_UI } from "@/modules/dietas-cocina/config/conciliacion-ui"
import {
  rangoMesAnterior,
  rangoUltimosDias,
} from "@/modules/dietas-cocina/conciliacion/lib/conciliacionFiltros"
import { demoToast } from "@/modules/dietas-cocina/lib/demoFeedback"

interface ConciliacionFiltrosProps {
  desde: string
  hasta: string
  estado: string
  numeroFactura: string
  apiActiva: boolean
  onRangoChange: (rango: { desde: string; hasta: string }) => void
  onEstadoChange: (value: string) => void
  onNumeroFacturaChange: (value: string) => void
  onExportar: () => Promise<void> | void
}

export function ConciliacionFiltros({
  desde,
  hasta,
  estado,
  numeroFactura,
  apiActiva,
  onRangoChange,
  onEstadoChange,
  onNumeroFacturaChange,
  onExportar,
}: ConciliacionFiltrosProps) {
  async function manejarExportar() {
    try {
      await onExportar()
    } catch (err) {
      demoToast(err instanceof Error ? err.message : "No se pudo exportar.", "error")
    }
  }

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-1.5 sm:col-span-2">
          <p className="text-xs font-medium text-muted-foreground">Periodo</p>
          <DateRangePickerFromString
            from={desde}
            to={hasta}
            onChange={({ from, to }) => {
              if (from && to) onRangoChange({ desde: from, hasta: to })
            }}
            placeholder={CONCILIACION_FILTROS_UI.rangoPlaceholder}
            className="h-9 w-full bg-card"
          />
          <div className="flex flex-wrap gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => onRangoChange(rangoUltimosDias(7))}
            >
              Últimos 7 días
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => onRangoChange(rangoUltimosDias(30))}
            >
              Últimos 30 días
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => onRangoChange(rangoMesAnterior())}
            >
              Mes anterior
            </Button>
          </div>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Estado</p>
          <Select value={estado} onValueChange={onEstadoChange}>
            <SelectTrigger className="h-9 w-full bg-card">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              {CONCILIACION_FILTROS_UI.estados.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Nº Factura</p>
          <Input
            className="h-9 bg-card"
            placeholder={CONCILIACION_FILTROS_UI.facturaPlaceholder}
            value={numeroFactura}
            onChange={(e) => onNumeroFacturaChange(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => void manejarExportar()} disabled={!apiActiva}>
          <Download data-icon="inline-start" />
          Exportar CSV
        </Button>
      </div>
    </div>
  )
}
