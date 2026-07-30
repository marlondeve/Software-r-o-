import type { PermisoRolDto } from "@/modules/dietas-cocina/types/api-dtos"
import { useState } from "react"
import { PencilLine, Settings2, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { eliminarRol } from "@/modules/dietas-cocina/api/services/usuarios.service"
import { demoToast } from "@/modules/dietas-cocina/lib/demoFeedback"
import { ConfirmarAccionDialog } from "@/modules/dietas-cocina/usuarios/components/ConfirmarAccionDialog"
import { EditarNombreRolDialog } from "@/modules/dietas-cocina/usuarios/components/EditarNombreRolDialog"
import { EditarPermisosRolDialog } from "@/modules/dietas-cocina/usuarios/components/EditarPermisosRolDialog"

interface RolAccionesCellProps {
  rolId: string
  rolNombre: string
  esSistema: boolean
  puedeGestionar: boolean
  apiActiva: boolean
  permisosApi: PermisoRolDto[]
  nombresExistentes: string[]
  onRolesActualizados: () => void
  onPermisosActualizados: (permisos: PermisoRolDto[]) => void
}

export function RolAccionesCell({
  rolId,
  rolNombre,
  esSistema,
  puedeGestionar,
  apiActiva,
  permisosApi,
  nombresExistentes,
  onRolesActualizados,
  onPermisosActualizados,
}: RolAccionesCellProps) {
  const [dialogRenombrarAbierto, setDialogRenombrarAbierto] = useState(false)
  const [dialogEliminarAbierto, setDialogEliminarAbierto] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  const rolPersonalizado = !esSistema

  async function confirmarEliminacion() {
    if (!apiActiva) {
      demoToast("Eliminar roles requiere conexión con el API.", "error")
      return
    }

    setEliminando(true)
    try {
      await eliminarRol(rolId)
      demoToast(`Rol "${rolNombre}" eliminado.`, "success")
      onRolesActualizados()
    } catch (error) {
      demoToast(
        error instanceof Error ? error.message : "No se pudo eliminar el rol.",
        "error",
      )
    } finally {
      setEliminando(false)
    }
  }

  if (!puedeGestionar) {
    return (
      <div className="flex justify-end gap-1">
        <Button type="button" variant="outline" size="sm" disabled>
          <Settings2 data-icon="inline-start" />
          Permisos
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-wrap justify-end gap-1">
        <EditarPermisosRolDialog
          rolId={rolId}
          rolNombre={rolNombre}
          puedeGestionar={puedeGestionar}
          apiActiva={apiActiva}
          permisosApi={permisosApi}
          onPermisosActualizados={onPermisosActualizados}
        />

        {rolPersonalizado && (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDialogRenombrarAbierto(true)}
            >
              <PencilLine data-icon="inline-start" />
              Renombrar
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10"
              disabled={eliminando}
              onClick={() => setDialogEliminarAbierto(true)}
            >
              <Trash2 data-icon="inline-start" />
              Eliminar
            </Button>
          </>
        )}
      </div>

      <EditarNombreRolDialog
        open={dialogRenombrarAbierto}
        onOpenChange={setDialogRenombrarAbierto}
        rolId={rolId}
        nombreActual={rolNombre}
        nombresExistentes={nombresExistentes}
        apiActiva={apiActiva}
        onRolRenombrado={onRolesActualizados}
      />

      <ConfirmarAccionDialog
        open={dialogEliminarAbierto}
        onOpenChange={setDialogEliminarAbierto}
        titulo="Eliminar rol"
        confirmarLabel={eliminando ? "Eliminando…" : "Eliminar rol"}
        destructivo
        advertencia="Esta acción no se puede deshacer."
        descripcion={
          <>
            <p>
              Eliminará el rol <strong>{rolNombre}</strong> y sus permisos
              asociados.
            </p>
            <p>
              Solo es posible si ningún usuario tiene asignado este rol.
            </p>
          </>
        }
        onConfirmar={() => void confirmarEliminacion()}
      />
    </>
  )
}
