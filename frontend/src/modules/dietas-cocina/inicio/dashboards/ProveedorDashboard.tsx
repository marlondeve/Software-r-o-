import { useMemo } from "react"
import {
  CheckCheck,
  LayoutGrid,
  QrCode,
  Truck,
  UtensilsCrossed,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import { AlertaCard, AlertaItem } from "@/modules/dietas-cocina/inicio/components/AlertaItem"
import { DashboardCard } from "@/modules/dietas-cocina/inicio/components/DashboardCard"
import { DashboardPageHeader } from "@/modules/dietas-cocina/inicio/components/DashboardPageHeader"
import { EstadoBadge } from "@/modules/dietas-cocina/inicio/components/EstadoBadge"
import type { EstadoDieta } from "@/modules/dietas-cocina/inicio/components/EstadoBadge"
import { KpiCardProgress } from "@/modules/dietas-cocina/inicio/components/KpiCardProgress"
import { ProgressStat } from "@/modules/dietas-cocina/inicio/components/ProgressBar"
import { mockProveedor } from "@/modules/dietas-cocina/inicio/datos/mockProveedor"

type OrdenProveedor = (typeof mockProveedor.ordenes)[number]

export function ProveedorDashboard() {
  const data = mockProveedor

  const columnasOrdenes = useMemo<ColumnDef<OrdenProveedor>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID Orden",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.id}</span>
        ),
      },
      { accessorKey: "destino", header: "Destino" },
      { accessorKey: "tipo", header: "Tipo Dieta" },
      {
        accessorKey: "estado",
        header: "Estado Cocina",
        cell: ({ row }) => (
          <EstadoBadge estado={row.original.estado as EstadoDieta} />
        ),
      },
      {
        id: "accion",
        header: () => <span className="float-right">Acción</span>,
        cell: ({ row }) => (
          <div className="text-right">
            <Button variant="ghost" size="icon-sm">
              {row.original.accion === "qr" ? (
                <QrCode className="size-4" />
              ) : (
                <Truck className="size-4" />
              )}
            </Button>
          </div>
        ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        title="Panel de producción"
        subtitle={`Turno actual: ${data.turno}`}
        actions={
          <>
            <Button variant="outline" size="sm">
              <LayoutGrid data-icon="inline-start" />
              Generar etiquetas QR
            </Button>
            <Button size="sm">
              <CheckCheck data-icon="inline-start" />
              Confirmar despacho masivo
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {data.kpis.map((kpi) => (
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
          title="Órdenes próximas (Cena)"
          linkLabel="Ver todas"
          linkTo="/dietas-cocina/cocina"
          className="lg:col-span-3"
        >
          <DataTable
            columns={columnasOrdenes}
            data={data.ordenes}
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
                current={data.etiquetas.impresas.current}
                total={data.etiquetas.impresas.total}
              />
              <ProgressStat
                label="Escaneadas (Despacho)"
                current={data.etiquetas.escaneadas.current}
                total={data.etiquetas.escaneadas.total}
              />
            </div>
          </DashboardCard>
        </div>
      </div>
    </div>
  )
}
