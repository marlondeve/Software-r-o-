import { useMemo, useState } from "react"
import { Download, FileUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { descargarArchivoDemo, demoToast } from "@/modules/dietas-cocina/lib/demoFeedback"

interface ConciliacionFiltrosProps {
  periodo: string
  proveedor: string
  facturaPlaceholder: string
  periodoSeleccionado: string
  proveedorSeleccionado: string
  numeroFactura: string
  onPeriodoChange: (value: string) => void
  onProveedorChange: (value: string) => void
  onNumeroFacturaChange: (value: string) => void
}

export function ConciliacionFiltros({
  periodo,
  proveedor,
  facturaPlaceholder,
  periodoSeleccionado,
  proveedorSeleccionado,
  numeroFactura,
  onPeriodoChange,
  onProveedorChange,
  onNumeroFacturaChange,
}: ConciliacionFiltrosProps) {
  function exportar() {
    descargarArchivoDemo(
      "Conciliación demo — exportación\n",
      "conciliacion-dietas-cocina.txt",
    )
  }

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Periodo</p>
          <Select value={periodoSeleccionado} onValueChange={onPeriodoChange}>
            <SelectTrigger className="h-9 w-full bg-card">
              <SelectValue placeholder={periodo} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="periodo">{periodo}</SelectItem>
              <SelectItem value="mes-anterior">Mes anterior</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Proveedor</p>
          <Select value={proveedorSeleccionado} onValueChange={onProveedorChange}>
            <SelectTrigger className="h-9 w-full bg-card">
              <SelectValue placeholder={proveedor} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="proveedor">{proveedor}</SelectItem>
              <SelectItem value="otro">Otro proveedor (demo)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
          <p className="text-xs font-medium text-muted-foreground">Nº Factura</p>
          <Input
            className="h-9 bg-card"
            placeholder={facturaPlaceholder}
            value={numeroFactura}
            onChange={(e) => onNumeroFacturaChange(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={exportar}>
          <Download data-icon="inline-start" />
          Exportar
        </Button>
        <Button size="sm" onClick={() => demoToast("Factura cargada (demo).")}>
          <FileUp data-icon="inline-start" />
          Cargar Factura
        </Button>
      </div>
    </div>
  )
}
