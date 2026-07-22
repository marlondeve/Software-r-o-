import { useMemo } from "react"
import {
  AlertTriangle,
  CircleCheck,
  ClipboardCheck,
  Frown,
  Phone,
  RefreshCw,
  ThumbsUp,
  UserCheck,
  UserX,
  Users,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import { DashboardCard } from "@/modules/encuestas/inicio/components/DashboardCard"
import { DashboardPageHeader } from "@/modules/encuestas/inicio/components/DashboardPageHeader"
import { EstadoCapturaBadge } from "@/modules/encuestas/inicio/components/EstadoCapturaBadge"
import { IndicadoresChart } from "@/modules/encuestas/inicio/components/IndicadoresChart"
import { KpiCard } from "@/modules/encuestas/inicio/components/KpiCard"
import { ListaIconItem } from "@/modules/encuestas/inicio/components/ListaIconItem"
import { mockInicioEncuestas } from "@/modules/encuestas/inicio/datos/mockInicio"

const KPI_ICONS = [Users, ClipboardCheck, Frown, ThumbsUp] as const

const ACCION_ICONS = [Phone, UserCheck] as const

const ATENCION_ICONS = [Frown, RefreshCw, UserX] as const

type FilaCaptura = (typeof mockInicioEncuestas.capturasRecientes)[number]

export function InicioPage() {
  const navigate = useNavigate()
  const data = mockInicioEncuestas

  const columnasCapturas = useMemo<ColumnDef<FilaCaptura>[]>(
    () => [
      {
        accessorKey: "paciente",
        header: "Paciente / ID",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.paciente}</p>
            <p className="text-xs text-muted-foreground">
              ID: {row.original.id}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "tipo",
        header: "Tipo",
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
            {row.original.tipo === "telefonica" ? (
              <Phone className="size-3.5 text-muted-foreground" />
            ) : (
              <UserCheck className="size-3.5 text-muted-foreground" />
            )}
            {row.original.tipo === "telefonica" ? "Telefónica" : "Presencial"}
          </span>
        ),
      },
      {
        accessorKey: "fecha",
        header: "Fecha",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.fecha}</span>
        ),
      },
      {
        id: "puntuacion",
        header: "Puntuación",
        cell: ({ row }) => {
          const { puntuacion, puntuacionMax } = row.original
          const bajo = puntuacion <= puntuacionMax / 2
          return (
            <div className="w-28 space-y-1">
              <span
                className={`text-sm font-medium tabular-nums ${
                  bajo ? "text-destructive" : "text-primary"
                }`}
              >
                {puntuacion}/{puntuacionMax}
              </span>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${
                    bajo ? "bg-destructive" : "bg-primary"
                  }`}
                  style={{ width: `${(puntuacion / puntuacionMax) * 100}%` }}
                />
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: "estado",
        header: "Estado",
        cell: ({ row }) => <EstadoCapturaBadge estado={row.original.estado} />,
      },
    ],
    [],
  )

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        title="Encuestas de experiencia"
        subtitle={`${data.fecha} • Periodo: ${data.periodo}`}
        actions={
          <>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
              <CircleCheck className="size-4" />
              Sincronizado hace {data.sincronizadoHaceMin} min
            </span>
            <Button type="button" variant="outline" className="h-11 text-sm">
              <RefreshCw data-icon="inline-start" />
              Actualizar
            </Button>
            <Button
              type="button"
              className="h-11 text-sm"
              onClick={() => navigate("/encuestas/identificacion-paciente")}
            >
              Nueva encuesta
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {data.kpis.map((kpi, index) => (
          <KpiCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            icon={KPI_ICONS[index]}
            iconTone={kpi.iconTone}
            trend={kpi.trend}
            footnote={kpi.footnote}
            progreso={kpi.progreso}
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <DashboardCard title="Capturas Recientes" className="lg:col-span-3">
          <DataTable
            columns={columnasCapturas}
            data={data.capturasRecientes}
            className="rounded-none border-0"
          />
        </DashboardCard>

        <DashboardCard title="Acciones Rápidas" className="lg:col-span-2">
          <div className="divide-y divide-border">
            {data.accionesRapidas.map((accion, index) => (
              <ListaIconItem
                key={accion.title}
                icon={ACCION_ICONS[index]}
                title={accion.title}
                description={accion.description}
                to={accion.to}
              />
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-border pt-3 text-xs">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <RefreshCw className="size-3.5" />
              Última sinc. {data.ultimaSincronizacion.fuente}
            </span>
            <span className="text-muted-foreground">
              Hace {data.ultimaSincronizacion.haceMin} min
            </span>
          </div>
        </DashboardCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <DashboardCard title="Indicadores Clave" className="lg:col-span-3">
          <IndicadoresChart items={data.indicadoresClave} />
        </DashboardCard>

        <DashboardCard
          title="Requieren Atención"
          icon={<AlertTriangle className="size-4" />}
          tone="alerta"
          className="lg:col-span-2"
        >
          <div className="divide-y divide-destructive/10">
            {data.requierenAtencion.map((item, index) => (
              <ListaIconItem
                key={item.title}
                icon={ATENCION_ICONS[index]}
                title={item.title}
                description={item.description}
                tone="alerta"
              />
            ))}
          </div>
        </DashboardCard>
      </div>
    </div>
  )
}
