import { useState } from "react"
import { Calculator } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DatePickerFromString } from "@/components/ui/date-picker"
import { Label } from "@/components/ui/label"
import type { CategoriaEdad } from "@/modules/dietas-cocina/parametros/datos/mockTiposPaciente"
import {
  clasificarEdadPaciente,
  type ResultadoClasificacion,
} from "@/modules/dietas-cocina/parametros/lib/clasificarEdadPaciente"

interface SimuladorClasificacionProps {
  fechaNacimiento: string
  fechaReferencia: string
  resultadoInicial: ResultadoClasificacion
  categorias: CategoriaEdad[]
}

export function SimuladorClasificacion({
  fechaNacimiento,
  fechaReferencia,
  resultadoInicial,
  categorias,
}: SimuladorClasificacionProps) {
  const [nacimiento, setNacimiento] = useState(fechaNacimiento)
  const [referencia, setReferencia] = useState(fechaReferencia)
  const [resultado, setResultado] = useState<ResultadoClasificacion>(
    resultadoInicial,
  )

  function simular() {
    const calculado = clasificarEdadPaciente(nacimiento, referencia, categorias)
    if (calculado) {
      setResultado(calculado)
      return
    }
    setResultado({
      edadCalculada: "—",
      categoria: "Sin categoría",
      regla: "Fechas inválidas o referencia anterior al nacimiento",
    })
  }

  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardHeader className="border-b py-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Calculator className="size-4 text-primary" />
          Simulador de Clasificación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 py-4">
        <div className="space-y-1.5">
          <Label htmlFor="fecha-nacimiento">Fecha de nacimiento</Label>
          <DatePickerFromString
            id="fecha-nacimiento"
            value={nacimiento}
            onChange={setNacimiento}
            className="bg-card"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="fecha-referencia">Fecha de referencia/actual</Label>
          <DatePickerFromString
            id="fecha-referencia"
            value={referencia}
            onChange={setReferencia}
            className="bg-card"
          />
        </div>

        <Button type="button" variant="outline" className="w-full" onClick={simular}>
          Simular
        </Button>

        <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
          <div>
            <p className="text-xs text-muted-foreground">Edad calculada</p>
            <p className="text-sm font-medium text-foreground">
              {resultado.edadCalculada}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Categoría asignada</p>
            <p className="text-sm font-semibold text-primary">
              {resultado.categoria}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Regla aplicada</p>
            <p className="text-sm font-medium text-foreground">
              {resultado.regla}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
