import { useMemo } from "react"
import { History, Phone } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import { EstadoLlamadaBadge } from "@/modules/encuestas/captura-telefonica/components/EstadoLlamadaBadge"
import type { FilaCapturaTelefonica } from "@/modules/encuestas/captura-telefonica/datos/mockCapturaTelefonica"
import { cn } from "@/lib/utils"

interface CapturaTelefonicaTablaProps {
  filas: FilaCapturaTelefonica[]
  onLlamar: (fila: FilaCapturaTelefonica) => void
}

export function CapturaTelefonicaTabla({
  filas,
  onLlamar,
}: CapturaTelefonicaTablaProps) {
  const columnas = useMemo<ColumnDef<FilaCapturaTelefonica>[]>(
    () => [
      {
        id: "estado",
        header: "Estado",
        cell: ({ row }) => (
          <EstadoLlamadaBadge
            estado={row.original.estado}
            horaReintento={row.original.horaReintento}
          />
        ),
      },
      {
        id: "paciente",
        header: "Paciente / ID",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">
              {row.original.paciente}
            </p>
            <p className="text-xs text-muted-foreground">
              {row.original.documento}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "telefono",
        header: "Teléfono",
        cell: ({ row }) => (
          <span className="tabular-nums text-foreground">
            {row.original.telefono}
          </span>
        ),
      },
      {
        id: "atencion",
        header: "Atención / Fecha",
        cell: ({ row }) => (
          <div>
            <p className="text-foreground">{row.original.servicio}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.fechaCita} - {row.original.especialidad}
            </p>
          </div>
        ),
      },
      {
        id: "intentos",
        header: "Intentos",
        cell: ({ row }) => {
          const { intentos, intentosMax, ultimoIntento, estado } = row.original
          return (
            <div>
              <p
                className={cn(
                  "font-medium tabular-nums",
                  estado === "no_contesta" || estado === "rechazo"
                    ? "text-destructive"
                    : "text-foreground",
                )}
              >
                {intentos}/{intentosMax}
              </p>
              {ultimoIntento && (
                <p className="text-xs text-muted-foreground">
                  Últ. {ultimoIntento}
                </p>
              )}
            </div>
          )
        },
      },
      {
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) => {
          const fila = row.original
          return (
            <div className="flex items-center justify-end gap-2">
              {(fila.estado === "reintento" || fila.estado === "no_contesta") && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-11"
                  aria-label="Ver historial de intentos"
                  onClick={() => onLlamar(fila)}
                >
                  <History className="size-4" />
                </Button>
              )}
              <Button
                type="button"
                variant={fila.estado === "no_contesta" ? "outline" : "default"}
                className="h-11 text-sm"
                onClick={() => onLlamar(fila)}
              >
                <Phone data-icon="inline-start" />
                {fila.estado === "no_contesta" ? "Reintentar" : "Llamar"}
              </Button>
            </div>
          )
        },
      },
    ],
    [onLlamar],
  )

  return (
    <DataTable
      columns={columnas}
      data={filas}
      emptyMessage="No hay pacientes que coincidan con los filtros."
    />
  )
}
