import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CargaAnticipadaCard } from "@/modules/dietas-cocina/parametros/components/tiempos/CargaAnticipadaCard"
import { TiemposComidaPanel } from "@/modules/dietas-cocina/parametros/components/tiempos/TiemposComidaPanel"
import { VistaPreviaEnfermeria } from "@/modules/dietas-cocina/parametros/components/tiempos/VistaPreviaEnfermeria"
import {
  mockParametrosTiempos,
  type TiempoComida,
} from "@/modules/dietas-cocina/parametros/datos/mockTiempos"
import { demoToast } from "@/modules/dietas-cocina/lib/demoFeedback"
import {
  cargarConfigTiempos,
  guardarConfigTiempos,
  type ConfigTiempos,
} from "@/modules/dietas-cocina/parametros/lib/configTiemposStorage"

export function TiemposRestriccionesView() {
  const data = mockParametrosTiempos
  const [comidaActiva, setComidaActiva] = useState<TiempoComida>("desayuno")
  const [config, setConfig] = useState<ConfigTiempos>(cargarConfigTiempos)
  const [configGuardada, setConfigGuardada] = useState<ConfigTiempos>(config)

  function actualizarHora(
    comidaId: TiempoComida,
    hitoId: string,
    hora: string,
  ) {
    setConfig((prev) => ({
      ...prev,
      horasPorComida: {
        ...prev.horasPorComida,
        [comidaId]: {
          ...prev.horasPorComida[comidaId],
          [hitoId]: hora,
        },
      },
    }))
  }

  function guardar() {
    guardarConfigTiempos(config)
    setConfigGuardada(config)
    demoToast("Configuración de tiempos guardada correctamente (demo).")
  }

  function cancelar() {
    setConfig(configGuardada)
    demoToast("Cambios descartados. Se restauró la última configuración guardada.")
  }

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
                activos={config.activos}
                onActivoChange={(id, activo) =>
                  setConfig((prev) => ({
                    ...prev,
                    activos: { ...prev.activos, [id]: activo },
                  }))
                }
                horasPorComida={config.horasPorComida}
                onHoraChange={actualizarHora}
              />
            </CardContent>
          </Card>

          <CargaAnticipadaCard
            modo={config.modoCarga}
            opciones={data.cargaAnticipada.opciones}
            notaInformativa={data.cargaAnticipada.notaInformativa}
            onModoChange={(modo) =>
              setConfig((prev) => ({ ...prev, modoCarga: modo }))
            }
          />
        </div>

        <VistaPreviaEnfermeria {...data.vistaPreviaEnfermeria} />
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">{data.zonaHoraria}</p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={cancelar}>
            Cancelar
          </Button>
          <Button type="button" onClick={guardar}>
            Guardar Configuración
          </Button>
        </div>
      </div>
    </>
  )
}
