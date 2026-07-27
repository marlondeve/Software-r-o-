import type { OrdenCocina } from "@/modules/dietas-cocina/types/kitchen"
import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
  CheckCheck,
  LayoutGrid,
  QrCode,
  Truck,
  UtensilsCrossed,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import { useCicloBandejas } from "@/modules/dietas-cocina/context/CicloBandejasContext"
import {
  claseBadgeEstadoVisibleCocina,
  labelEstadoVisibleCocina,
} from "@/modules/dietas-cocina/cocina/lib/cocinaEstilos"
import { ordenEnTransito } from "@/modules/dietas-cocina/cocina/lib/cocinaLogistica"
import { ordenEnGestion } from "@/modules/dietas-cocina/cocina/lib/cocinaFiltros"
import { AlertaCard, AlertaItem } from "@/modules/dietas-cocina/inicio/components/AlertaItem"
import { DashboardCard } from "@/modules/dietas-cocina/inicio/components/DashboardCard"
import { DashboardPageHeader } from "@/modules/dietas-cocina/inicio/components/DashboardPageHeader"
import { KpiCardProgress } from "@/modules/dietas-cocina/inicio/components/KpiCardProgress"
import { ProgressStat } from "@/modules/dietas-cocina/inicio/components/ProgressBar"
import { mockCocina } from "@/modules/dietas-cocina/cocina/datos/mockCocina"
import { mockProveedor } from "@/modules/dietas-cocina/inicio/datos/mockProveedor"
import { mapDashboardProveedorAlertas } from "@/modules/dietas-cocina/api/mappers/dashboard-view.mapper"
import { obtenerComidaActivaOperativa } from "@/modules/dietas-cocina/config/operativa-defaults"
import { usarApiDietasCocina } from "@/modules/dietas-cocina/api"
import { useDashboardApi } from "@/modules/dietas-cocina/inicio/hooks/useDashboardApi"
import {
  formatearTurnoOperativo,
  labelComida,
} from "@/modules/dietas-cocina/parametros/lib/formatearTurnoOperativo"
import { puedeDespachar } from "@/modules/dietas-cocina/lib/cicloBandejasValidaciones"
import { demoToast } from "@/modules/dietas-cocina/lib/demoFeedback"
import { filtrarEtiquetasDelPeriodoOperativo } from "@/modules/dietas-cocina/lib/resolverOrdenEtiquetaFila"
import { cn } from "@/lib/utils"

