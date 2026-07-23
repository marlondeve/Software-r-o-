import { Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
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
  labelEstadoCocina,
} from "@/modules/dietas-cocina/cocina/lib/cocinaEstilos"
import type { FiltrosCocina } from "@/modules/dietas-cocina/cocina/lib/cocinaFiltros"
import type { FiltroSeguimientoCocina } from "@/modules/dietas-cocina/cocina/lib/cocinaLogistica"
import type { EstadoCocina } from "@/modules/dietas-cocina/cocina/datos/mockCocina"

interface CocinaFiltrosBarProps {
  filtros: FiltrosCocina
  pabellones: string[]
  habitaciones: string[]
  tiposDieta: string[]
  consistencias: string[]
  estadosCocina: string[]
  onChange: (filtros: FiltrosCocina) => void
  onLimpiar: () => void
}

const ESTADOS_FILTRO: EstadoCocina[] = [
  "por_iniciar",
  "en_preparacion",
  "lista",
  "despachada",
]

const SEGUIMIENTO_FILTRO: { value: FiltroSeguimientoCocina; label: string }[] = [
  { value: "Todos", label: "Todos" },
  { value: "en_transito", label: "En tránsito" },
  { value: "pre_entregada", label: "Pre-entregadas" },
  { value: "entregada", label: "Entregadas" },
  { value: "devuelta", label: "Devueltas" },
]

export function CocinaFiltrosBar({
  filtros,
  pabellones,
  habitaciones,
  tiposDieta,
  consistencias,
  estadosCocina,
  onChange,
  onLimpiar,
}: CocinaFiltrosBarProps) {
  function actualizar(partial: Partial<FiltrosCocina>) {
    onChange({ ...filtros, ...partial })
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-35 flex-1 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Pabellón</Label>
          <Select
            value={filtros.pabellon}
            onValueChange={(v) => actualizar({ pabellon: v })}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pabellones.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-30 flex-1 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Habitación</Label>
          <Select
            value={filtros.habitacion}
            onValueChange={(v) => actualizar({ habitacion: v })}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {habitaciones.map((h) => (
                <SelectItem key={h} value={h}>
                  {h}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-35 flex-1 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Tipo dieta</Label>
          <Select
            value={filtros.tipoDieta}
            onValueChange={(v) => actualizar({ tipoDieta: v })}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tiposDieta.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-30 flex-1 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Consistencia</Label>
          <Select
            value={filtros.consistencia}
            onValueChange={(v) => actualizar({ consistencia: v })}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {consistencias.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-32.5 flex-1 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Estado cocina</Label>
          <Select
            value={filtros.estadoCocina}
            onValueChange={(v) => actualizar({ estadoCocina: v })}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {estadosCocina.map((e) => (
                <SelectItem key={e} value={e}>
                  {e === "Todos"
                    ? "Todos"
                    : labelEstadoCocina(e as EstadoCocina)}
                </SelectItem>
              ))}
              {ESTADOS_FILTRO.filter(
                (e) => !estadosCocina.includes(e),
              ).map((e) => (
                <SelectItem key={e} value={e}>
                  {labelEstadoCocina(e)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-37.5 flex-1 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Seguimiento</Label>
          <Select
            value={filtros.seguimiento}
            onValueChange={(v) =>
              actualizar({ seguimiento: v as FiltroSeguimientoCocina })
            }
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SEGUIMIENTO_FILTRO.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-45 flex-2 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Buscar</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-9 pl-9"
              placeholder="Paciente o ID..."
              value={filtros.busqueda}
              onChange={(e) => actualizar({ busqueda: e.target.value })}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pb-0.5">
          <Checkbox
            id="solo-aislados"
            checked={filtros.soloAislados}
            onCheckedChange={(checked) =>
              actualizar({ soloAislados: checked === true })
            }
          />
          <Label htmlFor="solo-aislados" className="text-sm font-normal">
            Solo aislados
          </Label>
        </div>

        <Button type="button" variant="ghost" size="sm" onClick={onLimpiar}>
          <X data-icon="inline-start" />
          Limpiar
        </Button>
      </div>
    </div>
  )
}
