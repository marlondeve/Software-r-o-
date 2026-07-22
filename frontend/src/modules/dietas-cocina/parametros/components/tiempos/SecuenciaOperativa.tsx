import type { ParametrosTiempoComida } from "@/modules/dietas-cocina/parametros/datos/mockTiempos"
import {
  formatearHora12,
  formatearRangoHora12,
} from "@/modules/dietas-cocina/parametros/lib/formatoHora"

interface SecuenciaOperativaProps {
  comida: ParametrosTiempoComida
}

export function SecuenciaOperativa({ comida }: SecuenciaOperativaProps) {
  const indiceVentanaFin = comida.hitos.findIndex(
    (hito) => hito.id === "novedades",
  )
  const porcentajeVentana =
    comida.hitos.length > 1
      ? ((indiceVentanaFin + 1) / comida.hitos.length) * 100
      : 30

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className="relative pt-6 pb-2">
        <div className="absolute top-8 right-0 left-0 h-1 rounded-full bg-border" />
        <div
          className="absolute top-8 left-0 h-1 rounded-full bg-destructive/30"
          style={{ width: `${porcentajeVentana}%` }}
        />
        <div className="relative flex justify-between gap-2">
          {comida.hitos.map((hito) => (
            <div
              key={hito.id}
              className="flex min-w-0 flex-1 flex-col items-center gap-1 text-center"
            >
              <span className="size-2.5 rounded-full bg-primary ring-2 ring-background" />
              <span className="text-[10px] font-medium text-muted-foreground">
                {formatearHora12(hito.hora)}
              </span>
              <span className="hidden text-[10px] text-muted-foreground sm:block">
                {hito.label.split(" ").slice(0, 2).join(" ")}
              </span>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-destructive">
        {comida.ventanaCambios.label} (
        {formatearRangoHora12(
          comida.ventanaCambios.inicio,
          comida.ventanaCambios.fin,
        )}
        )
      </p>
    </div>
  )
}
