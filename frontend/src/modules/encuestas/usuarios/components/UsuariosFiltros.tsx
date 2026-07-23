import { ChevronLeft, ChevronRight, Filter } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ROLES_ENCUESTAS_MODULO } from "@/modules/encuestas/lib/roles"

interface UsuariosFiltrosProps {
  rolLabel: string
  estadoLabel: string
  paginaDesde: number
  paginaHasta: number
  total: number
  rolSeleccionado: string
  estadoSeleccionado: string
  onRolChange: (value: string) => void
  onEstadoChange: (value: string) => void
}

export function UsuariosFiltros({
  rolLabel,
  estadoLabel,
  paginaDesde,
  paginaHasta,
  total,
  rolSeleccionado,
  estadoSeleccionado,
  onRolChange,
  onEstadoChange,
}: UsuariosFiltrosProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="size-4 text-muted-foreground" aria-hidden />
        <Select value={rolSeleccionado} onValueChange={onRolChange}>
          <SelectTrigger className="h-10 w-auto bg-card">
            <SelectValue placeholder={rolLabel} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">{rolLabel}</SelectItem>
            {ROLES_ENCUESTAS_MODULO.map((rol) => (
              <SelectItem key={rol} value={rol}>
                {rol}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={estadoSeleccionado} onValueChange={onEstadoChange}>
          <SelectTrigger className="h-10 w-auto bg-card">
            <SelectValue placeholder={estadoLabel} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">{estadoLabel}</SelectItem>
            <SelectItem value="activo">Activo</SelectItem>
            <SelectItem value="inactivo">Inactivo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <p className="text-xs whitespace-nowrap text-muted-foreground">
          Mostrando{" "}
          <span className="font-medium text-foreground">
            {paginaDesde}-{paginaHasta}
          </span>{" "}
          de <span className="font-medium text-foreground">{total}</span>
        </p>
        <Button type="button" variant="outline" size="icon" className="size-10" disabled>
          <ChevronLeft className="size-4" />
          <span className="sr-only">Página anterior</span>
        </Button>
        <Button type="button" variant="outline" size="icon" className="size-10" disabled>
          <ChevronRight className="size-4" />
          <span className="sr-only">Página siguiente</span>
        </Button>
      </div>
    </div>
  )
}
