interface ProgresoSeccionProps {
  seccionActual: number
  totalSecciones: number
  titulo: string
}

export function ProgresoSeccion({
  seccionActual,
  totalSecciones,
  titulo,
}: ProgresoSeccionProps) {
  const porcentaje = Math.round((seccionActual / totalSecciones) * 100)

  return (
    <div className="border-b border-border bg-card px-5 py-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-primary">
          Sección {seccionActual} de {totalSecciones}: {titulo}
        </p>
        <p className="text-sm font-medium text-foreground">{porcentaje}%</p>
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
