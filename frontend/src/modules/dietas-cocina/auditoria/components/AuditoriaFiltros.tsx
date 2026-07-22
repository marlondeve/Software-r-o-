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
import type { ModuloAuditoria } from "@/modules/dietas-cocina/auditoria/datos/mockAuditoria"
import { MODULO_LABEL } from "@/modules/dietas-cocina/auditoria/lib/auditoriaEstilos"

interface AuditoriaFiltrosProps {
  moduloLabel: string
  accionLabel: string
  rolLabel: string
  resultadoLabel: string
  busqueda: string
  modulo: string
  accion: string
  rol: string
  resultado: string
  onBusquedaChange: (value: string) => void
  onModuloChange: (value: string) => void
  onAccionChange: (value: string) => void
  onRolChange: (value: string) => void
  onResultadoChange: (value: string) => void
  onLimpiar: () => void
}

const MODULOS: ModuloAuditoria[] = [
  "dietas",
  "cocina",
  "etiquetas",
  "reportes",
  "conciliacion",
  "parametros",
  "usuarios",
  "inicio",
]

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
  rolLabel,
  resultadoLabel,
  busqueda,
  modulo,
  accion,
  rol,
  resultado,
  onBusquedaChange,
  onModuloChange,
  onAccionChange,
  onRolChange,
  onResultadoChange,
  onLimpiar,
}: AuditoriaFiltrosProps) {
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
              {MODULOS.map((item) => (
                <SelectItem key={item} value={item}>
                  {MODULO_LABEL[item]}
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
            <SelectContent>
              <SelectItem value="todas">{accionLabel}</SelectItem>
              <SelectItem value="editar">Editar</SelectItem>
              <SelectItem value="confirmar">Confirmar</SelectItem>
              <SelectItem value="generar">Generar</SelectItem>
              <SelectItem value="desactivar">Desactivar</SelectItem>
              <SelectItem value="conciliar">Conciliar</SelectItem>
            </SelectContent>
          </Select>
        </CampoFiltro>

        <CampoFiltro id="auditoria-rol" label="Rol de usuario">
          <Select value={rol} onValueChange={onRolChange}>
            <SelectTrigger id="auditoria-rol" className="h-9 w-full bg-background">
              <SelectValue placeholder={rolLabel} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">{rolLabel}</SelectItem>
              <SelectItem value="Nutricionista">Nutricionista</SelectItem>
              <SelectItem value="Administrador">Administrador</SelectItem>
              <SelectItem value="Proveedor">Proveedor</SelectItem>
              <SelectItem value="Enfermera">Enfermera</SelectItem>
              <SelectItem value="Sistema">Sistema</SelectItem>
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
