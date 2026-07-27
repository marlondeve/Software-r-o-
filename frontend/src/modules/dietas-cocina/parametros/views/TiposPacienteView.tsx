import { AlertTriangle } from "lucide-react"
import { Loader2 } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CategoriasEdadTabla } from "@/modules/dietas-cocina/parametros/components/tipos-paciente/CategoriasEdadTabla"
import { SimuladorClasificacion } from "@/modules/dietas-cocina/parametros/components/tipos-paciente/SimuladorClasificacion"
import { useParametrosTiposPaciente } from "@/modules/dietas-cocina/parametros/context/ParametrosTiposPacienteContext"
import { mockTiposPaciente } from "@/modules/dietas-cocina/parametros/datos/mockTiposPaciente"
import {
  detectarSuperposicionCategorias,
  mensajeSuperposicionCategorias,
} from "@/modules/dietas-cocina/parametros/lib/validarCategoriasEdad"

export function TiposPacienteView() {
  const data = mockTiposPaciente
  const { categorias, cargando, editarCategoria, eliminarCategoria } =
    useParametrosTiposPaciente()
  const haySuperposicion = detectarSuperposicionCategorias(categorias)

  if (cargando) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Cargando categorías de edad…
      </div>
    )
  }

  return (
    <>
      {haySuperposicion && (
        <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
          <AlertTriangle />
          <AlertTitle>Atención requerida</AlertTitle>
          <AlertDescription>{mensajeSuperposicionCategorias()}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <CategoriasEdadTabla
          categorias={categorias}
          onEditar={editarCategoria}
          onEliminar={eliminarCategoria}
        />
        <SimuladorClasificacion
          fechaNacimiento={data.simulador.fechaNacimiento}
          fechaReferencia={data.simulador.fechaReferencia}
          resultadoInicial={data.simulador.resultado}
          categorias={categorias}
        />
      </div>
    </>
  )
}
