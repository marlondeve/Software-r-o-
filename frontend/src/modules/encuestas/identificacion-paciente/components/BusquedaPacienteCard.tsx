import { IdCard, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
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
import { TIPOS_DOCUMENTO } from "@/modules/encuestas/identificacion-paciente/datos/mockIdentificacionPaciente"

export interface BusquedaPacienteState {
  tipoDocumento: string
  numeroDocumento: string
}

interface BusquedaPacienteCardProps {
  busqueda: BusquedaPacienteState
  onChange: (busqueda: BusquedaPacienteState) => void
  onBuscar: () => void
  buscando: boolean
}

export function BusquedaPacienteCard({
  busqueda,
  onChange,
  onBuscar,
  buscando,
}: BusquedaPacienteCardProps) {
  function set<K extends keyof BusquedaPacienteState>(
    key: K,
    value: BusquedaPacienteState[K],
  ) {
    onChange({ ...busqueda, [key]: value })
  }

  return (
    <Card className="gap-5 py-5 shadow-none">
      <CardContent className="space-y-5">
        <h2 className="text-lg font-semibold text-foreground">Búsqueda en Sistema</h2>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Tipo de Documento
          </Label>
          <Select
            value={busqueda.tipoDocumento}
            onValueChange={(value) => set("tipoDocumento", value)}
          >
            <SelectTrigger className="h-11 w-full bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_DOCUMENTO.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>
                  {tipo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Número de Documento
          </Label>
          <div className="relative">
            <IdCard className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busqueda.numeroDocumento}
              onChange={(event) => set("numeroDocumento", event.target.value)}
              placeholder="Ej. 1023456789"
              className="h-11 bg-card pl-10"
            />
          </div>
        </div>

        <Button
          type="button"
          className="h-11 w-full"
          onClick={onBuscar}
          disabled={buscando}
        >
          <Search data-icon="inline-start" />
          {buscando ? "Buscando..." : "Buscar Paciente"}
        </Button>

        <div className="flex items-center justify-between border-t border-border pt-4 text-sm">
          <span className="text-muted-foreground">Buscando en base Hosvital</span>
          <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
            <span className="size-2 rounded-full bg-emerald-500" />
            Conectado
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
