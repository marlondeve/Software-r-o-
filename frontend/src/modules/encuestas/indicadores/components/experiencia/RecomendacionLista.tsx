import type { SegmentoBarra } from "@/modules/encuestas/indicadores/datos/mockIndicadoresExperiencia"

export function RecomendacionLista({ segmentos }: { segmentos: SegmentoBarra[] }) {
  return (
    <ul className="space-y-4">
      {segmentos.map((segmento) => (
        <li key={segmento.label} className="flex items-center gap-3">
          <span className="w-32 shrink-0 text-sm text-foreground">{segmento.label}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{ width: `${segmento.value}%`, backgroundColor: segmento.color }}
            />
          </div>
          <span className="w-10 shrink-0 text-right text-sm font-medium tabular-nums text-foreground">
            {segmento.value}%
          </span>
        </li>
      ))}
    </ul>
  )
}
