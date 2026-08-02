import { Button } from "@/components/ui/button"
import { useMemo } from "react"

interface TablaPaginacionProps {
  paginaDesde: number
  paginaHasta: number
  total: number
  paginaActual: number
  totalPaginas: number
  onCambiarPagina: (pagina: number) => void
}

export function TablaPaginacion({
  paginaDesde,
  paginaHasta,
  total,
  paginaActual,
  totalPaginas,
  onCambiarPagina,
}: TablaPaginacionProps) {
  const paginasVisibles = useMemo(() => {
    const paginas: number[] = []
    const maxVisibles = 5
    let inicio = Math.max(1, paginaActual - Math.floor(maxVisibles / 2))
    const fin = Math.min(totalPaginas, inicio + maxVisibles - 1)
    inicio = Math.max(1, fin - maxVisibles + 1)
    for (let i = inicio; i <= fin; i++) paginas.push(i)
    return paginas
  }, [paginaActual, totalPaginas])

  if (total === 0) return null

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
      <p className="text-xs text-muted-foreground">
        Mostrando{" "}
        <span className="font-medium text-foreground">
          {paginaDesde}-{paginaHasta}
        </span>{" "}
        de{" "}
        <span className="font-medium text-foreground">
          {total.toLocaleString("es-CO")}
        </span>{" "}
        registros
      </p>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          disabled={paginaActual <= 1}
          onClick={() => onCambiarPagina(paginaActual - 1)}
        >
          ‹
        </Button>
        {paginasVisibles.map((numero) => (
          <Button
            key={numero}
            type="button"
            variant={numero === paginaActual ? "default" : "outline"}
            size="icon-sm"
            onClick={() => onCambiarPagina(numero)}
          >
            {numero}
          </Button>
        ))}
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          disabled={paginaActual >= totalPaginas}
          onClick={() => onCambiarPagina(paginaActual + 1)}
        >
          ›
        </Button>
      </div>
    </div>
  )
}
