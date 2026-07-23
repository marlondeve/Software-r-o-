import { CalendarDays, Clock, Database, Download, RefreshCw } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BrechasKpiGrid } from "@/modules/encuestas/indicadores/components/brechas/BrechasKpiGrid"
import { BrechasTabla } from "@/modules/encuestas/indicadores/components/brechas/BrechasTabla"
import { mockAnalisisBrechas } from "@/modules/encuestas/indicadores/datos/mockAnalisisBrechas"
import { DashboardPageHeader } from "@/modules/encuestas/inicio/components/DashboardPageHeader"

export function AnalisisBrechasTab() {
  const data = mockAnalisisBrechas

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        title="Análisis de brechas"
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5" />
              Mes: {data.mes}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Database className="size-3.5" />
              Fuente: {data.fuente}
            </span>
            <Badge variant="secondary" className="gap-1.5 font-normal">
              <Clock className="size-3" />
              Última reconciliación: {data.ultimaReconciliacion}
            </Badge>
          </span>
        }
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              className="h-11"
              onClick={() => window.alert("Exportando análisis de brechas...")}
            >
              <Download data-icon="inline-start" />
              Exportar
            </Button>
            <Button
              type="button"
              className="h-11"
              onClick={() => window.alert("Actualizando análisis...")}
            >
              <RefreshCw data-icon="inline-start" />
              Actualizar análisis
            </Button>
          </>
        }
      />

      <BrechasKpiGrid
        totalElegibles={data.kpis.totalElegibles}
        encuestasRegistradas={data.kpis.encuestasRegistradas}
        tendenciaEncuestas={data.kpis.tendenciaEncuestas}
        sinEncuesta={data.kpis.sinEncuesta}
        cobertura={data.kpis.cobertura}
        excluidos={data.kpis.excluidos}
        inconsistencias={data.kpis.inconsistencias}
      />

      <BrechasTabla filas={data.filas} totalRegistros={data.totalRegistros} />
    </div>
  )
}
