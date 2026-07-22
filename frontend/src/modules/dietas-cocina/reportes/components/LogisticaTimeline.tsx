import { ArrowRight } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type TendenciaVariant = "positive" | "negative" | "neutral"

interface HitoLogistico {
  etapa: string
  tiempo: string
  tendencia: string
  tendenciaVariant: TendenciaVariant
}

interface LogisticaTimelineProps {
  hitos: HitoLogistico[]
  titulo?: string
}

const tendenciaStyles: Record<TendenciaVariant, string> = {
  positive: "text-emerald-600",
  negative: "text-destructive",
  neutral: "text-muted-foreground",
}

export function LogisticaTimeline({
  hitos,
  titulo = "Tiempos por hito logístico",
}: LogisticaTimelineProps) {
  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardHeader className="border-b py-3">
        <CardTitle className="text-sm font-semibold">{titulo}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {hitos.map((hito, index) => (
            <div key={hito.etapa} className="relative flex items-start gap-2">
              {index < hitos.length - 1 && (
                <ArrowRight className="absolute -right-1 top-2 hidden size-3.5 text-muted-foreground xl:block" />
              )}
              <div className="min-w-0 flex-1 rounded-lg bg-muted/40 px-3 py-2.5">
                <p className="text-xs font-medium text-foreground">{hito.etapa}</p>
                <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                  {hito.tiempo}
                </p>
                <p
                  className={cn(
                    "mt-0.5 text-xs font-medium",
                    tendenciaStyles[hito.tendenciaVariant],
                  )}
                >
                  {hito.tendencia}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
