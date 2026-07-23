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
import { AlertaCard, AlertaItem } from "@/modules/dietas-cocina/inicio/components/AlertaItem"
import { DashboardCard } from "@/modules/dietas-cocina/inicio/components/DashboardCard"
import { DashboardPageHeader } from "@/modules/dietas-cocina/inicio/components/DashboardPageHeader"
import { KpiCardProgress } from "@/modules/dietas-cocina/inicio/components/KpiCardProgress"
import { ProgressStat } from "@/modules/dietas-cocina/inicio/components/ProgressBar"
import { mockProveedor } from "@/modules/dietas-cocina/inicio/datos/mockProveedor"
import { puedeDespachar } from "@/modules/dietas-cocina/lib/cicloBandejasValidaciones"
import { demoToast } from "@/modules/dietas-cocina/lib/demoFeedback"
import type { OrdenCocina } from "@/modules/dietas-cocina/cocina/datos/mockCocina"
import { cn } from "@/lib/utils"

export function ProveedorDashboard() {
  const navigate = useNavigate()
  const { ordenes, etiquetas, registrarDespacho, getEtiquetaByOrdenId } =
    useCicloBandejas()
  const data = mockProveedor

  const ordenesAlmuerzo = useMemo(
    () => ordenes.filter((o) => o.comida === "almuerzo").slice(0, 6),
    [ordenes],
  )

  const kpisDinamicos = useMemo(() => {
    const total = ordenes.length || 1
    const enPrep = ordenes.filter((o) => o.estadoCocina === "en_preparacion").length
    const listas = ordenes.filter((o) => o.estadoCocina === "lista").length
    const despachadas = ordenes.filter((o) =>
      ordenEnTransito(o, getEtiquetaByOrdenId(o.id)),
    ).length
    return [
      {
        label: "Raciones programadas",
        value: String(ordenes.length),
        subtitle: "Órdenes activas en sesión",
        progress: Math.min(100, Math.round((ordenes.length / total) * 100)),
        progressColor: "bg-primary",
        accentBorder: "border-l-primary",
      },
      {
        label: "En preparación",
        value: String(enPrep),
        subtitle: "Bandejas en cocina",
        progress: Math.round((enPrep / total) * 100),
        progressColor: "bg-amber-500",
        accentBorder: "border-l-amber-500",
      },
      {
        label: "Listas para despacho",
        value: String(listas),
        subtitle: "Pendientes de salida",
        progress: Math.round((listas / total) * 100),
        progressColor: "bg-emerald-500",
        accentBorder: "border-l-emerald-500",
      },
      {
        label: "En tránsito",
        value: String(despachadas),
        subtitle: "Despachadas, pendientes recepción",
        progress: Math.round((despachadas / total) * 100),
        progressColor: "bg-sky-500",
        accentBorder: "border-l-sky-500",
      },
    ]
  }, [ordenes, getEtiquetaByOrdenId])

  const etiquetasStats = useMemo(() => {
    const impresas = etiquetas.filter(
      (e) => e.estado === "impresa" || e.estado === "reimpresa",
    ).length
    const recibidas = etiquetas.filter(
      (e) => e.estadoLogistica === "pre_entregada",
    ).length
    return { impresas, recibidas, total: etiquetas.length || 1 }
  }, [etiquetas])

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
          return (
            <div className="text-right">
              <Button
                variant="ghost"
                size="icon-sm"
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
    const ids = ordenes
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
        subtitle={`Turno actual: ${data.turno}`}
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

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpisDinamicos.map((kpi) => (
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
          title="Órdenes próximas (Almuerzo)"
          linkLabel="Ver todas"
          linkTo="/dietas-cocina/cocina"
          className="lg:col-span-3"
        >
          <DataTable
            columns={columnasOrdenes}
            data={ordenesAlmuerzo}
            className="rounded-none border-0"
          />
        </DashboardCard>

        <div className="space-y-4 lg:col-span-2">
          <AlertaCard title="Atención requerida" icon={UtensilsCrossed}>
            {data.alertas.map((alerta) => (
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
            ))}
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
