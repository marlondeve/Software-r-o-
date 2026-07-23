import { Card, CardContent } from "@/components/ui/card"
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
import {
  ENCUESTADORES,
  EPS_ENTIDADES,
  ESTADOS,
  PUNTOS_ATENCION,
  SERVICIOS,
} from "@/modules/encuestas/encuestas-realizadas/datos/mockEncuestasRealizadas"

export interface FiltrosAvanzadosState {
  consecutivo: string
  paciente: string
  entidad: string
  servicio: string
  puntoAtencion: string
  encuestador: string
  estado: string
  satRec: string
  soloRespuestaNegativa: boolean
}

interface FiltrosAvanzadosProps {
  filtros: FiltrosAvanzadosState
  onChange: (filtros: FiltrosAvanzadosState) => void
  onLimpiar: () => void
}

export function FiltrosAvanzados({
  filtros,
  onChange,
  onLimpiar,
}: FiltrosAvanzadosProps) {
  function set<K extends keyof FiltrosAvanzadosState>(
    key: K,
    value: FiltrosAvanzadosState[K],
  ) {
    onChange({ ...filtros, [key]: value })
  }

  return (
    <Card className="gap-3 py-4 shadow-none">
      <CardContent className="space-y-3 px-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Filtros avanzados
          </p>
          <button
            type="button"
            onClick={onLimpiar}
            className="text-sm font-medium text-primary hover:underline"
          >
            Limpiar filtros
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Input
            value={filtros.consecutivo}
            onChange={(event) => set("consecutivo", event.target.value)}
            placeholder="Consecutivo"
            className="h-9 bg-card"
          />
          <Input
            value={filtros.paciente}
            onChange={(event) => set("paciente", event.target.value)}
            placeholder="Paciente (Nombre/ID)"
            className="h-9 bg-card"
          />

          <Select value={filtros.entidad} onValueChange={(value) => set("entidad", value)}>
            <SelectTrigger className="h-9 w-full bg-card">
              <SelectValue placeholder="EPS / Entidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">EPS / Entidad</SelectItem>
              {EPS_ENTIDADES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filtros.servicio} onValueChange={(value) => set("servicio", value)}>
            <SelectTrigger className="h-9 w-full bg-card">
              <SelectValue placeholder="Servicio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Servicio</SelectItem>
              {SERVICIOS.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filtros.puntoAtencion}
            onValueChange={(value) => set("puntoAtencion", value)}
          >
            <SelectTrigger className="h-9 w-full bg-card">
              <SelectValue placeholder="Punto de atención" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Punto de atención</SelectItem>
              {PUNTOS_ATENCION.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filtros.encuestador}
            onValueChange={(value) => set("encuestador", value)}
          >
            <SelectTrigger className="h-9 w-full bg-card">
              <SelectValue placeholder="Encuestador" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Encuestador</SelectItem>
              {ENCUESTADORES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filtros.estado} onValueChange={(value) => set("estado", value)}>
            <SelectTrigger className="h-9 w-full bg-card">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Estado</SelectItem>
              {ESTADOS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filtros.satRec} onValueChange={(value) => set("satRec", value)}>
            <SelectTrigger className="h-9 w-full bg-card lg:col-span-2">
              <SelectValue placeholder="Sat/Rec: Cualquier valor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cualquiera">Sat/Rec: Cualquier valor</SelectItem>
              <SelectItem value="bajo">Sat/Rec: Bajo (0-5)</SelectItem>
              <SelectItem value="medio">Sat/Rec: Medio (6-7)</SelectItem>
              <SelectItem value="alto">Sat/Rec: Alto (8-10)</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center justify-end gap-2 lg:col-span-1">
            <Checkbox
              id="encuestas-realizadas-respuesta-negativa"
              checked={filtros.soloRespuestaNegativa}
              onCheckedChange={(checked) =>
                set("soloRespuestaNegativa", checked === true)
              }
            />
            <Label
              htmlFor="encuestas-realizadas-respuesta-negativa"
              className="cursor-pointer font-normal whitespace-nowrap"
            >
              Respuesta Negativa
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
