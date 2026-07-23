import { Search } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CANALES_CUESTIONARIO,
  ESTADOS_CUESTIONARIO,
} from "@/modules/encuestas/cuestionarios/datos/mockCuestionarios"

export interface CuestionariosFiltrosState {
  busqueda: string
  canal: string
  estado: string
}

interface CuestionariosFiltrosProps {
  filtros: CuestionariosFiltrosState
  onChange: (filtros: CuestionariosFiltrosState) => void
}

export function CuestionariosFiltros({ filtros, onChange }: CuestionariosFiltrosProps) {
  function set<K extends keyof CuestionariosFiltrosState>(
    key: K,
    value: CuestionariosFiltrosState[K],
  ) {
    onChange({ ...filtros, [key]: value })
  }

  return (
    <Card className="py-0 shadow-none">
      <CardContent className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filtros.busqueda}
            onChange={(event) => set("busqueda", event.target.value)}
            placeholder="Buscar cuestionario..."
            className="h-9 bg-card pl-9"
          />
        </div>

        <Select value={filtros.canal} onValueChange={(value) => set("canal", value)}>
          <SelectTrigger className="h-9 w-full bg-card sm:w-44">
            <SelectValue placeholder="Canal (Todos)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Canal (Todos)</SelectItem>
            {CANALES_CUESTIONARIO.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filtros.estado} onValueChange={(value) => set("estado", value)}>
          <SelectTrigger className="h-9 w-full bg-card sm:w-40">
            <SelectValue placeholder="Estado (Todos)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Estado (Todos)</SelectItem>
            {ESTADOS_CUESTIONARIO.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  )
}
