import { ListFilter, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DatePickerFromString } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  PUNTOS_ATENCION,
  SERVICIOS,
} from "@/modules/encuestas/captura-telefonica/datos/mockCapturaTelefonica"

export interface CapturaTelefonicaFiltrosState {
  busqueda: string
  puntoAtencion: string
  servicio: string
  estado: string
  fechaCita: string
}

interface CapturaTelefonicaFiltrosProps {
  filtros: CapturaTelefonicaFiltrosState
  onChange: (filtros: CapturaTelefonicaFiltrosState) => void
  onLimpiar: () => void
}

export function CapturaTelefonicaFiltros({
  filtros,
  onChange,
  onLimpiar,
}: CapturaTelefonicaFiltrosProps) {
  function set<K extends keyof CapturaTelefonicaFiltrosState>(
    key: K,
    value: CapturaTelefonicaFiltrosState[K],
  ) {
    onChange({ ...filtros, [key]: value })
  }

  return (
    <Card className="gap-3 py-4 shadow-none">
      <CardHeader className="px-4">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <ListFilter className="size-4" />
          Filtros de Lista
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="space-y-1.5">
            <Label
              htmlFor="captura-tel-busqueda"
              className="text-xs font-medium text-muted-foreground uppercase"
            >
              Buscar
            </Label>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="captura-tel-busqueda"
                value={filtros.busqueda}
                onChange={(event) => set("busqueda", event.target.value)}
                placeholder="Nombre, ID, Tel..."
                className="h-9 bg-card pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase">
              Punto Atención
            </Label>
            <Select
              value={filtros.puntoAtencion}
              onValueChange={(value) => set("puntoAtencion", value)}
            >
              <SelectTrigger className="h-9 w-full bg-card">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {PUNTOS_ATENCION.map((punto) => (
                  <SelectItem key={punto} value={punto}>
                    {punto}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase">
              Servicio
            </Label>
            <Select
              value={filtros.servicio}
              onValueChange={(value) => set("servicio", value)}
            >
              <SelectTrigger className="h-9 w-full bg-card">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {SERVICIOS.map((servicio) => (
                  <SelectItem key={servicio} value={servicio}>
                    {servicio}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase">
              Estado
            </Label>
            <Select
              value={filtros.estado}
              onValueChange={(value) => set("estado", value)}
            >
              <SelectTrigger className="h-9 w-full bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendiente">Pendiente (0 intentos)</SelectItem>
                <SelectItem value="reintento">Reintento pendiente</SelectItem>
                <SelectItem value="no_contesta">No contesta</SelectItem>
                <SelectItem value="rechazo">Rechazo</SelectItem>
                <SelectItem value="completada">Completada</SelectItem>
                <SelectItem value="todos">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase">
              Fecha Cita
            </Label>
            <DatePickerFromString
              value={filtros.fechaCita}
              onChange={(value) => set("fechaCita", value)}
              placeholder="mm/dd/yyyy"
              className="h-9 bg-card"
            />
          </div>

          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full text-sm"
              onClick={onLimpiar}
            >
              Limpiar Filtros
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
