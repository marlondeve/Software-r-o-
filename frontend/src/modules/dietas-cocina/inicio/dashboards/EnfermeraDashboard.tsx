import type { EstadoDieta } from "@/modules/dietas-cocina/types/enums"
import { useMemo } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Phone,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { KpiGridSkeleton } from "@/components/shared/skeletons"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import {
  dashboardEnfermeraVacio,
  mapDashboardEnfermeraDto,
} from "@/modules/dietas-cocina/api/mappers/dashboard-view.mapper"
import { useCicloBandejas } from "@/modules/dietas-cocina/context/CicloBandejasContext"
import { useDietasOperativas } from "@/modules/dietas-cocina/context/DietasOperativasContext"
import { DashboardCard } from "@/modules/dietas-cocina/inicio/components/DashboardCard"
import { DashboardPageHeader } from "@/modules/dietas-cocina/inicio/components/DashboardPageHeader"
import { EstadoBadge } from "@/modules/dietas-cocina/inicio/components/EstadoBadge"
import { KpiCardSimple } from "@/modules/dietas-cocina/inicio/components/KpiCardProgress"
import { obtenerComidaActivaOperativa } from "@/modules/dietas-cocina/config/operativa-defaults"
import { construirDashboardEnfermeraDesdeCiclo } from "@/modules/dietas-cocina/lib/construirDashboardEnfermera"
import { mesclarDashboardEnfermera } from "@/modules/dietas-cocina/lib/mesclarDashboardOperativo"
import { useDashboardApi } from "@/modules/dietas-cocina/inicio/hooks/useDashboardApi"

type DietaReciente = {
  habitacion: string
  paciente: string
  tipo: string
  estado: EstadoDieta
  observaciones?: string | null
  cancelacionPorSalidaClinica?: boolean
  salidaClinicaSostenida?: boolean
}

export function EnfermeraDashboard() {
  const { ordenes, etiquetas } = useCicloBandejas()
  const { filas } = useDietasOperativas()
  const comidaActiva = useMemo(() => obtenerComidaActivaOperativa(), [])
  const dashboardApi = useDashboardApi("enfermera", comidaActiva)

  const data = useMemo(() => {
    const ciclo = construirDashboardEnfermeraDesdeCiclo(
      filas,
      ordenes,
      etiquetas,
      comidaActiva,
    )
    if (!dashboardApi.apiActiva || dashboardApi.error || !dashboardApi.data) {
      return ciclo
    }
    return mesclarDashboardEnfermera(
      mapDashboardEnfermeraDto(dashboardApi.data),
      ciclo,
    )
  }, [filas, ordenes, etiquetas, comidaActiva, dashboardApi.apiActiva, dashboardApi.data, dashboardApi.error])

  const kpis =
    data.kpis.length >= 3
      ? data.kpis
      : dashboardEnfermeraVacio().kpis

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
          <EstadoBadge
            estado={row.original.estado as EstadoDieta}
            observaciones={row.original.observaciones}
            cancelacionPorSalidaClinica={
              row.original.cancelacionPorSalidaClinica
            }
            salidaClinicaSostenida={row.original.salidaClinicaSostenida}
          />
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

      {dashboardApi.apiActiva && dashboardApi.cargando && !dashboardApi.data ? (
        <KpiGridSkeleton count={3} />
      ) : (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCardSimple
          label={kpis[0].label}
          value={kpis[0].value}
          icon={ClipboardList}
        />
        <KpiCardSimple
          label={kpis[1].label}
          value={kpis[1].value}
          icon={CheckCircle2}
        />
        <KpiCardSimple
          label={kpis[2].label}
          value={kpis[2].value}
          icon={AlertTriangle}
          className="border-l-[3px] border-l-destructive"
        />
      </div>
      )}

      {dashboardApi.apiActiva && dashboardApi.error && (
        <p className="text-sm text-amber-700 dark:text-amber-300">
          No se pudieron cargar todos los indicadores del servidor. Mostrando datos operativos locales.
        </p>
      )}

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
              {data.alertas.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Sin alertas pendientes.
                </p>
              ) : (
                data.alertas.map((alerta) => (
                  <div
                    key={`${alerta.habitacion}-${alerta.titulo}`}
                    className="rounded-lg bg-card p-3 ring-1 ring-border"
                  >
                    <p className="text-sm font-medium text-foreground">
                      Hab {alerta.habitacion}: {alerta.titulo}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {alerta.descripcion}
                    </p>
                  </div>
                ))
              )}
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
