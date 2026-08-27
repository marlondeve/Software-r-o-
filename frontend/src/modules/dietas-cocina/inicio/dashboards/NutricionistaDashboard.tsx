import type { EstadoDieta } from "@/modules/dietas-cocina/types/enums"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
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
import { KpiGridSkeleton } from "@/components/shared/skeletons"
import {
  mapDashboardNutricionistaDto,
} from "@/modules/dietas-cocina/api/mappers/dashboard-view.mapper"
import { useCicloBandejas } from "@/modules/dietas-cocina/context/CicloBandejasContext"
import { useDietasOperativas } from "@/modules/dietas-cocina/context/DietasOperativasContext"
import { AlertaItem } from "@/modules/dietas-cocina/inicio/components/AlertaItem"
import { CountdownCard } from "@/modules/dietas-cocina/inicio/components/CountdownCard"
import { DashboardCard } from "@/modules/dietas-cocina/inicio/components/DashboardCard"
import { DashboardPageHeader } from "@/modules/dietas-cocina/inicio/components/DashboardPageHeader"
import { DonutChart } from "@/modules/dietas-cocina/inicio/components/DonutChart"
import { EstadoBadge } from "@/modules/dietas-cocina/inicio/components/EstadoBadge"
import {
  formatearHora12,
  normalizarHoraEnTexto,
} from "@/modules/dietas-cocina/parametros/lib/formatoHora"
import { KpiCard } from "@/modules/dietas-cocina/inicio/components/KpiCard"
import { obtenerComidaActivaOperativa } from "@/modules/dietas-cocina/config/operativa-defaults"
import { construirDashboardNutricionistaDesdeCiclo } from "@/modules/dietas-cocina/lib/construirDashboardNutricionista"
import { mesclarDashboardNutricionista } from "@/modules/dietas-cocina/lib/mesclarDashboardOperativo"
import { descargarArchivoDemo } from "@/modules/dietas-cocina/lib/demoFeedback"
import { CONFIG_TIEMOS_CAMBIO_EVENTO } from "@/modules/dietas-cocina/parametros/lib/configTiemposStorage"
import { useDashboardApi } from "@/modules/dietas-cocina/inicio/hooks/useDashboardApi"
import { useAuth } from "@/features/autenticacion/hooks/useAuth"

const KPI_ICONS = [
  Users,
  ClipboardList,
  CheckCircle2,
  Bell,
  XCircle,
  Clock,
] as const

type ActividadReciente = {
  paciente: string
  accion: string
  hora: string
  estado: EstadoDieta
  observaciones?: string | null
  cancelacionPorSalidaClinica?: boolean
  salidaClinicaSostenida?: boolean
}

export function NutricionistaDashboard() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const { ordenes, etiquetas } = useCicloBandejas()
  const { filas } = useDietasOperativas()
  const [ahora, setAhora] = useState(() => new Date())
  const [versionConfigTiempos, setVersionConfigTiempos] = useState(0)
  const comidaActiva = useMemo(
    () => obtenerComidaActivaOperativa(ahora),
    [ahora, versionConfigTiempos],
  )
  const dashboardApi = useDashboardApi("nutricionista", comidaActiva)

  useEffect(() => {
    const intervalo = window.setInterval(() => setAhora(new Date()), 60_000)
    const onConfig = () => {
      setVersionConfigTiempos((v) => v + 1)
      setAhora(new Date())
    }
    window.addEventListener(CONFIG_TIEMOS_CAMBIO_EVENTO, onConfig)
    return () => {
      window.clearInterval(intervalo)
      window.removeEventListener(CONFIG_TIEMOS_CAMBIO_EVENTO, onConfig)
    }
  }, [])

  const data = useMemo(() => {
    const ciclo = construirDashboardNutricionistaDesdeCiclo(
      filas,
      ordenes,
      etiquetas,
      ahora,
    )
    if (!dashboardApi.apiActiva || dashboardApi.error || !dashboardApi.data) {
      return ciclo
    }
    return mesclarDashboardNutricionista(
      mapDashboardNutricionistaDto(dashboardApi.data),
      ciclo,
    )
  }, [
    filas,
    ordenes,
    etiquetas,
    ahora,
    versionConfigTiempos,
    dashboardApi.apiActiva,
    dashboardApi.data,
    dashboardApi.error,
  ])

  const columnasActividad = useMemo<ColumnDef<ActividadReciente>[]>(
    () => [
      {
        accessorKey: "paciente",
        header: "Paciente / Hab",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.paciente}</span>
        ),
      },
      {
        id: "accion",
        header: "Acción",
        cell: ({ row }) => (
          <span
            className="block w-36 truncate text-sm"
            title={row.original.accion}
          >
            {row.original.accion}
          </span>
        ),
      },
      {
        id: "hora",
        header: () => <span className="block w-16 text-right">Hora</span>,
        cell: ({ row }) => {
          const raw = row.original.hora?.trim()
          const hora =
            !raw || raw === "—"
              ? "—"
              : formatearHora12(normalizarHoraEnTexto(raw))
          return (
            <span className="block w-20 text-right tabular-nums text-muted-foreground">
              {hora}
            </span>
          )
        },
      },
      {
        id: "estado",
        header: () => <span className="block w-28 text-right">Estado</span>,
        cell: ({ row }) => (
          <div className="flex w-28 justify-end">
            <EstadoBadge
              estado={row.original.estado as EstadoDieta}
              observaciones={row.original.observaciones}
              cancelacionPorSalidaClinica={
                row.original.cancelacionPorSalidaClinica
              }
              salidaClinicaSostenida={row.original.salidaClinicaSostenida}
            />
          </div>
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

      {dashboardApi.apiActiva && dashboardApi.error && (
        <p className="text-sm text-amber-700 dark:text-amber-300">
          No se pudieron cargar los indicadores del servidor ({dashboardApi.error}). Mostrando datos operativos locales.
        </p>
      )}

      {data.kpis.length === 0 && dashboardApi.apiActiva && dashboardApi.cargando ? (
        <KpiGridSkeleton count={6} />
      ) : data.kpis.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Sin indicadores disponibles para este periodo.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {data.kpis.map((kpi, index) => (
            <KpiCard
              key={kpi.label}
              label={kpi.label}
              value={kpi.value}
              icon={KPI_ICONS[index] ?? ClipboardList}
              variant={kpi.variant}
            />
          ))}
        </div>
      )}

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
          <div className="divide-y divide-border">
            {data.atencion.length === 0 ? (
              <p className="px-1 py-3 text-sm text-muted-foreground">
                Sin alertas activas.
              </p>
            ) : (
              data.atencion.map((item) => (
                <AlertaItem
                  key={item.title}
                  icon={AlertTriangle}
                  title={item.title}
                  description={item.description}
                  iconClassName="bg-destructive/10 text-destructive"
                />
              ))
            )}
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
