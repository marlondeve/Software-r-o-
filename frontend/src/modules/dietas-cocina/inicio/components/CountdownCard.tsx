import { Clock } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface CountdownCardProps {
  servicio: string
  hora: string
  tiempoRestante: string
  pendientes: number
  accionLabel?: string
  accionTo?: string
}

export function CountdownCard({
  servicio,
  hora,
  tiempoRestante,
  pendientes,
  accionLabel = "Gestionar dietas →",
  accionTo = "/dietas-cocina/dietas",
}: CountdownCardProps) {
  return (
    <Card className="bg-muted/40 py-0 shadow-none">
      <CardContent className="space-y-4 px-4 py-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Próximos cierres
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {servicio}{" "}
            <span className="font-normal text-muted-foreground">({hora})</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Clock className="size-8 shrink-0 text-primary" />
          <span className="text-3xl font-semibold tabular-nums text-foreground">
            {tiempoRestante}
          </span>
        </div>

        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{pendientes}</span>{" "}
          pacientes pendientes de confirmación.
        </p>

        <Button asChild className="w-full">
          <Link to={accionTo}>{accionLabel}</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
