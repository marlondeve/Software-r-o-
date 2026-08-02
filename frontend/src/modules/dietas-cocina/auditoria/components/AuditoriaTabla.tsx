import type { CambioAuditoria, FilaAuditoria } from "@/modules/dietas-cocina/types/audit"
import type { ModuloAuditoria } from "@/modules/dietas-cocina/types/enums"
import { useMemo } from "react"
import type { ComponentType } from "react"
import {
  Bookmark,
  BookOpen,
  ChefHat,
  ClipboardList,
  Eye,
  FileText,
  Settings,
  Tags,
  Users,
  UtensilsCrossed,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import { ResultadoAuditoriaBadge } from "@/modules/dietas-cocina/auditoria/components/ResultadoAuditoriaBadge"
import {
  acortarRegistroId,
  etiquetaAccion,
} from "@/modules/dietas-cocina/auditoria/lib/auditoriaCatalogo"
import {
  MODULO_LABEL,
  avatarColorPorIniciales,
} from "@/modules/dietas-cocina/auditoria/lib/auditoriaEstilos"
import { formatearFechaHoraEnCadena } from "@/modules/dietas-cocina/parametros/lib/formatoHora"
import { cn } from "@/lib/utils"

interface AuditoriaTablaProps {
  filas: FilaAuditoria[]
  paginaDesde: number
  paginaHasta: number
  total: number
  paginaActual: number
  totalPaginas: number
  onCambiarPagina: (pagina: number) => void
  onVerDetalle: (id: string) => void
}

const MODULO_ICONOS: Record<
  ModuloAuditoria,
  ComponentType<{ className?: string }>
> = {
  dietas: UtensilsCrossed,
  catalogo: BookOpen,
  cocina: ChefHat,
  etiquetas: Tags,
  reportes: FileText,
  conciliacion: ClipboardList,
  parametros: Settings,
  usuarios: Users,
  inicio: Bookmark,
}

function resumenDesdeCambios(cambios: CambioAuditoria): string {
  if (cambios.resumen) return cambios.resumen
  if (cambios.tipo === "texto") return cambios.texto ?? "—"
  const primera = cambios.lineas?.[0]
  if (!primera) return "—"
  if (cambios.lineas!.length === 1) return primera.texto
  return `${primera.texto} (+${cambios.lineas!.length - 1} más)`
}

export function AuditoriaTabla({
  filas,
  paginaDesde,
  paginaHasta,
  total,
  paginaActual,
  totalPaginas,
  onCambiarPagina,
  onVerDetalle,
}: AuditoriaTablaProps) {
  const columnas = useMemo<ColumnDef<FilaAuditoria>[]>(
    () => [
      {
        accessorKey: "fechaHora",
        meta: { headerClassName: "w-[130px]", cellClassName: "w-[130px]" },
        header: () => (
          <span className="text-xs font-semibold tracking-wide uppercase">
            Fecha y hora
          </span>
        ),
        cell: ({ row }) => (
          <span className="text-xs tabular-nums text-muted-foreground">
            {formatearFechaHoraEnCadena(row.original.fechaHora)}
          </span>
        ),
      },
      {
        id: "usuario",
        meta: { headerClassName: "w-[140px]", cellClassName: "w-[140px]" },
        header: () => (
          <span className="text-xs font-semibold tracking-wide uppercase">
            Usuario
          </span>
        ),
        cell: ({ row }) => {
          const { usuario } = row.original
          return (
            <div className="flex items-center gap-2">
              <Avatar size="sm">
                <AvatarFallback
                  className={avatarColorPorIniciales(usuario.iniciales)}
                >
                  {usuario.iniciales}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {usuario.nombre}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {usuario.esSistema ? "Sistema" : usuario.rol}
                </p>
              </div>
            </div>
          )
        },
      },
      {
        id: "moduloAccion",
        meta: { headerClassName: "w-[150px]", cellClassName: "w-[150px]" },
        header: () => (
          <span className="text-xs font-semibold tracking-wide uppercase">
            Módulo / Acción
          </span>
        ),
        cell: ({ row }) => {
          const Icon = MODULO_ICONOS[row.original.modulo]
          return (
            <div className="flex items-start gap-2">
              <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {MODULO_LABEL[row.original.modulo]}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {etiquetaAccion(row.original.accion)}
                </p>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: "registroId",
        meta: { headerClassName: "w-[100px]", cellClassName: "w-[100px]" },
        header: () => (
          <span className="text-xs font-semibold tracking-wide uppercase">
            Registro
          </span>
        ),
        cell: ({ row }) => (
          <button
            type="button"
            className="truncate text-sm font-medium text-primary hover:underline"
            title={row.original.registroId}
            onClick={() => onVerDetalle(row.original.id)}
          >
            {acortarRegistroId(row.original.registroId)}
          </button>
        ),
      },
      {
        id: "resumen",
        meta: { headerClassName: "min-w-0", cellClassName: "min-w-0 max-w-[200px]" },
        header: () => (
          <span className="text-xs font-semibold tracking-wide uppercase">
            Resumen
          </span>
        ),
        cell: ({ row }) => {
          const resumen = resumenDesdeCambios(row.original.cambios)
          return (
            <span
              className="block truncate text-xs text-muted-foreground"
              title={resumen}
            >
              {resumen}
            </span>
          )
        },
      },
      {
        accessorKey: "resultado",
        meta: { headerClassName: "w-[90px]", cellClassName: "w-[90px]" },
        header: () => (
          <span className="text-xs font-semibold tracking-wide uppercase">
            Resultado
          </span>
        ),
        cell: ({ row }) => (
          <ResultadoAuditoriaBadge resultado={row.original.resultado} />
        ),
      },
      {
        id: "accion",
        meta: {
          headerClassName: "sticky right-0 z-10 w-10 bg-card",
          cellClassName: "sticky right-0 z-10 w-10 bg-card",
        },
        header: () => <span className="sr-only">Ver detalle</span>,
        cell: ({ row }) => (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0"
            onClick={() => onVerDetalle(row.original.id)}
            aria-label={`Ver detalle de ${row.original.codigoAuditoria}`}
          >
            <Eye className="size-4" />
          </Button>
        ),
      },
    ],
    [onVerDetalle],
  )

  const paginasVisibles = useMemo(() => {
    const paginas: number[] = []
    for (let i = 1; i <= totalPaginas; i += 1) {
      paginas.push(i)
    }
    return paginas
  }, [totalPaginas])

  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="p-0">
        <DataTable
          columns={columnas}
          data={filas}
          className={cn(
            "rounded-none border-0",
            "[&_data-slot=table]]:w-full [&_data-slot=table]]:table-fixed",
          )}
          emptyMessage="No hay eventos de auditoría para los filtros aplicados."
        />
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
          <p className="text-xs text-muted-foreground">
            Mostrando{" "}
            <span className="font-medium text-foreground">
              {paginaDesde}-{paginaHasta}
            </span>{" "}
            de{" "}
            <span className="font-medium text-foreground">
              {total.toLocaleString("es-CO")}
            </span>{" "}
            registros
          </p>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={paginaActual <= 1}
              onClick={() => onCambiarPagina(paginaActual - 1)}
            >
              ‹
            </Button>
            {paginasVisibles.map((numero) => (
              <Button
                key={numero}
                type="button"
                variant={numero === paginaActual ? "default" : "outline"}
                size="icon-sm"
                onClick={() => onCambiarPagina(numero)}
              >
                {numero}
              </Button>
            ))}
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={paginaActual >= totalPaginas}
              onClick={() => onCambiarPagina(paginaActual + 1)}
            >
              ›
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
