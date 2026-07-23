import { CircleCheck, CirclePlus, ClipboardList, CloudCheck } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"

interface EncuestaRegistradaState {
  consecutivo: string
  horaRegistro: string
  encuestador: string
}

export function EncuestaRegistradaPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const estado = location.state as EncuestaRegistradaState | null

  const consecutivo = estado?.consecutivo ?? "#SIAO-2023-4582"
  const horaRegistro = estado?.horaRegistro ?? "09:20 AM"
  const encuestador = estado?.encuestador ?? "Dra. Ana López"

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-8">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="h-1.5 w-full bg-primary" />

        <div className="space-y-6 p-8 text-center">
          <div className="flex justify-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-accent">
              <CircleCheck className="size-8 text-accent-foreground" />
            </span>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-primary">
              Encuesta registrada correctamente
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Los datos del paciente y la evaluación nutricional han sido guardados en el
              sistema.
            </p>
          </div>

          <div className="space-y-3 rounded-lg bg-muted/50 p-4 text-left">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Consecutivo
                </p>
                <p className="text-sm font-medium text-foreground">{consecutivo}</p>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Hora de registro
                </p>
                <p className="text-sm font-medium text-foreground">{horaRegistro}</p>
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Encuestador
              </p>
              <p className="text-sm font-medium text-foreground">{encuestador}</p>
            </div>

            <div className="border-t border-border pt-3">
              <p className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Estado de Sincronización
              </p>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                <CloudCheck className="size-4" />
                Sincronizado exitosamente con Hosvital
              </span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              className="h-11"
              onClick={() => navigate("/encuestas/encuestas-realizadas")}
            >
              <ClipboardList data-icon="inline-start" />
              Volver al listado
            </Button>
            <Button
              type="button"
              className="h-11"
              onClick={() => navigate("/encuestas/identificacion-paciente")}
            >
              <CirclePlus data-icon="inline-start" />
              Iniciar otra encuesta
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
