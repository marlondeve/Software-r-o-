import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  hallazgoVariantEstilos,
  type HallazgoVariant,
} from "@/modules/dietas-cocina/reportes/lib/reportesEstilos"
import { cn } from "@/lib/utils"

interface Hallazgo {
  variant: HallazgoVariant
  titulo: string
  descripcion: string
}

interface HallazgosPanelProps {
  hallazgos: Hallazgo[]
  titulo?: string
}

export function HallazgosPanel({
  hallazgos,
  titulo = "Hallazgos relevantes",
}: HallazgosPanelProps) {
  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardHeader className="border-b py-3">
        <CardTitle className="text-sm font-semibold">{titulo}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-4 py-3">
        {hallazgos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay hallazgos relevantes para el período seleccionado.
          </p>
        ) : (
          hallazgos.map((hallazgo) => {
          const styles = hallazgoVariantEstilos[hallazgo.variant]
          return (
            <div
              key={hallazgo.titulo}
              className={cn(
                "rounded-lg border px-3 py-2.5",
                styles.container,
              )}
            >
              <div className="flex items-start gap-2">
                <span
                  className={cn("mt-1.5 size-2 shrink-0 rounded-full", styles.dot)}
                />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {hallazgo.titulo}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {hallazgo.descripcion}
                  </p>
                </div>
              </div>
            </div>
          )
        })
        )}
      </CardContent>
    </Card>
  )
}
