import { ChevronLeft, ChevronRight, Filter, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { RolModuloDto } from "@/modules/dietas-cocina/types/api-dtos"

interface UsuariosFiltrosProps {
  rolLabel: string
  estadoLabel: string
  busqueda: string
  busquedaPlaceholder: string
  paginaDesde: number
  paginaHasta: number
  total: number
  paginaActual: number
  totalPaginas: number
  rolSeleccionado: string
  estadoSeleccionado: string
  roles: RolModuloDto[]
  onBusquedaChange: (value: string) => void
  onRolChange: (value: string) => void
  onEstadoChange: (value: string) => void
  onCambiarPagina: (pagina: number) => void
}

export function UsuariosFiltros({
  rolLabel,
  estadoLabel,
  busqueda,
  busquedaPlaceholder,
  paginaDesde,
  paginaHasta,
  total,
  paginaActual,
  totalPaginas,
  rolSeleccionado,
  estadoSeleccionado,
  roles,
  onBusquedaChange,
  onRolChange,
  onEstadoChange,
  onCambiarPagina,
}: UsuariosFiltrosProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <Filter className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <div className="relative min-w-48 max-w-sm flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="usuarios-busqueda"
            value={busqueda}
            onChange={(event) => onBusquedaChange(event.target.value)}
            placeholder={busquedaPlaceholder}
            className="h-8 bg-card pl-8"
            aria-label="Buscar usuarios"
          />
        </div>
        <Select value={rolSeleccionado} onValueChange={onRolChange}>
          <SelectTrigger className="h-8 w-auto bg-card">
            <SelectValue placeholder={rolLabel} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">{rolLabel}</SelectItem>
            {roles.map((rol) => (
              <SelectItem key={rol.id} value={rol.id ?? ""}>
                {rol.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={estadoSeleccionado} onValueChange={onEstadoChange}>
          <SelectTrigger className="h-8 w-auto bg-card">
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
          de{" "}
          <span className="font-medium text-foreground">{total}</span>
        </p>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          disabled={paginaActual <= 1}
          onClick={() => onCambiarPagina(paginaActual - 1)}
        >
          <ChevronLeft className="size-4" />
          <span className="sr-only">Página anterior</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          disabled={paginaActual >= totalPaginas}
          onClick={() => onCambiarPagina(paginaActual + 1)}
        >
          <ChevronRight className="size-4" />
          <span className="sr-only">Página siguiente</span>
        </Button>
      </div>
    </div>
  )
}
