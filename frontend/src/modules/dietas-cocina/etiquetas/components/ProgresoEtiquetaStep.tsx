interface ProgresoEtiquetaStepProps {
  paso: number
  total: number
  etiqueta?: string
}

export function ProgresoEtiquetaStep({
  paso,
  total,
  etiqueta = "Paso",
}: ProgresoEtiquetaStepProps) {
  const porcentaje = Math.round((paso / total) * 100)

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          {etiqueta} {paso} de {total}
        </span>
        <span>{porcentaje}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${porcentaje}%` }}
        />
      </div>
    </div>
  )
}
