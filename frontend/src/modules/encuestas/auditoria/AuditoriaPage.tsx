import { useMemo, useState } from "react"
import { Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AuditoriaDetalleSheet } from "@/modules/encuestas/auditoria/components/AuditoriaDetalleSheet"
import { AuditoriaTabla } from "@/modules/encuestas/auditoria/components/AuditoriaTabla"
import {
  ACCIONES_AUDITORIA,
  MODULOS_AUDITORIA,
  RANGOS_FECHA_AUDITORIA,
  mockAuditoriaEncuestas,
} from "@/modules/encuestas/auditoria/datos/mockAuditoriaEncuestas"
import type { FilaAuditoriaEncuesta } from "@/modules/encuestas/auditoria/datos/mockAuditoriaEncuestas"
import { DashboardPageHeader } from "@/modules/encuestas/inicio/components/DashboardPageHeader"

export function AuditoriaPage() {
  const data = mockAuditoriaEncuestas
  const [rangoFecha, setRangoFecha] = useState(RANGOS_FECHA_AUDITORIA[0])
  const [modulo, setModulo] = useState("todos")
  const [accion, setAccion] = useState("cualquiera")
  const [filaSeleccionada, setFilaSeleccionada] = useState<FilaAuditoriaEncuesta | null>(
    null,
  )
  const [sheetAbierto, setSheetAbierto] = useState(false)

  function abrirDetalle(fila: FilaAuditoriaEncuesta) {
    setFilaSeleccionada(fila)
    setSheetAbierto(true)
  }

  const filasFiltradas = useMemo(() => {
    return data.filas.filter((fila) => {
      if (modulo !== "todos" && fila.modulo !== modulo) return false
      if (accion !== "cualquiera" && fila.accion !== accion) return false
      return true
    })
  }, [data.filas, modulo, accion])

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        title="Registro de Auditoría"
        subtitle="Trazabilidad completa de acciones y modificaciones en el sistema."
        actions={
          <>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">Fecha y Hora</Label>
              <Select value={rangoFecha} onValueChange={setRangoFecha}>
                <SelectTrigger className="h-11 w-48 bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RANGOS_FECHA_AUDITORIA.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">Módulo</Label>
              <Select value={modulo} onValueChange={setModulo}>
                <SelectTrigger className="h-11 w-36 bg-card">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {MODULOS_AUDITORIA.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">Acción</Label>
              <Select value={accion} onValueChange={setAccion}>
                <SelectTrigger className="h-11 w-40 bg-card">
                  <SelectValue placeholder="Cualquiera" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cualquiera">Cualquiera</SelectItem>
                  {ACCIONES_AUDITORIA.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              className="h-11 self-end"
              onClick={() => window.alert("Exportando CSV...")}
            >
              <Download data-icon="inline-start" />
              Exportar CSV
            </Button>
          </>
        }
      />

      <AuditoriaTabla
        filas={filasFiltradas}
        totalRegistros={data.totalRegistros}
        onVerDetalle={abrirDetalle}
      />

      <AuditoriaDetalleSheet
        open={sheetAbierto}
        onOpenChange={setSheetAbierto}
        fila={filaSeleccionada}
      />
    </div>
  )
}
