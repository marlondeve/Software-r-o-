import type { FilaConciliacion } from "@/modules/dietas-cocina/types/reconciliation"
import { useMemo } from "react"
import { Eye, PencilLine, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EstadoConciliacionBadge } from "@/modules/dietas-cocina/conciliacion/components/EstadoConciliacionBadge"
import { CocinaCantidadCelda } from "@/modules/dietas-cocina/conciliacion/components/CocinaCantidadCelda"
import {
  claseDiferenciaCantidad,
  claseDiferenciaEconomica,
  conciliacionColores,
  filaRequiereAtencion,
  textoDiferenciaEconomica,
} from "@/modules/dietas-cocina/conciliacion/lib/conciliacionEstilos"
import { CONCILIACION_FILTROS_UI } from "@/modules/dietas-cocina/config/conciliacion-ui"
import { formatearMonedaCOP } from "@/modules/dietas-cocina/lib/resolverTarifaDieta"
import { cn } from "@/lib/utils"

const ORDEN_COMIDAS = [
  "Desayuno",
  "Almuerzo",
  "Cena",
  "Merienda mañana",
  "Merienda tarde",
  "Merienda noche",
]

interface ConciliacionTablaProps {
  filas: FilaConciliacion[]
  busqueda: string
  onBusquedaChange: (value: string) => void
  onVerDetalle: (id: string) => void
  puedeEditarCocina?: boolean
  guardandoCocinaId?: string | null
  onGuardarCantidadCocina?: (fila: FilaConciliacion, cantidad: number) => Promise<void>
}

function subtotal(filas: FilaConciliacion[]) {
  return {
    sistema: filas.reduce((acc, f) => acc + f.cantidadSistema, 0),
    cocina: filas.every((f) => f.cantidadCocina === null)
      ? null
      : filas.reduce((acc, f) => acc + (f.cantidadCocina ?? 0), 0),
    valorSistema: filas.reduce((acc, f) => acc + f.valorSistema, 0),
    valorCocina: filas.every((f) => f.valorCocina === null)
      ? null
      : filas.reduce((acc, f) => acc + (f.valorCocina ?? 0), 0),
  }
}

export function ConciliacionTabla({
  filas,
  busqueda,
  onBusquedaChange,
  onVerDetalle,
  puedeEditarCocina = false,
  guardandoCocinaId = null,
  onGuardarCantidadCocina,
}: ConciliacionTablaProps) {
  const bloques = useMemo(() => {
    const porComida = new Map<string, FilaConciliacion[]>()
    for (const fila of filas) {
      const lista = porComida.get(fila.comida) ?? []
      lista.push(fila)
      porComida.set(fila.comida, lista)
    }
    const titulos = [
      ...ORDEN_COMIDAS.filter((c) => porComida.has(c)),
      ...[...porComida.keys()].filter((c) => !ORDEN_COMIDAS.includes(c)),
    ]
    return titulos.map((titulo) => ({ titulo, lineas: porComida.get(titulo) ?? [] }))
  }, [filas])

  const total = subtotal(filas)

  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between border-b py-3">
        <div>
          <CardTitle className="text-sm font-semibold">Planilla FCR</CardTitle>
          {puedeEditarCocina && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Digite la cantidad de cocina en cada fila y pulse Enter para comparar.
            </p>
          )}
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder={CONCILIACION_FILTROS_UI.busquedaPlaceholder}
            className="h-8 bg-muted/50 pl-9 shadow-none"
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-52">Tipo dietas</TableHead>
              <TableHead className="text-right">Tarifa</TableHead>
              <TableHead className="text-right">Sistema</TableHead>
              <TableHead className="text-right">Cocina</TableHead>
              <TableHead className="text-right">Dif. cantidad</TableHead>
              <TableHead className="text-right">Dif. económica</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          {bloques.map((bloque) => {
            const seccion = subtotal(bloque.lineas)
            return (
              <TableBody key={bloque.titulo}>
                <TableRow className="bg-foreground/90 hover:bg-foreground/90">
                  <TableCell
                    colSpan={8}
                    className="py-2 text-xs font-semibold uppercase tracking-wide text-background"
                  >
                    {bloque.titulo}
                  </TableCell>
                </TableRow>
                {bloque.lineas.map((fila) => (
                  <TableRow
                    key={fila.id}
                    className={filaRequiereAtencion(fila) ? conciliacionColores.alertaFila : undefined}
                  >
                    <TableCell className="font-medium">{fila.etiquetaPlanilla}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fila.tarifa > 0 ? formatearMonedaCOP(fila.tarifa) : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fila.cantidadSistema}
                    </TableCell>
                    <TableCell className="text-right">
                      <CocinaCantidadCelda
                        fila={fila}
                        editable={puedeEditarCocina && !!onGuardarCantidadCocina}
                        guardando={guardandoCocinaId === fila.id}
                        onGuardar={(cantidad) => onGuardarCantidadCocina!(fila, cantidad)}
                      />
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right tabular-nums font-medium",
                        claseDiferenciaCantidad(fila) || "text-foreground",
                      )}
                    >
                      {fila.cantidadCocina === null
                        ? "—"
                        : fila.diferenciaCantidad > 0
                          ? `+${fila.diferenciaCantidad}`
                          : fila.diferenciaCantidad}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right tabular-nums font-medium",
                        claseDiferenciaEconomica(fila) || "text-foreground",
                      )}
                    >
                      {textoDiferenciaEconomica(fila)}
                    </TableCell>
                    <TableCell>
                      <EstadoConciliacionBadge estado={fila.estado} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onVerDetalle(fila.id)}
                        aria-label="Ver detalle de conciliación"
                      >
                        {fila.estado === "conciliado-manual" ? (
                          <PencilLine className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/70 font-semibold">
                  <TableCell colSpan={2}>Subtotal {bloque.titulo.toLowerCase()}</TableCell>
                  <TableCell className="text-right tabular-nums">{seccion.sistema}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {seccion.cocina === null ? "—" : seccion.cocina}
                  </TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell colSpan={2} />
                </TableRow>
              </TableBody>
            )
          })}
          <TableFooter>
            <TableRow className="bg-emerald-600/15 font-semibold text-foreground">
              <TableCell colSpan={2}>Total</TableCell>
              <TableCell className="text-right tabular-nums">{total.sistema}</TableCell>
              <TableCell className="text-right tabular-nums">
                {total.cocina === null ? "—" : total.cocina}
              </TableCell>
              <TableCell />
              <TableCell className="text-right tabular-nums text-emerald-800 dark:text-emerald-300">
                {total.valorCocina === null
                  ? formatearMonedaCOP(total.valorSistema)
                  : formatearMonedaCOP(total.valorCocina)}
              </TableCell>
              <TableCell colSpan={2} />
            </TableRow>
          </TableFooter>
        </Table>
        {filas.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            No hay líneas de conciliación para los filtros aplicados.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
