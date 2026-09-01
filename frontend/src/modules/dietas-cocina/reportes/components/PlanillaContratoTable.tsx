import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatearMonedaCOP } from "@/modules/dietas-cocina/lib/resolverTarifaDieta"

export type LineaPlanillaContrato = {
  tipo: string
  suministradas: number
  contrato: number
  valorTotal: number
}

export type BloquePlanillaContrato = {
  titulo: string
  lineas: LineaPlanillaContrato[]
}

function formatearEntero(n: number): string {
  return Math.round(n).toLocaleString("es-CO")
}

function subtotal(lineas: LineaPlanillaContrato[]): LineaPlanillaContrato {
  return {
    tipo: "Subtotal",
    suministradas: lineas.reduce((acc, l) => acc + l.suministradas, 0),
    contrato: 0,
    valorTotal: lineas.reduce((acc, l) => acc + l.valorTotal, 0),
  }
}

export function PlanillaContratoTable({
  bloques,
}: {
  bloques: BloquePlanillaContrato[]
}) {
  const total = subtotal(bloques.flatMap((b) => b.lineas))

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="min-w-56">Tipo dietas</TableHead>
          <TableHead className="text-right">Suministradas</TableHead>
          <TableHead className="text-right">Contrato</TableHead>
          <TableHead className="text-right">Valor total</TableHead>
        </TableRow>
      </TableHeader>
      {bloques.map((bloque) => {
        const seccion = subtotal(bloque.lineas)
        return (
          <TableBody key={bloque.titulo}>
            <TableRow className="bg-foreground/90 hover:bg-foreground/90">
              <TableCell
                colSpan={4}
                className="py-2 text-xs font-semibold uppercase tracking-wide text-background"
              >
                {bloque.titulo}
              </TableCell>
            </TableRow>
            {bloque.lineas.map((linea) => (
              <TableRow key={`${bloque.titulo}-${linea.tipo}`}>
                <TableCell className="font-medium">{linea.tipo}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatearEntero(linea.suministradas)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {linea.contrato > 0 ? formatearMonedaCOP(linea.contrato) : "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatearMonedaCOP(linea.valorTotal)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-muted/70 font-semibold">
              <TableCell>Subtotal {bloque.titulo.toLowerCase()}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatearEntero(seccion.suministradas)}
              </TableCell>
              <TableCell />
              <TableCell className="text-right tabular-nums">
                {formatearMonedaCOP(seccion.valorTotal)}
              </TableCell>
            </TableRow>
          </TableBody>
        )
      })}
      <TableFooter>
        <TableRow className="bg-emerald-600/15 font-semibold text-foreground">
          <TableCell>Total suministradas</TableCell>
          <TableCell className="text-right tabular-nums">
            {formatearEntero(total.suministradas)}
          </TableCell>
          <TableCell />
          <TableCell className="text-right tabular-nums text-emerald-800 dark:text-emerald-300">
            {formatearMonedaCOP(total.valorTotal)}
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}
