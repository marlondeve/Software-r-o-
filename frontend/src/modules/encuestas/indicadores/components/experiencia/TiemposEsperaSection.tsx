import { BarChart3, CircleCheck, TriangleAlert } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"

interface TiemposEsperaSectionProps {
  medianaMinutos: number
  atendidosBajo30: number
  atendidosSobre30: number
}

export function TiemposEsperaSection({
  medianaMinutos,
  atendidosBajo30,
  atendidosSobre30,
}: TiemposEsperaSectionProps) {
  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="space-y-4 px-4 py-4">
        <h2 className="text-lg font-semibold text-foreground">
          Tiempos de Espera (Oportunidad)
        </h2>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
          <div className="space-y-3">
            <div className="rounded-lg border border-border px-4 py-3">
              <p className="text-sm text-muted-foreground">Mediana de espera</p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {medianaMinutos} minutos
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div>
                <p className="text-sm text-muted-foreground">Atendidos &lt; 30min</p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {atendidosBajo30}%
                </p>
              </div>
              <CircleCheck className="size-6 text-primary" />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div>
                <p className="text-sm text-muted-foreground">Atendidos &gt; 30min</p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {atendidosSobre30}%
                </p>
              </div>
              <TriangleAlert className="size-6 text-destructive" />
            </div>
          </div>

          <div className="flex min-h-56 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-center">
            <BarChart3 className="size-8 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">
              Gráfico comparativo por servicio detallado
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
