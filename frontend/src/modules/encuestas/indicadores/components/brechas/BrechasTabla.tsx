import { useMemo, useState } from "react"
import {
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
import { TablaPaginacion } from "@/components/shared/TablaPaginacion"
import { usePaginacionTabla } from "@/lib/usePaginacionTabla"
import { ContactoBadge } from "@/modules/encuestas/indicadores/components/brechas/ContactoBadge"
import { EstadoBrechaBadge } from "@/modules/encuestas/indicadores/components/brechas/EstadoBrechaBadge"
import { MotivoBrechaChip } from "@/modules/encuestas/indicadores/components/brechas/MotivoBrechaChip"
import type { FilaBrecha } from "@/modules/encuestas/types/indicators"

interface BrechasTablaProps {
  filas: FilaBrecha[]
  totalRegistros: number
}

export function BrechasTabla({ filas, totalRegistros }: BrechasTablaProps) {
  const [busqueda, setBusqueda] = useState("")

  const filasFiltradas = useMemo(() => {
    if (!busqueda) return filas
    const texto = busqueda.toLowerCase()
    return filas.filter(
      (fila) =>
        fila.nombre.toLowerCase().includes(texto) || fila.documento.includes(texto),
    )
  }, [filas, busqueda])

  const paginacion = usePaginacionTabla(filasFiltradas, { resetKey: busqueda })

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
        data={paginacion.filasPagina}
        className="rounded-none border-0"
        emptyMessage="No hay brechas que coincidan con la búsqueda."
      />

      <TablaPaginacion
        paginaDesde={paginacion.paginaDesde}
        paginaHasta={paginacion.paginaHasta}
        total={paginacion.total}
        paginaActual={paginacion.paginaActual}
        totalPaginas={paginacion.totalPaginas}
        onCambiarPagina={paginacion.setPaginaActual}
      />
    </Card>
  )
}
