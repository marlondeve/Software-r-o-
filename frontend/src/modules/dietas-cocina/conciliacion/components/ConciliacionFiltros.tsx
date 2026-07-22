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

interface ConciliacionFiltrosProps {
  periodo: string
  proveedor: string
  facturaPlaceholder: string
}

export function ConciliacionFiltros({
  periodo,
  proveedor,
  facturaPlaceholder,
}: ConciliacionFiltrosProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Periodo</p>
          <Select defaultValue="periodo">
            <SelectTrigger className="h-9 w-full bg-card">
              <SelectValue placeholder={periodo} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="periodo">{periodo}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Proveedor</p>
          <Select defaultValue="proveedor">
            <SelectTrigger className="h-9 w-full bg-card">
              <SelectValue placeholder={proveedor} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="proveedor">{proveedor}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
          <p className="text-xs font-medium text-muted-foreground">Nº Factura</p>
          <Input
            className="h-9 bg-card"
            placeholder={facturaPlaceholder}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm">
          <Download data-icon="inline-start" />
          Exportar
        </Button>
        <Button size="sm">
          <FileUp data-icon="inline-start" />
          Cargar Factura
        </Button>
      </div>
    </div>
  )
}
