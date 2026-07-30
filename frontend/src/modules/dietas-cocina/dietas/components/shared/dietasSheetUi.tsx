import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"
import type { ReactNode } from "react"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { EstadoBadge } from "@/modules/dietas-cocina/inicio/components/EstadoBadge"
import { obtenerLineasContextoPaciente } from "@/modules/dietas-cocina/dietas/lib/solicitudDieta"

export function SeccionTitulo({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
      {children}
    </p>
  )
}

interface ContextoPacienteCardProps {
  fila: FilaDieta
}

export function ContextoPacienteCard({ fila }: ContextoPacienteCardProps) {
  const { identificacion, ubicacion, ingreso } = obtenerLineasContextoPaciente(fila)

  return (
    <section className="rounded-xl border border-border bg-muted/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <SeccionTitulo>Contexto del paciente</SeccionTitulo>
        <EstadoBadge
          estado={fila.estado}
          className="shrink-0 font-semibold uppercase tracking-wide"
        />
      </div>
      <div className="mt-3 space-y-2">
        <p className="font-semibold text-foreground">{fila.paciente}</p>
        <dl className="space-y-1 text-sm text-muted-foreground">
          <div className="flex gap-2">
            <dt className="shrink-0 font-medium text-foreground/70">Documento</dt>
            <dd>{identificacion}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="shrink-0 font-medium text-foreground/70">Ubicación</dt>
            <dd>{ubicacion}</dd>
          </div>
          {ingreso && (
            <div className="flex gap-2">
              <dt className="shrink-0 font-medium text-foreground/70">Ingreso</dt>
              <dd>{ingreso}</dd>
            </div>
          )}
        </dl>
      </div>
    </section>
  )
}

interface CondicionExpandibleProps {
  id: string
  icon: ReactNode
  label: string
  activo: boolean
  observacion: string
  placeholder?: string
  disabled?: boolean
  onActivoChange: (activo: boolean) => void
  onObservacionChange: (value: string) => void
}

export function CondicionExpandible({
  id,
  icon,
  label,
  activo,
  observacion,
  placeholder = "Describa observación...",
  disabled,
  onActivoChange,
  onObservacionChange,
}: CondicionExpandibleProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {icon}
          <Label htmlFor={id} className="font-medium">
            {label}
          </Label>
        </div>
        <Switch
          id={id}
          checked={activo}
          onCheckedChange={onActivoChange}
          disabled={disabled}
          className="data-[state=checked]:bg-lime-500"
        />
      </div>
      {activo && (
        <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
          <Label
            htmlFor={`${id}-observacion`}
            className="mb-2 block text-sm font-semibold text-foreground"
          >
            Observación
            <span className="ml-1 text-destructive">*</span>
          </Label>
          <Textarea
            id={`${id}-observacion`}
            value={observacion}
            onChange={(event) => onObservacionChange(event.target.value)}
            placeholder={placeholder}
            className="min-h-20 bg-background shadow-none"
            disabled={disabled}
            required
            aria-required="true"
          />
        </div>
      )}
    </div>
  )
}
