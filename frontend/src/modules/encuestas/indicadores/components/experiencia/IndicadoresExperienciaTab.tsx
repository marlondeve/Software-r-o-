import { useState } from "react"
import { Clock, Download, FileBarChart } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FiltrosExperiencia } from "@/modules/encuestas/indicadores/components/experiencia/FiltrosExperiencia"
import type { FiltrosExperienciaState } from "@/modules/encuestas/indicadores/components/experiencia/FiltrosExperiencia"
import { KpiExperienciaGrid } from "@/modules/encuestas/indicadores/components/experiencia/KpiExperienciaGrid"
import { NivelSatisfaccionChart } from "@/modules/encuestas/indicadores/components/experiencia/NivelSatisfaccionChart"
import { RecomendacionLista } from "@/modules/encuestas/indicadores/components/experiencia/RecomendacionLista"
import { TiemposEsperaSection } from "@/modules/encuestas/indicadores/components/experiencia/TiemposEsperaSection"
import { mockIndicadoresExperiencia } from "@/modules/encuestas/indicadores/datos/mockIndicadoresExperiencia"
import { DashboardPageHeader } from "@/modules/encuestas/inicio/components/DashboardPageHeader"

export function IndicadoresExperienciaTab() {
  const data = mockIndicadoresExperiencia
  const [filtros, setFiltros] = useState<FiltrosExperienciaState>(data.filtrosDefault)

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        title="Indicadores de experiencia"
        subtitle={
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5" />
            Última actualización: {data.ultimaActualizacion}
          </span>
        }
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              className="h-11"
              onClick={() => window.alert("Exportando a Excel...")}
            >
              <Download data-icon="inline-start" />
              Exportar Excel
            </Button>
            <Button
              type="button"
              className="h-11"
              onClick={() => window.alert("Generando Reporte Res 256...")}
            >
              <FileBarChart data-icon="inline-start" />
              Reporte Res 256
            </Button>
          </>
        }
      />

      <FiltrosExperiencia filtros={filtros} onChange={setFiltros} />

      <KpiExperienciaGrid kpis={data.kpis} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="gap-0 py-0 shadow-none">
          <CardContent className="space-y-4 px-4 py-4">
            <h2 className="text-lg font-semibold text-foreground">
              Nivel de Satisfacción
            </h2>
            <NivelSatisfaccionChart segmentos={data.nivelSatisfaccion} />
          </CardContent>
        </Card>

        <Card className="gap-0 py-0 shadow-none">
          <CardContent className="space-y-4 px-4 py-4">
            <h2 className="text-lg font-semibold text-foreground">Recomendación</h2>
            <RecomendacionLista segmentos={data.recomendacion} />
          </CardContent>
        </Card>
      </div>

      <TiemposEsperaSection
        medianaMinutos={data.tiemposEspera.medianaMinutos}
        atendidosBajo30={data.tiemposEspera.atendidosBajo30}
        atendidosSobre30={data.tiemposEspera.atendidosSobre30}
      />
    </div>
  )
}
