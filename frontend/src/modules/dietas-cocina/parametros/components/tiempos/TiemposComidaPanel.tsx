import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type {
  ParametrosTiempoComida,
  TiempoComida,
} from "@/modules/dietas-cocina/parametros/datos/mockTiempos"
import { SecuenciaOperativa } from "@/modules/dietas-cocina/parametros/components/tiempos/SecuenciaOperativa"
import { TiemposComidaFormulario } from "@/modules/dietas-cocina/parametros/components/tiempos/TiemposComidaFormulario"

interface TiemposComidaPanelProps {
  comidas: ParametrosTiempoComida[]
  comidaActiva: TiempoComida
  onComidaChange: (id: TiempoComida) => void
  activos: Record<TiempoComida, boolean>
  onActivoChange: (id: TiempoComida, activo: boolean) => void
  horasPorComida: Record<TiempoComida, Record<string, string>>
  onHoraChange: (comidaId: TiempoComida, hitoId: string, hora: string) => void
}

export function TiemposComidaPanel({
  comidas,
  comidaActiva,
  onComidaChange,
  activos,
  onActivoChange,
  horasPorComida,
  onHoraChange,
}: TiemposComidaPanelProps) {
  return (
    <Tabs
      value={comidaActiva}
      onValueChange={(value) => onComidaChange(value as TiempoComida)}
    >
      <TabsList className="flex h-auto w-full flex-wrap gap-1">
        {comidas.map((item) => (
          <TabsTrigger
            key={item.id}
            value={item.id}
            className="min-w-fit flex-1 px-2 text-xs sm:text-sm"
          >
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {comidas.map((item) => {
        const comidaConHoras: ParametrosTiempoComida = {
          ...item,
          hitos: item.hitos.map((hito) => ({
            ...hito,
            hora: horasPorComida[item.id]?.[hito.id] ?? hito.hora,
          })),
          ventanaCambios: {
            ...item.ventanaCambios,
            inicio:
              horasPorComida[item.id]?.solicitud ?? item.ventanaCambios.inicio,
            fin:
              horasPorComida[item.id]?.novedades ?? item.ventanaCambios.fin,
          },
        }

        return (
          <TabsContent key={item.id} value={item.id} className="mt-4 space-y-5">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Parámetros de {item.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  Define los hitos operativos para este tiempo de comida
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor={`activo-${item.id}`} className="text-xs font-medium">
                  ACTIVO
                </Label>
                <Switch
                  id={`activo-${item.id}`}
                  checked={activos[item.id]}
                  onCheckedChange={(checked) => onActivoChange(item.id, checked)}
                />
              </div>
            </div>

            <TiemposComidaFormulario
              hitos={item.hitos}
              horas={horasPorComida[item.id] ?? {}}
              onHoraChange={(hitoId, hora) => onHoraChange(item.id, hitoId, hora)}
              deshabilitado={!activos[item.id]}
            />

            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">
                Secuencia Operativa
              </p>
              <SecuenciaOperativa comida={comidaConHoras} />
            </div>
          </TabsContent>
        )
      })}
    </Tabs>
  )
}