export function ProveedorDashboard() {
  const navigate = useNavigate()
  const apiActiva = usarApiDietasCocina()
  const { ordenes, etiquetas, registrarDespacho, getEtiquetaByOrdenId } =
    useCicloBandejas()
  const comidaActiva = useMemo(
    () => (apiActiva ? obtenerComidaActivaOperativa() : mockCocina.comidaActiva),
    [apiActiva],
  )
  const dashboardApi = useDashboardApi("proveedor", comidaActiva)
  const alertas = useMemo(() => {
    if (apiActiva) return mapDashboardProveedorAlertas(dashboardApi.data)
    return mockProveedor.alertas
  }, [apiActiva, dashboardApi.data])
  const turnoActual = formatearTurnoOperativo(comidaActiva)

  const ordenesComida = useMemo(
    () => ordenes.filter((o) => o.comida === comidaActiva),
    [ordenes, comidaActiva],
  )

  const ordenesTurno = useMemo(() => ordenesComida.slice(0, 6), [ordenesComida])

  const kpisDinamicos = useMemo(() => {
    const total = ordenesComida.length || 1
    const enGestion = ordenesComida.filter((o) => ordenEnGestion(o)).length
    const listas = ordenesComida.filter((o) => o.estadoCocina === "lista").length
    const despachadas = ordenesComida.filter((o) =>
      ordenEnTransito(o, getEtiquetaByOrdenId(o.id)),
    ).length
    return [
      {
        label: "Raciones programadas",
        value: String(ordenesComida.length),
        subtitle: `Órdenes del turno (${labelComida(comidaActiva)})`,
        progress: Math.min(100, Math.round((ordenesComida.length / total) * 100)),
        progressColor: "primary" as const,
        accentBorder: true,
      },
      {
        label: "En gestión",
        value: String(enGestion),
        subtitle: "Dietas confirmadas en cocina",
        progress: Math.round((enGestion / total) * 100),
        progressColor: "secondary" as const,
        accentBorder: true,
      },
      {
        label: "Listas para despacho",
        value: String(listas),
        subtitle: "Pendientes de salida",
        progress: Math.round((listas / total) * 100),
        progressColor: "primary" as const,
        accentBorder: false,
      },
      {
        label: "En tránsito",
        value: String(despachadas),
        subtitle: "Despachadas, pendientes recepción",
        progress: Math.round((despachadas / total) * 100),
        progressColor: "muted" as const,
        accentBorder: false,
      },
    ]
  }, [ordenesComida, comidaActiva, getEtiquetaByOrdenId])

  const kpisMostrar = useMemo(() => {
    const kpisApiValidos =
      apiActiva &&
      !dashboardApi.error &&
      dashboardApi.kpis.length > 0 &&
      dashboardApi.kpis.some((kpi) => kpi.value > 0)

    if (kpisApiValidos) {
      const estilos = [
        { progressColor: "primary" as const, accentBorder: true },
        { progressColor: "secondary" as const, accentBorder: true },
        { progressColor: "primary" as const, accentBorder: false },
        { progressColor: "muted" as const, accentBorder: false },
      ] as const
      return dashboardApi.kpis.slice(0, 4).map((kpi, index) => {
        const estilo = estilos[index % estilos.length]
        const valor = Number(kpi.value)
        return {
          label: kpi.label,
          value: String(kpi.value),
          subtitle: "Indicador operativo del API",
          progress: Number.isFinite(valor) ? Math.min(100, valor) : 0,
          progressColor: estilo.progressColor,
          accentBorder: estilo.accentBorder,
        }
      })
    }
    return kpisDinamicos
  }, [apiActiva, dashboardApi.kpis, dashboardApi.error, kpisDinamicos])

  const etiquetasStats = useMemo(() => {
    const delTurno = filtrarEtiquetasDelPeriodoOperativo(etiquetas, {
      comida: comidaActiva,
    })
    const impresas = delTurno.filter(
      (e) => e.estado === "impresa" || e.estado === "reimpresa",
    ).length
    const recibidas = delTurno.filter(
      (e) => e.estadoLogistica === "pre_entregada",
    ).length
    return { impresas, recibidas, total: delTurno.length || 1 }
  }, [etiquetas, comidaActiva])

  const columnasOrdenes = useMemo<ColumnDef<OrdenCocina>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID Orden",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.id}</span>
        ),
      },
      {
        id: "destino",
        header: "Destino",
        cell: ({ row }) => (
          <span>
            {row.original.pabellon} · Hab. {row.original.habitacion}
          </span>
        ),
      },
      { accessorKey: "tipoDieta", header: "Tipo Dieta" },
      {
        accessorKey: "estadoCocina",
        header: "Estado Cocina",
        cell: ({ row }) => {
          const etq = getEtiquetaByOrdenId(row.original.id)
          return (
            <Badge
              variant="outline"
              className={cn(
                "font-medium",
                claseBadgeEstadoVisibleCocina(row.original, etq),
              )}
            >
              {labelEstadoVisibleCocina(row.original, etq)}
            </Badge>
          )
        },
      },
      {
        id: "accion",
        header: () => <span className="float-right">Acción</span>,
        cell: ({ row }) => {
          const etq = getEtiquetaByOrdenId(row.original.id)
          const puedeDesp = puedeDespachar(row.original, etq)
          const accionLabel =
            row.original.etiquetaGenerada && !puedeDesp
              ? "Ver etiqueta QR"
              : puedeDesp
                ? "Despachar orden"
                : "Despacho no disponible"

          return (
            <div className="text-right">
              <Button
                variant="outline"
                size="icon-sm"
                className="size-8 border-border bg-background shadow-xs hover:bg-muted"
                title={accionLabel}
                aria-label={accionLabel}
                onClick={() => {
                  if (row.original.etiquetaGenerada && !puedeDesp) {
                    navigate("/dietas-cocina/etiquetas")
                    return
                  }
                  if (puedeDesp) {
                    registrarDespacho([row.original.id])
                    demoToast(`Orden ${row.original.id} despachada.`)
                  } else {
                    demoToast(
                      "La orden debe estar lista con etiqueta impresa para despachar.",
                    )
                  }
                }}
              >
                {row.original.etiquetaGenerada && !puedeDesp ? (
                  <QrCode className="size-4" />
                ) : (
                  <Truck className="size-4" />
                )}
              </Button>
            </div>
          )
        },
      },
    ],
    [navigate, registrarDespacho, getEtiquetaByOrdenId],
  )

  function despachoMasivo() {
    const ids = ordenesComida
      .filter((o) => {
        const etq = getEtiquetaByOrdenId(o.id)
        return puedeDespachar(o, etq)
      })
      .map((o) => o.id)
    if (ids.length === 0) {
      demoToast("No hay órdenes listas con etiqueta impresa para despachar.")
      return
    }
    registrarDespacho(ids)
    demoToast(`Despacho masivo: ${ids.length} orden(es) registrada(s).`)
  }

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        title="Panel de producción"
        subtitle={`Turno actual: ${turnoActual}`}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/dietas-cocina/etiquetas")}
            >
              <LayoutGrid data-icon="inline-start" />
              Generar etiquetas QR
            </Button>
            <Button size="sm" onClick={despachoMasivo}>
              <CheckCheck data-icon="inline-start" />
              Confirmar despacho masivo
            </Button>
          </>
        }
      />

      {dashboardApi.apiActiva && dashboardApi.cargando && (
        <p className="text-sm text-muted-foreground">Cargando indicadores…</p>
      )}

      {dashboardApi.apiActiva && dashboardApi.error && (
        <p className="text-sm text-destructive">{dashboardApi.error}</p>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpisMostrar.map((kpi) => (
          <KpiCardProgress
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            subtitle={kpi.subtitle}
            progress={kpi.progress}
            progressColor={kpi.progressColor}
            accentBorder={kpi.accentBorder}
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <DashboardCard
          title={`Órdenes próximas (${labelComida(comidaActiva)})`}
          linkLabel="Ver todas"
          linkTo="/dietas-cocina/cocina"
          className="lg:col-span-3"
        >
          <DataTable
            columns={columnasOrdenes}
            data={ordenesTurno}
            className="rounded-none border-0"
          />
        </DashboardCard>

        <div className="space-y-4 lg:col-span-2">
          <AlertaCard title="Atención requerida" icon={UtensilsCrossed}>
            {alertas.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sin alertas operativas.
              </p>
            ) : (
              alertas.map((alerta) => (
                <AlertaItem
                  key={alerta.title}
                  icon={alerta.title.includes("Entregas") ? Truck : UtensilsCrossed}
                  title={alerta.title}
                  description={alerta.description}
                  iconClassName={
                    alerta.title.includes("Entregas")
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted text-muted-foreground"
                  }
                />
              ))
            )}
          </AlertaCard>

          <DashboardCard title="Estado de etiquetas">
            <div className="space-y-4">
              <ProgressStat
                label="Impresas"
                current={etiquetasStats.impresas}
                total={etiquetasStats.total}
              />
              <ProgressStat
                label="Recibidas enfermería"
                current={etiquetasStats.recibidas}
                total={etiquetasStats.total}
              />
            </div>
          </DashboardCard>
        </div>
      </div>
    </div>
  )
}
