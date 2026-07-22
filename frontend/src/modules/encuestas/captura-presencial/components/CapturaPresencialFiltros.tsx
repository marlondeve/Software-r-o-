import { Search } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  PABELLONES,
  SERVICIOS_PRESENCIAL,
} from "@/modules/encuestas/captura-presencial/datos/mockCapturaPresencial"

export interface CapturaPresencialFiltrosState {
  busqueda: string
  servicio: string
  pabellon: string
  estado: string
  soloPendientes: boolean
}

interface CapturaPresencialFiltrosProps {
  filtros: CapturaPresencialFiltrosState
  onChange: (filtros: CapturaPresencialFiltrosState) => void
}

export function CapturaPresencialFiltros({
  filtros,
  onChange,
}: CapturaPresencialFiltrosProps) {
  function set<K extends keyof CapturaPresencialFiltrosState>(
    key: K,
    value: CapturaPresencialFiltrosState[K],
  ) {
    onChange({ ...filtros, [key]: value })
  }

  return (
    <Card className="py-0 shadow-none">
      <CardContent className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filtros.busqueda}
            onChange={(event) => set("busqueda", event.target.value)}
            placeholder="Buscar por Nombre o ID (Ej: 100234)"
            className="h-11 bg-card pl-10 text-sm"
          />
        </div>

        <Select value={filtros.servicio} onValueChange={(value) => set("servicio", value)}>
          <SelectTrigger className="h-11 w-full bg-card text-sm lg:w-44">
            <SelectValue placeholder="Todos los Servicios" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los Servicios</SelectItem>
            {SERVICIOS_PRESENCIAL.map((servicio) => (
              <SelectItem key={servicio} value={servicio}>
                {servicio}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filtros.pabellon} onValueChange={(value) => set("pabellon", value)}>
          <SelectTrigger className="h-11 w-full bg-card text-sm lg:w-36">
            <SelectValue placeholder="Pabellón" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Pabellón (Todos)</SelectItem>
            {PABELLONES.map((pabellon) => (
              <SelectItem key={pabellon} value={pabellon}>
                {pabellon}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filtros.estado} onValueChange={(value) => set("estado", value)}>
          <SelectTrigger className="h-11 w-full bg-card text-sm lg:w-40">
            <SelectValue placeholder="Estado: Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Estado: Todos</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="en_proceso">En proceso</SelectItem>
            <SelectItem value="completada">Completada</SelectItem>
            <SelectItem value="no_disponible">No disponible</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex h-11 shrink-0 items-center gap-2.5 lg:pl-2">
          <Switch
            id="captura-pres-solo-pendientes"
            size="default"
            checked={filtros.soloPendientes}
            onCheckedChange={(checked) => set("soloPendientes", checked)}
          />
          <Label
            htmlFor="captura-pres-solo-pendientes"
            className="cursor-pointer text-sm font-normal"
          >
            Solo pendientes
          </Label>
        </div>
      </CardContent>
    </Card>
  )
}
