import { useEffect, useMemo, useState } from "react"
import { Settings2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { useConfigAccesoModulos } from "@/hooks/useConfigAccesoModulos"
import {
  RUTAS_DIETAS,
  alternarPermisoRutaDietas,
  type RutaDietasConfig,
} from "@/lib/configAccesoModulos"
import { demoToast } from "@/modules/dietas-cocina/lib/demoFeedback"
import type { RolDietas } from "@/modules/dietas-cocina/lib/roles"
import { ConfirmarAccionDialog } from "@/modules/dietas-cocina/usuarios/components/ConfirmarAccionDialog"
import {
  diffPermisosRol,
  etiquetaRuta,
  validarPermisosRol,
} from "@/modules/dietas-cocina/usuarios/lib/permisosValidaciones"

interface EditarPermisosRolDialogProps {
  rol: RolDietas
  puedeGestionar: boolean
}

function SwitchPermiso({
  id,
  label,
  checked,
  onChange,
  disabled,
}: {
  id: string
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <label
        htmlFor={id}
        className="min-w-0 flex-1 cursor-pointer text-sm"
      >
        {label}
      </label>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
        aria-label={label}
      />
    </div>
  )
}

export function EditarPermisosRolDialog({
  rol,
  puedeGestionar,
}: EditarPermisosRolDialogProps) {
  const { config, actualizar } = useConfigAccesoModulos()
  const [dialogAbierto, setDialogAbierto] = useState(false)
  const [confirmacionAbierta, setConfirmacionAbierta] = useState(false)
  const [rutasPendientes, setRutasPendientes] = useState<RutaDietasConfig[]>([])

  const rutasActuales = config.permisosDietas[rol] ?? []

  useEffect(() => {
    if (dialogAbierto) {
      setRutasPendientes([...rutasActuales])
    }
  }, [dialogAbierto, rutasActuales])

  const diff = useMemo(
    () => diffPermisosRol(rutasActuales, rutasPendientes),
    [rutasActuales, rutasPendientes],
  )

  const validacion = useMemo(
    () => validarPermisosRol(rutasPendientes),
    [rutasPendientes],
  )

  function alternarRuta(ruta: RutaDietasConfig, activo: boolean) {
    if (ruta === "inicio" && !activo) return
    setRutasPendientes((prev) => {
      const set = new Set(prev)
      if (activo) set.add(ruta)
      else set.delete(ruta)
      return Array.from(set) as RutaDietasConfig[]
    })
  }

  function solicitarConfirmacion() {
    if (diff.sinCambios) {
      demoToast("No hay cambios en los permisos de este rol.")
      return
    }

    const resultado = validarPermisosRol(rutasPendientes)
    if (!resultado.valido) {
      demoToast(resultado.mensaje ?? "Permisos inválidos.")
      return
    }

    setConfirmacionAbierta(true)
  }

  function aplicarCambios() {
    let nextConfig = config
    for (const ruta of diff.agregadas) {
      nextConfig = alternarPermisoRutaDietas(nextConfig, rol, ruta, true)
    }
    for (const ruta of diff.removidas) {
      nextConfig = alternarPermisoRutaDietas(nextConfig, rol, ruta, false)
    }
    actualizar(nextConfig)
    setDialogAbierto(false)
    demoToast(`Permisos del rol ${rol} actualizados.`)
  }

  if (!puedeGestionar) {
    return (
      <Button type="button" variant="outline" size="sm" disabled>
        <Settings2 data-icon="inline-start" />
        Editar
      </Button>
    )
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setDialogAbierto(true)}
      >
        <Settings2 data-icon="inline-start" />
        Editar
      </Button>

      <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Permisos — {rol}</DialogTitle>
            <DialogDescription>
              Configure las secciones habilitadas. Los cambios requieren
              confirmación.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-72 rounded-lg border px-4 py-2">
            {RUTAS_DIETAS.map((ruta) => (
              <SwitchPermiso
                key={ruta.id}
                id={`${rol}-${ruta.id}-dialog`}
                label={ruta.label}
                checked={rutasPendientes.includes(ruta.id)}
                disabled={ruta.id === "inicio"}
                onChange={(activo) => alternarRuta(ruta.id, activo)}
              />
            ))}
          </ScrollArea>

          {!validacion.valido && validacion.mensaje && (
            <p className="text-sm text-destructive">{validacion.mensaje}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogAbierto(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={diff.sinCambios || !validacion.valido}
              onClick={solicitarConfirmacion}
            >
              Revisar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmarAccionDialog
        open={confirmacionAbierta}
        onOpenChange={setConfirmacionAbierta}
        titulo="Confirmar cambio de permisos"
        advertencia={validacion.advertencia}
        confirmarLabel="Aplicar permisos"
        descripcion={
          <>
            <p>
              Está a punto de modificar los permisos del rol{" "}
              <strong>{rol}</strong>.
            </p>
            {diff.agregadas.length > 0 && (
              <div>
                <p className="font-medium text-foreground">Se habilitará:</p>
                <ul className="mt-1 list-disc pl-5">
                  {diff.agregadas.map((ruta) => (
                    <li key={ruta}>{etiquetaRuta(ruta)}</li>
                  ))}
                </ul>
              </div>
            )}
            {diff.removidas.length > 0 && (
              <div>
                <p className="font-medium text-foreground">Se revocará:</p>
                <ul className="mt-1 list-disc pl-5">
                  {diff.removidas.map((ruta) => (
                    <li key={ruta}>{etiquetaRuta(ruta)}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        }
        onConfirmar={aplicarCambios}
      />
    </>
  )
}
