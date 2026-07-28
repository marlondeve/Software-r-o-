import type { RolModuloDto } from "@/modules/dietas-cocina/types/api-dtos"
import type { UsuarioModulo } from "@/modules/dietas-cocina/types/users"
import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { demoToast } from "@/modules/dietas-cocina/lib/demoFeedback"
import { ConfirmarAccionDialog } from "@/modules/dietas-cocina/usuarios/components/ConfirmarAccionDialog"
import { PermisosRolResumen } from "@/modules/dietas-cocina/usuarios/components/PermisosRolPopover"
import { validarCambioRol } from "@/modules/dietas-cocina/usuarios/lib/permisosValidaciones"

interface CambiarRolDialogProps {
  usuario: UsuarioModulo | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirmar: (usuarioId: string, rolModuloId: string) => void
  puedeGestionar: boolean
  apiActiva?: boolean
  roles: RolModuloDto[]
  permisosApi?: Array<{ rol?: string; permisos?: Record<string, boolean> }>
}

export function CambiarRolDialog({
  usuario,
  open,
  onOpenChange,
  onConfirmar,
  puedeGestionar,
  apiActiva = false,
  roles,
  permisosApi,
}: CambiarRolDialogProps) {
  const [rolSeleccionadoId, setRolSeleccionadoId] = useState("")
  const [confirmacionAbierta, setConfirmacionAbierta] = useState(false)

  useEffect(() => {
    if (usuario) setRolSeleccionadoId(usuario.rolId)
  }, [usuario])

  const rolSeleccionado = roles.find((rol) => rol.id === rolSeleccionadoId)

  const validacion = useMemo(() => {
    if (!usuario || !rolSeleccionado?.nombre) return { valido: false }
    return validarCambioRol(usuario.rol, rolSeleccionado.nombre)
  }, [usuario, rolSeleccionado?.nombre])

  function solicitarConfirmacion() {
    if (!usuario || !puedeGestionar) {
      demoToast("No tiene permisos para cambiar roles.")
      return
    }

    if (!rolSeleccionado?.nombre) return

    const resultado = validarCambioRol(usuario.rol, rolSeleccionado.nombre)
    if (!resultado.valido) {
      demoToast(resultado.mensaje ?? "Cambio de rol inválido.")
      return
    }

    setConfirmacionAbierta(true)
  }

  function aplicarCambio() {
    if (!usuario || !rolSeleccionadoId) return
    onConfirmar(usuario.id, rolSeleccionadoId)
    onOpenChange(false)
    demoToast(
      `Rol de ${usuario.nombre} actualizado a ${rolSeleccionado?.nombre ?? "nuevo rol"}.`,
      apiActiva ? "success" : undefined,
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar rol</DialogTitle>
            <DialogDescription>
              {usuario
                ? `Asigne un nuevo rol a ${usuario.nombre}. El cambio requiere confirmación.`
                : "Seleccione un rol para el usuario."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Select
              value={rolSeleccionadoId}
              onValueChange={setRolSeleccionadoId}
              disabled={!puedeGestionar}
            >
              <SelectTrigger className="w-full bg-card">
                <SelectValue placeholder="Seleccione un rol" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((rol) => (
                  <SelectItem key={rol.id} value={rol.id ?? ""}>
                    {rol.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {usuario && (
              <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Rol actual
                </p>
                <p className="font-medium">{usuario.rol}</p>
              </div>
            )}

            {!validacion.valido && validacion.mensaje && (
              <p className="text-sm text-destructive">{validacion.mensaje}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={!usuario || !puedeGestionar || !validacion.valido}
              onClick={solicitarConfirmacion}
            >
              Revisar cambio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmarAccionDialog
        open={confirmacionAbierta}
        onOpenChange={setConfirmacionAbierta}
        titulo="Confirmar cambio de rol"
        advertencia={validacion.advertencia}
        confirmarLabel="Aplicar rol"
        descripcion={
          usuario && rolSeleccionado?.nombre ? (
            <>
              <p>
                Cambiará el rol de <strong>{usuario.nombre}</strong> de{" "}
                <strong>{usuario.rol}</strong> a{" "}
                <strong>{rolSeleccionado.nombre}</strong>.
              </p>
              <div className="rounded-lg border bg-muted/30 px-3 py-2">
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Permisos del nuevo rol
                </p>
                <PermisosRolResumen
                  rol={rolSeleccionado.nombre}
                  permisosApi={permisosApi}
                  className="mt-1 block"
                />
              </div>
            </>
          ) : null
        }
        onConfirmar={aplicarCambio}
      />
    </>
  )
}
