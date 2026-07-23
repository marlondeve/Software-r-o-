import {
  BedDouble,
  ChartPie,
  CircleCheck,
  ClipboardClock,
  Users,
  XCircle,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface CapturaPresencialKpis {
  pacientesActivos: number
  encuestasCompletadas: number
  pendientes: number
  noDisponibles: number
  rechazadas: number
  coberturaTurno: number
}

function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string
  value: number
  icon: LucideIcon
  tone?: "default" | "primary" | "destructive"
}) {
  return (
    <Card className="py-0 shadow-none">
      <CardContent className="flex items-start justify-between gap-2 px-4 py-3">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p
            className={cn(
              "mt-1 text-2xl font-semibold tabular-nums text-foreground",
              tone === "destructive" && "text-destructive",
            )}
          >
            {value}
          </p>
        </div>
        <Icon
          className={cn(
            "size-4 shrink-0 text-muted-foreground",
            tone === "primary" && "text-primary",
            tone === "destructive" && "text-destructive",
          )}
        />
      </CardContent>
    </Card>
  )
}

export function CapturaPresencialKpiGrid({
  kpis,
}: {
  kpis: CapturaPresencialKpis
}) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <KpiCard label="Pacientes Activos" value={kpis.pacientesActivos} icon={Users} />
      <KpiCard
        label="Encuestas Completadas"
        value={kpis.encuestasCompletadas}
        icon={CircleCheck}
        tone="primary"
      />
      <KpiCard label="Pendientes" value={kpis.pendientes} icon={ClipboardClock} />
      <KpiCard label="No Disponibles" value={kpis.noDisponibles} icon={BedDouble} />
      <KpiCard
        label="Rechazadas"
        value={kpis.rechazadas}
        icon={XCircle}
        tone="destructive"
      />

      <Card className="bg-primary py-0 text-primary-foreground shadow-none">
        <CardContent className="flex items-start justify-between gap-2 px-4 py-3">
          <div>
            <p className="text-xs text-primary-foreground/80">Cobertura Turno</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {kpis.coberturaTurno}%
            </p>
          </div>
          <ChartPie className="size-4 shrink-0 text-primary-foreground/80" />
        </CardContent>
      </Card>
    </div>
  )
}
