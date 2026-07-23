import { useMemo, useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  History,
  ListFilter,
  MoreVertical,
  Search,
  UserPlus,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import { Input } from "@/components/ui/input"
import { ContactoBadge } from "@/modules/encuestas/indicadores/components/brechas/ContactoBadge"
import { EstadoBrechaBadge } from "@/modules/encuestas/indicadores/components/brechas/EstadoBrechaBadge"
import { MotivoBrechaChip } from "@/modules/encuestas/indicadores/components/brechas/MotivoBrechaChip"
import type { FilaBrecha } from "@/modules/encuestas/indicadores/datos/mockAnalisisBrechas"

const REGISTROS_POR_PAGINA = 3

function numerosPagina(total: number) {
  return Array.from({ length: total }, (_, index) => index + 1).slice(0, 3)
}

interface BrechasTablaProps {
  filas: FilaBrecha[]
  totalRegistros: number
}

export function BrechasTabla({ filas, totalRegistros }: BrechasTablaProps) {
  const [busqueda, setBusqueda] = useState("")
  const [paginaActual, setPaginaActual] = useState(1)

  const filasFiltradas = useMemo(() => {
    if (!busqueda) return filas
    const texto = busqueda.toLowerCase()
    return filas.filter(
      (fila) =>
        fila.nombre.toLowerCase().includes(texto) || fila.documento.includes(texto),
    )
  }, [filas, busqueda])

  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / REGISTROS_POR_PAGINA))

  const columnas = useMemo<ColumnDef<FilaBrecha>[]>(
    () => [
      {
        id: "paciente",
        header: "Paciente",
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <Avatar>
              <AvatarFallback className="text-xs font-medium">
                {row.original.iniciales}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground">{row.original.nombre}</p>
              <p className="text-xs text-muted-foreground">ID: {row.original.documento}</p>
            </div>
          </div>
        ),
      },
      {
        id: "fecha",
        header: "Fecha / Servicio",
        cell: ({ row }) => (
          <div>
            <p className="text-foreground">{row.original.fecha}</p>
            <p className="text-xs text-muted-foreground">{row.original.servicio}</p>
          </div>
        ),
      },
      {
        accessorKey: "convenio",
        header: "Convenio",
        cell: ({ row }) => <span className="text-foreground">{row.original.convenio}</span>,
      },
      {
        id: "contacto",
        header: "Contacto",
        cell: ({ row }) => <ContactoBadge contacto={row.original.contacto} />,
      },
      {
        id: "gestion",
        header: "Gestión",
        cell: ({ row }) => (
          <div>
            <p className={row.original.gestionNombre ? "text-foreground" : "text-muted-foreground italic"}>
              {row.original.gestionNombre ?? "Sin asignar"}
            </p>
            <p className="text-xs text-muted-foreground">Intentos: {row.original.intentos}</p>
          </div>
        ),
      },
      {
        id: "motivo",
        header: "Motivo Brecha",
        cell: ({ row }) => (
          <MotivoBrechaChip motivo={row.original.motivo} tono={row.original.motivoTono} />
        ),
      },
      {
        id: "estado",
        header: "Estado",
        cell: ({ row }) => <EstadoBrechaBadge estado={row.original.estado} />,
      },
      {
        id: "acciones",
        header: () => <div className="text-right">Acciones</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            {row.original.estado === "en_gestion" && (
              <>
                <Button type="button" variant="ghost" size="icon" className="size-10" aria-label="Ver historial">
                  <History className="size-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="size-10" aria-label="Más acciones">
                  <MoreVertical className="size-4" />
                </Button>
              </>
            )}
            {row.original.estado === "pendiente" && (
              <>
                <Button type="button" variant="ghost" size="icon" className="size-10" aria-label="Asignar gestor">
                  <UserPlus className="size-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="size-10" aria-label="Más acciones">
                  <MoreVertical className="size-4" />
                </Button>
              </>
            )}
            {row.original.estado === "justificado" && (
              <Button type="button" variant="ghost" size="icon" className="size-10" aria-label="Ver detalle">
                <Eye className="size-4" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [],
  )

  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 border-b py-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          Detalle de Brechas
          <Badge variant="secondary">{totalRegistros} Registros</Badge>
        </CardTitle>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar paciente o ID..."
              className="h-11 w-64 bg-card pl-9"
            />
          </div>
          <Button type="button" variant="outline" size="icon" className="size-11" aria-label="Más filtros">
            <ListFilter className="size-4" />
          </Button>
        </div>
      </CardHeader>

      <DataTable
        columns={columnas}
        data={filasFiltradas}
        className="rounded-none border-0"
        emptyMessage="No hay brechas que coincidan con la búsqueda."
      />

      <div className="flex flex-col gap-3 border-t border-border bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {filasFiltradas.length === 0 ? 0 : 1} a {filasFiltradas.length} de{" "}
          {totalRegistros} registros
        </p>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-10"
            disabled={paginaActual <= 1}
            onClick={() => setPaginaActual((p) => p - 1)}
            aria-label="Página anterior"
          >
            <ChevronLeft className="size-4" />
          </Button>

          {numerosPagina(totalPaginas).map((numero) => (
            <Button
              key={numero}
              type="button"
              variant={numero === paginaActual ? "default" : "outline"}
              size="icon"
              className="size-10"
              onClick={() => setPaginaActual(numero)}
            >
              {numero}
            </Button>
          ))}

          {totalPaginas > 3 && <span className="px-1 text-muted-foreground">…</span>}

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-10"
            disabled={paginaActual >= totalPaginas}
            onClick={() => setPaginaActual((p) => p + 1)}
            aria-label="Página siguiente"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
