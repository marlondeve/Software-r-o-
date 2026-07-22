import { CircleAlert } from "lucide-react"

interface ConflictoLogicoAlertProps {
  reglaActual: string
  reglaConflicto: string
}

export function ConflictoLogicoAlert({
  reglaActual,
  reglaConflicto,
}: ConflictoLogicoAlertProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3.5">
      <CircleAlert className="mt-0.5 size-5 shrink-0 text-destructive" />
      <div>
        <p className="font-semibold text-destructive">Conflicto Lógico Detectado</p>
        <p className="mt-1 text-sm text-destructive/90">
          La regla actual (&quot;{reglaActual}&quot;) entra en conflicto directo con la{" "}
          {reglaConflicto}. Las reglas circulares pueden causar errores en la encuesta.
        </p>
      </div>
    </div>
  )
}
