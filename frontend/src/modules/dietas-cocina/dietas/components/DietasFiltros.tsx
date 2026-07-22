import { Search } from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ESTADO_FILTRO_LABEL } from "@/modules/dietas-cocina/dietas/lib/dietasEstilos"

interface DietasFiltrosProps {
  busqueda: string
  servicio: string
  estado: string
  soloPendientes: boolean
  servicios: string[]
  onBusquedaChange: (value: string) => void
  onServicioChange: (value: string) => void
  onEstadoChange: (value: string) => void
  onSoloPendientesChange: (value: boolean) => void
  onLimpiar: () => void
}

export function DietasFiltros({
  busqueda,
  servicio,
  estado,
  soloPendientes,
  servicios,
  onBusquedaChange,
  onServicioChange,
  onEstadoChange,
  onSoloPendientesChange,
  onLimpiar,
}: DietasFiltrosProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
          <Label
            htmlFor="dietas-busqueda"
            className="text-xs font-medium text-muted-foreground"
          >
            Búsqueda
          </Label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="dietas-busqueda"
              value={busqueda}
              onChange={(event) => onBusquedaChange(event.target.value)}
              placeholder="Buscar por paciente o ID..."
              className="h-9 bg-card pl-9"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="dietas-servicio"
            className="text-xs font-medium text-muted-foreground"
          >
            Servicio
          </Label>
          <Select value={servicio} onValueChange={onServicioChange}>
            <SelectTrigger id="dietas-servicio" className="h-9 w-full bg-card">
              <SelectValue placeholder="Servicio (Todos)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Servicio (Todos)</SelectItem>
              {servicios.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="dietas-estado"
            className="text-xs font-medium text-muted-foreground"
          >
            Estado
          </Label>
          <Select value={estado} onValueChange={onEstadoChange}>
            <SelectTrigger id="dietas-estado" className="h-9 w-full bg-card">
              <SelectValue placeholder="Estado (Todos)" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ESTADO_FILTRO_LABEL).map(([valor, etiqueta]) => (
                <SelectItem key={valor} value={valor}>
                  {valor === "todos" ? "Estado (Todos)" : etiqueta}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end pb-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="dietas-pendientes"
              checked={soloPendientes}
              onCheckedChange={(checked) =>
                onSoloPendientesChange(checked === true)
              }
            />
            <Label
              htmlFor="dietas-pendientes"
              className="cursor-pointer text-sm font-normal"
            >
              Solo pendientes
            </Label>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onLimpiar}
        className="shrink-0 self-end text-xs font-medium text-primary hover:underline"
      >
        Limpiar filtros
      </button>
    </div>
  )
}
