import { CalendarDays } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CANALES_EXPERIENCIA,
  CONTRATOS_EXPERIENCIA,
  EPS_EXPERIENCIA,
  PUNTOS_ATENCION_EXPERIENCIA,
  RANGOS_FECHA,
  SERVICIOS_EXPERIENCIA,
} from "@/modules/encuestas/indicadores/datos/mockIndicadoresExperiencia"

export interface FiltrosExperienciaState {
  rangoFechas: string
  servicio: string
  puntoAtencion: string
  eps: string
  contrato: string
  canal: string
}

interface FiltrosExperienciaProps {
  filtros: FiltrosExperienciaState
  onChange: (filtros: FiltrosExperienciaState) => void
}

export function FiltrosExperiencia({ filtros, onChange }: FiltrosExperienciaProps) {
  function set<K extends keyof FiltrosExperienciaState>(
    key: K,
    value: FiltrosExperienciaState[K],
  ) {
    onChange({ ...filtros, [key]: value })
  }

  return (
    <Card className="py-0 shadow-none">
      <CardContent className="grid gap-4 px-4 py-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-foreground">Rango de fechas</Label>
          <Select value={filtros.rangoFechas} onValueChange={(v) => set("rangoFechas", v)}>
            <SelectTrigger className="h-11 w-full bg-card">
              <CalendarDays className="size-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGOS_FECHA.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-foreground">Servicio</Label>
          <Select value={filtros.servicio} onValueChange={(v) => set("servicio", v)}>
            <SelectTrigger className="h-11 w-full bg-card">
              <SelectValue placeholder="Todos los servicios" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los servicios</SelectItem>
              {SERVICIOS_EXPERIENCIA.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-foreground">Punto de atención</Label>
          <Select value={filtros.puntoAtencion} onValueChange={(v) => set("puntoAtencion", v)}>
            <SelectTrigger className="h-11 w-full bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PUNTOS_ATENCION_EXPERIENCIA.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-foreground">EPS</Label>
          <Select value={filtros.eps} onValueChange={(v) => set("eps", v)}>
            <SelectTrigger className="h-11 w-full bg-card">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {EPS_EXPERIENCIA.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-foreground">Contrato</Label>
          <Select value={filtros.contrato} onValueChange={(v) => set("contrato", v)}>
            <SelectTrigger className="h-11 w-full bg-card">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {CONTRATOS_EXPERIENCIA.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-foreground">Canal</Label>
          <Select value={filtros.canal} onValueChange={(v) => set("canal", v)}>
            <SelectTrigger className="h-11 w-full bg-card">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {CANALES_EXPERIENCIA.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
