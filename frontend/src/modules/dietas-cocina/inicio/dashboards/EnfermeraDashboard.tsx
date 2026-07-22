import { useMemo } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Phone,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import { DashboardCard } from "@/modules/dietas-cocina/inicio/components/DashboardCard"
import { DashboardPageHeader } from "@/modules/dietas-cocina/inicio/components/DashboardPageHeader"
import { EstadoBadge } from "@/modules/dietas-cocina/inicio/components/EstadoBadge"
import type { EstadoDieta } from "@/modules/dietas-cocina/inicio/components/EstadoBadge"
import { KpiCardSimple } from "@/modules/dietas-cocina/inicio/components/KpiCardProgress"
import { mockEnfermera } from "@/modules/dietas-cocina/inicio/datos/mockEnfermera"

type DietaReciente = (typeof mockEnfermera.dietasRecientes)[number]

export function EnfermeraDashboard() {
  const data = mockEnfermera

  const columnasDietas = useMemo<ColumnDef<DietaReciente>[]>(
    () => [
      {
        accessorKey: "habitacion",
        header: "Habitación",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.habitacion}</span>
        ),
      },
      { accessorKey: "paciente", header: "Paciente" },
      { accessorKey: "tipo", header: "Tipo de Dieta" },
      {
        accessorKey: "estado",
        header: "Estado",
        cell: ({ row }) => (
          <EstadoBadge estado={row.original.estado as EstadoDieta} />
        ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        title={data.piso}
        subtitle="Resumen de servicio y estado de pacientes."
        badge={
          <Badge variant="outline" className="font-normal">
            {data.servicioEnCurso}
          </Badge>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCardSimple
          label={data.kpis[0].label}
          value={data.kpis[0].value}
          icon={ClipboardList}
        />
        <KpiCardSimple
          label={data.kpis[1].label}
          value={data.kpis[1].value}
          icon={CheckCircle2}
        />
        <KpiCardSimple
          label={data.kpis[2].label}
          value={data.kpis[2].value}
          icon={AlertTriangle}
          className="border-l-[3px] border-l-destructive"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <DashboardCard
          title="Dietas confirmadas (Recientes)"
          linkLabel="Ver todas"
          linkTo="/dietas-cocina/dietas"
          className="lg:col-span-3"
        >
          <DataTable
            columns={columnasDietas}
            data={data.dietasRecientes}
            className="rounded-none border-0"
          />
        </DashboardCard>

        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl bg-destructive/5 p-4 ring-1 ring-destructive/10">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="size-4 text-destructive" />
              <h3 className="text-sm font-semibold text-foreground">
                Alertas nuevas
              </h3>
            </div>
            <div className="space-y-3">
              {data.alertas.map((alerta) => (
                <div
                  key={alerta.habitacion}
                  className="rounded-lg bg-card p-3 ring-1 ring-border"
                >
                  <p className="text-sm font-medium text-foreground">
                    Hab {alerta.habitacion}: {alerta.titulo}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {alerta.descripcion}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <Card className="py-0 shadow-none">
            <CardContent className="space-y-3 px-4 py-4">
              <h3 className="text-sm font-semibold text-foreground">
                Contacto nutrición
              </h3>
              <p className="text-xs text-muted-foreground">
                {data.contactoNutricion.descripcion}
              </p>
              <div className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2.5 ring-1 ring-primary/15">
                <Phone className="size-4 shrink-0 text-primary" />
                <span className="text-sm font-medium text-primary">
                  Ext. {data.contactoNutricion.extension} — Central de Nutrición
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
