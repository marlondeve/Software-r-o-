import {
  ACCIONES_AUDITORIA,
  MODULOS_FILTRO,
  MODULO_LABEL_FILTRO,
} from "@/modules/dietas-cocina/auditoria/lib/auditoriaCatalogo"
import type { ReactNode } from "react"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface AuditoriaFiltrosProps {
  moduloLabel: string
  accionLabel: string
  actorLabel: string
  resultadoLabel: string
  busqueda: string
  modulo: string
  accion: string
  actor: string
  resultado: string
  onBusquedaChange: (value: string) => void
  onModuloChange: (value: string) => void
  onAccionChange: (value: string) => void
  onActorChange: (value: string) => void
  onResultadoChange: (value: string) => void
  onLimpiar: () => void
}

function CampoFiltro({
  id,
  label,
  children,
}: {
  id: string
  label: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  )
}

export function AuditoriaFiltros({
  moduloLabel,
  accionLabel,
  actorLabel,
  resultadoLabel,
  busqueda,
  modulo,
  accion,
  actor,
  resultado,
  onBusquedaChange,
  onModuloChange,
  onAccionChange,
  onActorChange,
  onResultadoChange,
  onLimpiar,
}: AuditoriaFiltrosProps) {
  const accionesOrdenadas = [...ACCIONES_AUDITORIA].sort((a, b) =>
    a.etiqueta.localeCompare(b.etiqueta, "es"),
  )

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">
          Filtros de Búsqueda
        </p>
        <button
          type="button"
          onClick={onLimpiar}
          className="text-xs font-medium text-primary hover:underline"
        >
          Limpiar filtros
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <CampoFiltro id="auditoria-busqueda" label="Búsqueda libre">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="auditoria-busqueda"
              value={busqueda}
              onChange={(event) => onBusquedaChange(event.target.value)}
              placeholder="ID registro, usuario..."
              className="h-9 bg-background pl-9"
            />
          </div>
        </CampoFiltro>

        <CampoFiltro id="auditoria-modulo" label="Módulo">
          <Select value={modulo} onValueChange={onModuloChange}>
            <SelectTrigger id="auditoria-modulo" className="h-9 w-full bg-background">
              <SelectValue placeholder={moduloLabel} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">{moduloLabel}</SelectItem>
              {MODULOS_FILTRO.map((item) => (
                <SelectItem key={item} value={item}>
                  {MODULO_LABEL_FILTRO[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CampoFiltro>

        <CampoFiltro id="auditoria-accion" label="Acción">
          <Select value={accion} onValueChange={onAccionChange}>
            <SelectTrigger id="auditoria-accion" className="h-9 w-full bg-background">
              <SelectValue placeholder={accionLabel} />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="todas">{accionLabel}</SelectItem>
              {accionesOrdenadas.map(({ valor, etiqueta }) => (
                <SelectItem key={valor} value={valor}>
                  {etiqueta}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CampoFiltro>

        <CampoFiltro id="auditoria-actor" label="Actor">
          <Select value={actor} onValueChange={onActorChange}>
            <SelectTrigger id="auditoria-actor" className="h-9 w-full bg-background">
              <SelectValue placeholder={actorLabel} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">{actorLabel}</SelectItem>
              <SelectItem value="usuario">Usuarios</SelectItem>
              <SelectItem value="sistema">Sistema</SelectItem>
            </SelectContent>
          </Select>
        </CampoFiltro>

        <CampoFiltro id="auditoria-resultado" label="Resultado">
          <Select value={resultado} onValueChange={onResultadoChange}>
            <SelectTrigger id="auditoria-resultado" className="h-9 w-full bg-background">
              <SelectValue placeholder={resultadoLabel} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">{resultadoLabel}</SelectItem>
              <SelectItem value="exitoso">Exitoso</SelectItem>
              <SelectItem value="fallido">Fallido</SelectItem>
            </SelectContent>
          </Select>
        </CampoFiltro>
      </div>
    </div>
  )
}
