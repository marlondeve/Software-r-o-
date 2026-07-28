import type { TiempoComida } from "@/modules/dietas-cocina/types/enums"
import type { ParametrosTiempoComida } from "@/modules/dietas-cocina/types/parameters"
import { useEffect, useMemo, useState } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/features/autenticacion/hooks/useAuth"
import { CargaAnticipadaCard } from "@/modules/dietas-cocina/parametros/components/tiempos/CargaAnticipadaCard"
import { TiemposComidaPanel } from "@/modules/dietas-cocina/parametros/components/tiempos/TiemposComidaPanel"
import { VistaPreviaEnfermeria } from "@/modules/dietas-cocina/parametros/components/tiempos/VistaPreviaEnfermeria"
import { mockParametrosTiempos } from "@/modules/dietas-cocina/parametros/datos/mockTiempos"
import { demoToast } from "@/modules/dietas-cocina/lib/demoFeedback"
import {
  cargarConfigTiempos,
  guardarConfigTiempos,
  normalizarConfigTiempos,
  type ConfigTiempos,
} from "@/modules/dietas-cocina/parametros/lib/configTiemposStorage"
import { resolverVistaPreviaEnfermeria } from "@/modules/dietas-cocina/parametros/lib/resolverVistaPreviaEnfermeria"
import { usarApiDietasCocina } from "@/modules/dietas-cocina/api"
import {
  actualizarTiemposComida,
  obtenerTiemposComidaConfig,
} from "@/modules/dietas-cocina/api/services/parametros.service"
import {
  configToParametros,
  parametrosToConfig,
  tiemposBaseDesdeMock,
} from "@/modules/dietas-cocina/parametros/lib/tiemposApiBridge"

function combinarConfigConPersistido(base: ConfigTiempos, apiActiva: boolean): ConfigTiempos {
  if (apiActiva) return base
  const persistido = cargarConfigTiempos()
  return normalizarConfigTiempos({
    ...base,
    modoCarga: persistido.modoCarga ?? base.modoCarga,
  })
}

export function TiemposRestriccionesView() {
  const apiActiva = usarApiDietasCocina()
  const { usuario } = useAuth()
  const data = mockParametrosTiempos
  const [comidaActiva, setComidaActiva] = useState<TiempoComida>("desayuno")
  const [tiemposBase, setTiemposBase] = useState<ParametrosTiempoComida[]>(() =>
    tiemposBaseDesdeMock(),
  )
  const [config, setConfig] = useState<ConfigTiempos>(() =>
    apiActiva
      ? combinarConfigConPersistido(parametrosToConfig(tiemposBaseDesdeMock()), true)
      : cargarConfigTiempos(),
  )
  const [configGuardada, setConfigGuardada] = useState<ConfigTiempos>(config)
  const [cargando, setCargando] = useState(apiActiva)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (!apiActiva) return
    setCargando(true)
    void obtenerTiemposComidaConfig()
      .then(({ tiempos, modoCarga }) => {
        const base = tiempos.length > 0 ? tiempos : tiemposBaseDesdeMock()
        setTiemposBase(base)
        const nextConfig = combinarConfigConPersistido(
          parametrosToConfig(base, mockParametrosTiempos, modoCarga),
          true,
        )
        setConfig(nextConfig)
        setConfigGuardada(nextConfig)
      })
      .catch(() => {
        demoToast("No se pudieron cargar los tiempos desde el API.", "error")
        const fallback = combinarConfigConPersistido(
          parametrosToConfig(tiemposBaseDesdeMock()),
          true,
        )
        setConfig(fallback)
        setConfigGuardada(fallback)
      })
      .finally(() => setCargando(false))
  }, [apiActiva])

  const vistaPrevia = useMemo(
    () => resolverVistaPreviaEnfermeria(tiemposBase, config),
    [tiemposBase, config],
  )

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
    const usuarioParametros = usuario?.nombre ?? usuario?.email ?? "admin"

    if (apiActiva) {
      setGuardando(true)
      void actualizarTiemposComida(
        configToParametros(config, tiemposBase),
        usuarioParametros,
        config.modoCarga,
      )
        .then(async () => {
          const actualizado = await obtenerTiemposComidaConfig()
          setTiemposBase(actualizado.tiempos)
          const nextConfig = combinarConfigConPersistido(
            parametrosToConfig(
              actualizado.tiempos,
              mockParametrosTiempos,
              actualizado.modoCarga,
            ),
            true,
          )
          setConfig(nextConfig)
          setConfigGuardada(nextConfig)
          demoToast("Configuración de tiempos guardada correctamente.", "success")
        })
        .catch((error) => {
          demoToast(
            error instanceof Error
              ? error.message
              : "No se pudo guardar la configuración de tiempos.",
            "error",
          )
        })
        .finally(() => setGuardando(false))
      return
    }

    guardarConfigTiempos(config)
    setConfigGuardada(config)
    demoToast("Configuración de tiempos guardada correctamente.")
  }

  function cancelar() {
    setConfig(configGuardada)
    demoToast("Cambios descartados. Se restauró la última configuración guardada.")
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Cargando parámetros de tiempos…
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <Card className="gap-0 py-0 shadow-none">
            <CardContent className="py-4">
              <TiemposComidaPanel
                comidas={tiemposBase}
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
            notaInformativa={
              apiActiva
                ? "La carga anticipada se mantiene en sesión hasta que el API exponga este parámetro."
                : data.cargaAnticipada.notaInformativa
            }
            onModoChange={(modo) =>
              setConfig((prev) => ({ ...prev, modoCarga: modo }))
            }
          />
        </div>

        <VistaPreviaEnfermeria {...vistaPrevia} />
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">{data.zonaHoraria}</p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={cancelar} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="button" onClick={guardar} disabled={guardando}>
            {guardando ? (
              <>
                <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
                Guardando…
              </>
            ) : (
              "Guardar Configuración"
            )}
          </Button>
        </div>
      </div>
    </>
  )
}
