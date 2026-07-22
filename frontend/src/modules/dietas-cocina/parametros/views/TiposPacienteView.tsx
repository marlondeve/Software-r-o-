import { AlertTriangle } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CategoriasEdadTabla } from "@/modules/dietas-cocina/parametros/components/tipos-paciente/CategoriasEdadTabla"
import { SimuladorClasificacion } from "@/modules/dietas-cocina/parametros/components/tipos-paciente/SimuladorClasificacion"
import { mockTiposPaciente } from "@/modules/dietas-cocina/parametros/datos/mockTiposPaciente"

export function TiposPacienteView() {
  const data = mockTiposPaciente

  return (
    <>
      <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
        <AlertTriangle />
        <AlertTitle>Atención requerida</AlertTitle>
        <AlertDescription>{data.alertaSuperposicion}</AlertDescription>
      </Alert>

      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <CategoriasEdadTabla categorias={data.categorias} />
        <SimuladorClasificacion
          fechaNacimiento={data.simulador.fechaNacimiento}
          fechaReferencia={data.simulador.fechaReferencia}
          resultado={data.simulador.resultado}
        />
      </div>
    </>
  )
}
