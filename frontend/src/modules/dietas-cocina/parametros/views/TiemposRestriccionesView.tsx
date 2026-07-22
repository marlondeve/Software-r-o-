import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CargaAnticipadaCard } from "@/modules/dietas-cocina/parametros/components/tiempos/CargaAnticipadaCard"
import { TiemposComidaPanel } from "@/modules/dietas-cocina/parametros/components/tiempos/TiemposComidaPanel"
import { VistaPreviaEnfermeria } from "@/modules/dietas-cocina/parametros/components/tiempos/VistaPreviaEnfermeria"
import {
  mockParametrosTiempos,
  type ModoCargaAnticipada,
  type TiempoComida,
} from "@/modules/dietas-cocina/parametros/datos/mockTiempos"

export function TiemposRestriccionesView() {
  const data = mockParametrosTiempos
  const [comidaActiva, setComidaActiva] = useState<TiempoComida>("desayuno")
  const [activos, setActivos] = useState<Record<TiempoComida, boolean>>(() =>
    Object.fromEntries(
      data.comidas.map((comida) => [comida.id, comida.activo]),
    ) as Record<TiempoComida, boolean>,
  )
  const [modoCarga, setModoCarga] = useState<ModoCargaAnticipada>(
    data.cargaAnticipada.modo,
  )

  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <Card className="gap-0 py-0 shadow-none">
            <CardContent className="py-4">
              <TiemposComidaPanel
                comidas={data.comidas}
                comidaActiva={comidaActiva}
                onComidaChange={setComidaActiva}
                activos={activos}
                onActivoChange={(id, activo) =>
                  setActivos((prev) => ({ ...prev, [id]: activo }))
                }
              />
            </CardContent>
          </Card>

          <CargaAnticipadaCard
            modo={modoCarga}
            opciones={data.cargaAnticipada.opciones}
            notaInformativa={data.cargaAnticipada.notaInformativa}
            onModoChange={setModoCarga}
          />
        </div>

        <VistaPreviaEnfermeria {...data.vistaPreviaEnfermeria} />
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">{data.zonaHoraria}</p>
        <div className="flex gap-2">
          <Button type="button" variant="outline">
            Cancelar
          </Button>
          <Button type="button">Guardar Configuración</Button>
        </div>
      </div>
    </>
  )
}
