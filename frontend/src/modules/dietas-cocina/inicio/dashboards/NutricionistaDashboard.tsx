import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
  AlertTriangle,
  CheckCircle2,
  CircleCheck,
  ClipboardList,
  Clock,
  Download,
  Plus,
  Sun,
  Users,
  XCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import { useCicloBandejas } from "@/modules/dietas-cocina/context/CicloBandejasContext"
import { useDietasOperativas } from "@/modules/dietas-cocina/context/DietasOperativasContext"
import { AlertaItem } from "@/modules/dietas-cocina/inicio/components/AlertaItem"
import { CountdownCard } from "@/modules/dietas-cocina/inicio/components/CountdownCard"
import { DashboardCard } from "@/modules/dietas-cocina/inicio/components/DashboardCard"
import { DashboardPageHeader } from "@/modules/dietas-cocina/inicio/components/DashboardPageHeader"
import { DonutChart } from "@/modules/dietas-cocina/inicio/components/DonutChart"
import { EstadoBadge } from "@/modules/dietas-cocina/inicio/components/EstadoBadge"
import type { EstadoDieta } from "@/modules/dietas-cocina/inicio/components/EstadoBadge"
import { KpiCard } from "@/modules/dietas-cocina/inicio/components/KpiCard"
import { construirDashboardNutricionistaDesdeCiclo } from "@/modules/dietas-cocina/lib/construirDashboardNutricionista"
import { descargarArchivoDemo } from "@/modules/dietas-cocina/lib/demoFeedback"
import { useAuth } from "@/features/autenticacion/hooks/useAuth"

const KPI_ICONS = [
  Users,
  ClipboardList,
  CheckCircle2,
  CircleCheck,
  XCircle,
  Clock,
] as const

type ActividadReciente = {
  paciente: string
  accion: string
  hora: string
  estado: EstadoDieta
}

export function NutricionistaDashboard() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const { ordenes, etiquetas } = useCicloBandejas()
  const { filas } = useDietasOperativas()

  const data = useMemo(
    () => construirDashboardNutricionistaDesdeCiclo(filas, ordenes, etiquetas),
    [filas, ordenes, etiquetas],
  )

  const columnasActividad = useMemo<ColumnDef<ActividadReciente>[]>(
    () => [
      {
        accessorKey: "paciente",
        header: "Paciente / Hab",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.paciente}</span>
        ),
      },
      { accessorKey: "accion", header: "Acción" },
      {
        accessorKey: "hora",
        header: "Hora",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.hora}</span>
        ),
      },
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
        title={`Hola, ${usuario?.nombre ?? "Usuario"}`}
        subtitle={
          <span className="inline-flex items-center gap-1.5">
            <Sun className="size-4 text-primary" />
            Periodo operativo actual: {data.periodoOperativo}
          </span>
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                descargarArchivoDemo(
                  "Dashboard nutricionista — exportación demo\n",
                  "dashboard-nutricionista.txt",
                )
              }
            >
              <Download data-icon="inline-start" />
              Exportar
            </Button>
            <Button
              size="sm"
              onClick={() =>
                navigate("/dietas-cocina/dietas-tarifas?crear=1")
              }
            >
              <Plus data-icon="inline-start" />
              Nueva Dieta
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {data.kpis.map((kpi, index) => (
          <KpiCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            icon={KPI_ICONS[index]}
            variant={kpi.variant}
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <DashboardCard
          title="Distribución de dietas por estado"
          className="lg:col-span-3"
        >
          <DonutChart
            segments={data.distribucion.segmentos}
            total={data.distribucion.total}
          />
        </DashboardCard>

        <DashboardCard
          title="Requieren atención"
          accentTop="destructive"
          className="lg:col-span-2"
        >
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className="size-4 text-destructive" />
          </div>
          <div className="divide-y divide-border">
            {data.atencion.map((item) => (
              <AlertaItem
                key={item.title}
                icon={AlertTriangle}
                title={item.title}
                description={item.description}
                iconClassName="bg-destructive/10 text-destructive"
              />
            ))}
          </div>
        </DashboardCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <DashboardCard
          title="Actividad reciente (Enfermería)"
          linkLabel="Ver todo"
          linkTo="/dietas-cocina/dietas"
          className="lg:col-span-3"
        >
          <DataTable
            columns={columnasActividad}
            data={data.actividadReciente}
            className="rounded-none border-0"
          />
        </DashboardCard>

        <div className="lg:col-span-2">
          <CountdownCard
            servicio={data.proximoCierre.servicio}
            hora={data.proximoCierre.hora}
            tiempoRestante={data.proximoCierre.tiempoRestante}
            pendientes={data.proximoCierre.pendientes}
          />
        </div>
      </div>
    </div>
  )
}
