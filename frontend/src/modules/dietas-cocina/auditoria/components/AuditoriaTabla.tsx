import { useMemo } from "react"
import type { ComponentType } from "react"
import {
  Bookmark,
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
import type {
  CambioAuditoria,
  FilaAuditoria,
  ModuloAuditoria,
} from "@/modules/dietas-cocina/auditoria/datos/mockAuditoria"
import {
  MODULO_LABEL,
  avatarColorPorIniciales,
} from "@/modules/dietas-cocina/auditoria/lib/auditoriaEstilos"
import { cn } from "@/lib/utils"

interface AuditoriaTablaProps {
  filas: FilaAuditoria[]
  paginaDesde: number
  paginaHasta: number
  total: number
  onVerDetalle: (id: string) => void
}

const MODULO_ICONOS: Record<
  ModuloAuditoria,
  ComponentType<{ className?: string }>
> = {
  dietas: UtensilsCrossed,
  cocina: ChefHat,
  etiquetas: Tags,
  reportes: FileText,
  conciliacion: ClipboardList,
  parametros: Settings,
  usuarios: Users,
  inicio: Bookmark,
}

function CambiosCell({ cambios }: { cambios: CambioAuditoria }) {
  if (cambios.tipo === "texto") {
    return (
      <span className="text-xs text-muted-foreground">{cambios.texto}</span>
    )
  }

  return (
    <div className="space-y-0.5 text-xs">
      {cambios.lineas?.map((linea) => (
        <p
          key={`${linea.prefijo}-${linea.texto}`}
          className={cn(
            linea.prefijo === "-"
              ? "text-muted-foreground line-through"
              : "font-medium text-primary",
          )}
        >
          {linea.prefijo} {linea.texto}
        </p>
      ))}
    </div>
  )
}

export function AuditoriaTabla({
  filas,
  paginaDesde,
  paginaHasta,
  total,
  onVerDetalle,
}: AuditoriaTablaProps) {
  const columnas = useMemo<ColumnDef<FilaAuditoria>[]>(
    () => [
      {
        accessorKey: "fechaHora",
        header: () => (
          <span className="text-xs font-semibold tracking-wide uppercase">
            Fecha y hora
          </span>
        ),
        cell: ({ row }) => (
          <span className="text-xs tabular-nums text-muted-foreground">
            {row.original.fechaHora}
          </span>
        ),
      },
      {
        id: "usuario",
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
                  {usuario.rol}
                </p>
              </div>
            </div>
          )
        },
      },
      {
        id: "moduloAccion",
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
              <div>
                <p className="text-sm font-medium text-foreground">
                  {MODULO_LABEL[row.original.modulo]}
                </p>
                <p className="text-xs text-muted-foreground">
                  {row.original.accion}
                </p>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: "registroId",
        header: () => (
          <span className="text-xs font-semibold tracking-wide uppercase">
            Registro
          </span>
        ),
        cell: ({ row }) => (
          <button
            type="button"
            className="text-sm font-medium text-primary hover:underline"
            onClick={() => onVerDetalle(row.original.id)}
          >
            {row.original.registroId}
          </button>
        ),
      },
      {
        id: "cambios",
        header: () => (
          <span className="text-xs font-semibold tracking-wide uppercase">
            Cambios (Ant. vs Nuevo)
          </span>
        ),
        cell: ({ row }) => <CambiosCell cambios={row.original.cambios} />,
      },
      {
        accessorKey: "resultado",
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
        header: () => <span className="sr-only">Ver detalle</span>,
        cell: ({ row }) => (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
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

  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="p-0">
        <DataTable
          columns={columnas}
          data={filas}
          className="rounded-none border-0"
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
            <Button type="button" variant="outline" size="icon-sm" disabled>
              ‹
            </Button>
            <Button type="button" variant="default" size="icon-sm">
              1
            </Button>
            <Button type="button" variant="outline" size="icon-sm">
              2
            </Button>
            <Button type="button" variant="outline" size="icon-sm">
              3
            </Button>
            <Button type="button" variant="outline" size="icon-sm" disabled>
              ›
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
