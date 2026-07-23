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
import { ROLES_DIETAS } from "@/lib/configAccesoModulos"
import { demoToast } from "@/modules/dietas-cocina/lib/demoFeedback"
import type { RolDietas } from "@/modules/dietas-cocina/lib/roles"
import type { UsuarioModulo } from "@/modules/dietas-cocina/usuarios/datos/mockUsuarios"
import { ConfirmarAccionDialog } from "@/modules/dietas-cocina/usuarios/components/ConfirmarAccionDialog"
import { PermisosRolResumen } from "@/modules/dietas-cocina/usuarios/components/PermisosRolPopover"
import { validarCambioRol } from "@/modules/dietas-cocina/usuarios/lib/permisosValidaciones"

interface CambiarRolDialogProps {
  usuario: UsuarioModulo | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirmar: (usuarioId: string, rol: RolDietas) => void
  puedeGestionar: boolean
}

export function CambiarRolDialog({
  usuario,
  open,
  onOpenChange,
  onConfirmar,
  puedeGestionar,
}: CambiarRolDialogProps) {
  const [rolSeleccionado, setRolSeleccionado] = useState<RolDietas>("Nutricionista")
  const [confirmacionAbierta, setConfirmacionAbierta] = useState(false)

  useEffect(() => {
    if (usuario) setRolSeleccionado(usuario.rol)
  }, [usuario])

  const validacion = useMemo(() => {
    if (!usuario) return { valido: false }
    return validarCambioRol(usuario.rol, rolSeleccionado)
  }, [usuario, rolSeleccionado])

  function solicitarConfirmacion() {
    if (!usuario || !puedeGestionar) {
      demoToast("No tiene permisos para cambiar roles.")
      return
    }

    const resultado = validarCambioRol(usuario.rol, rolSeleccionado)
    if (!resultado.valido) {
      demoToast(resultado.mensaje ?? "Cambio de rol inválido.")
      return
    }

    setConfirmacionAbierta(true)
  }

  function aplicarCambio() {
    if (!usuario) return
    onConfirmar(usuario.id, rolSeleccionado)
    onOpenChange(false)
    demoToast(`Rol de ${usuario.nombre} actualizado a ${rolSeleccionado}.`)
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
              value={rolSeleccionado}
              onValueChange={(value) => setRolSeleccionado(value as RolDietas)}
              disabled={!puedeGestionar}
            >
              <SelectTrigger className="w-full bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES_DIETAS.map((rol) => (
                  <SelectItem key={rol} value={rol}>
                    {rol}
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
          usuario ? (
            <>
              <p>
                Cambiará el rol de <strong>{usuario.nombre}</strong> de{" "}
                <strong>{usuario.rol}</strong> a{" "}
                <strong>{rolSeleccionado}</strong>.
              </p>
              <div className="rounded-lg border bg-muted/30 px-3 py-2">
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Permisos del nuevo rol
                </p>
                <PermisosRolResumen rol={rolSeleccionado} className="mt-1 block" />
              </div>
            </>
          ) : null
        }
        onConfirmar={aplicarCambio}
      />
    </>
  )
}
