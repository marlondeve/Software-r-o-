import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnalisisBrechasTab } from "@/modules/encuestas/indicadores/components/brechas/AnalisisBrechasTab"
import { IndicadoresExperienciaTab } from "@/modules/encuestas/indicadores/components/experiencia/IndicadoresExperienciaTab"

export function IndicadoresPage() {
  return (
    <Tabs defaultValue="experiencia" className="gap-5">
      <TabsList className="h-11 w-fit">
        <TabsTrigger value="experiencia" className="h-full px-4">
          Indicadores de experiencia
        </TabsTrigger>
        <TabsTrigger value="brechas" className="h-full px-4">
          Análisis de brechas
        </TabsTrigger>
      </TabsList>

      <TabsContent value="experiencia">
        <IndicadoresExperienciaTab />
      </TabsContent>

      <TabsContent value="brechas">
        <AnalisisBrechasTab />
      </TabsContent>
    </Tabs>
  )
}
