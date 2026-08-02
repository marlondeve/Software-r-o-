import type { PermisoRolDto } from "@/modules/dietas-cocina/types/api-dtos"
import type { RutaDietasConfig } from "@/lib/configAccesoModulos"
import { useMemo, useState } from "react"
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
import { useConfigAccesoModulos } from "@/hooks/useConfigAccesoModulos"
import { alternarPermisoRutaDietas } from "@/lib/configAccesoModulos"
import { actualizarPermisosRol, obtenerPermisosRoles } from "@/modules/dietas-cocina/api/services/usuarios.service"
import { demoToast } from "@/modules/dietas-cocina/lib/demoFeedback"
import { ConfirmarAccionDialog } from "@/modules/dietas-cocina/usuarios/components/ConfirmarAccionDialog"
import {
  alternarRutaPermiso,
  PermisosRolForm,
} from "@/modules/dietas-cocina/usuarios/components/PermisosRolForm"
import {
  alternarCapacidadEtiquetaLista,
  CapacidadesEtiquetasForm,
} from "@/modules/dietas-cocina/usuarios/components/CapacidadesEtiquetasForm"
import {
  diffPermisosRol,
  etiquetaRuta,
  validarPermisosRol,
} from "@/modules/dietas-cocina/usuarios/lib/permisosValidaciones"
import {
  permisosPorRolDesdeApi,
  rutasToPermisosRecord,
} from "@/modules/dietas-cocina/usuarios/lib/permisosApiBridge"
import {
  CAPACIDADES_ETIQUETAS,
  CAPACIDADES_BANDEJAS_PISO,
  obtenerCapacidadesEtiquetas,
} from "@/modules/dietas-cocina/etiquetas/lib/permisosEtiquetas"
import type { CapacidadEtiquetas } from "@/modules/dietas-cocina/types/enums"

function etiquetaCapacidad(id: CapacidadEtiquetas): string {
  return CAPACIDADES_ETIQUETAS.find((item) => item.id === id)?.label ?? id
}

interface EditarPermisosRolDialogProps {
  rolId: string
  rolNombre: string
  puedeGestionar: boolean
  apiActiva?: boolean
  permisosApi?: PermisoRolDto[]
  onPermisosActualizados?: (permisos: PermisoRolDto[]) => void
}

export function EditarPermisosRolDialog({
  rolId,
  rolNombre,
  puedeGestionar,
  apiActiva = false,
  permisosApi = [],
  onPermisosActualizados,
}: EditarPermisosRolDialogProps) {
  const { config, actualizar } = useConfigAccesoModulos()
  const [dialogAbierto, setDialogAbierto] = useState(false)
  const [confirmacionAbierta, setConfirmacionAbierta] = useState(false)
  const [rutasPendientes, setRutasPendientes] = useState<RutaDietasConfig[]>([])
  const [capacidadesPendientes, setCapacidadesPendientes] = useState<
    CapacidadEtiquetas[]
  >([])

  const capacidadesActuales = useMemo(
    () => obtenerCapacidadesEtiquetas(rolNombre),
    [rolNombre, config.capacidadesEtiquetas],
  )

  const rutasActuales = useMemo(
    () =>
      apiActiva
        ? permisosPorRolDesdeApi(permisosApi, rolNombre)
        : config.permisosDietas[rolNombre] ?? [],
    [apiActiva, permisosApi, rolNombre, config.permisosDietas],
  )

  function abrirDialogo() {
    setRutasPendientes([...rutasActuales])
    const capsBandejasActuales = capacidadesActuales.filter((cap) =>
      CAPACIDADES_BANDEJAS_PISO.includes(cap),
    )
    const capsIniciales =
      capsBandejasActuales.length > 0
        ? [...capsBandejasActuales]
        : rutasActuales.includes("bandejas-piso")
          ? [...CAPACIDADES_BANDEJAS_PISO]
          : []
    setCapacidadesPendientes(capsIniciales)
    setDialogAbierto(true)
  }

  const diffCapacidades = useMemo(() => {
    const anteriores = new Set(capacidadesActuales)
    const nuevas = new Set(capacidadesPendientes)
    return {
      agregadas: capacidadesPendientes.filter((item) => !anteriores.has(item)),
      removidas: capacidadesActuales.filter((item) => !nuevas.has(item)),
      sinCambios:
        capacidadesActuales.length === capacidadesPendientes.length &&
        capacidadesActuales.every((item) => nuevas.has(item)),
    }
  }, [capacidadesActuales, capacidadesPendientes])

  const diff = useMemo(
    () => diffPermisosRol(rutasActuales, rutasPendientes),
    [rutasActuales, rutasPendientes],
  )

  const validacion = useMemo(
    () => validarPermisosRol(rutasPendientes),
    [rutasPendientes],
  )

  function solicitarConfirmacion() {
    if (diff.sinCambios && diffCapacidades.sinCambios) {
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
    if (apiActiva) {
      void actualizarPermisosRol(
        rolId,
        rutasToPermisosRecord(rutasPendientes),
        capacidadesPendientes,
      )
        .then(() => obtenerPermisosRoles())
        .then((actualizados) => {
          onPermisosActualizados?.(actualizados)
          actualizar({
            ...config,
            capacidadesEtiquetas: {
              ...config.capacidadesEtiquetas,
              [rolNombre]: [...capacidadesPendientes],
            },
          })
          setDialogAbierto(false)
          demoToast(`Permisos del rol ${rolNombre} actualizados.`, "success")
        })
        .catch((error) => {
          demoToast(
            error instanceof Error
              ? error.message
              : "No se pudieron actualizar los permisos.",
            "error",
          )
        })
      return
    }

    let nextConfig = config
    for (const ruta of diff.agregadas) {
      nextConfig = alternarPermisoRutaDietas(nextConfig, rolNombre, ruta, true)
    }
    for (const ruta of diff.removidas) {
      nextConfig = alternarPermisoRutaDietas(nextConfig, rolNombre, ruta, false)
    }
    nextConfig = {
      ...nextConfig,
      capacidadesEtiquetas: {
        ...nextConfig.capacidadesEtiquetas,
        [rolNombre]: [...capacidadesPendientes],
      },
    }
    actualizar(nextConfig)
    setDialogAbierto(false)
    demoToast(`Permisos del rol ${rolNombre} actualizados.`)
  }

  if (!puedeGestionar) {
    return (
      <Button type="button" variant="outline" size="sm" disabled>
        <Settings2 data-icon="inline-start" />
        Permisos
      </Button>
    )
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={abrirDialogo}
      >
        <Settings2 data-icon="inline-start" />
        Permisos
      </Button>

      <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Permisos — {rolNombre}</DialogTitle>
            <DialogDescription>
              Configure las secciones habilitadas. Los cambios requieren
              confirmación.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-72 rounded-lg border px-4 py-2">
            <PermisosRolForm
              rutas={rutasPendientes}
              idPrefix={`${rolId}-dialog`}
              onAlternar={(ruta, activo) =>
                setRutasPendientes((prev) => alternarRutaPermiso(prev, ruta, activo))
              }
            />
            {rutasPendientes.includes("bandejas-piso") && (
              <CapacidadesEtiquetasForm
                capacidades={capacidadesPendientes}
                idPrefix={`${rolId}-cap`}
                soloGrupo="bandejas"
                onAlternar={(capacidad, activo) =>
                  setCapacidadesPendientes((prev) =>
                    alternarCapacidadEtiquetaLista(prev, capacidad, activo),
                  )
                }
              />
            )}
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
              disabled={
                (diff.sinCambios && diffCapacidades.sinCambios) || !validacion.valido
              }
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
              <strong>{rolNombre}</strong>.
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
            {diffCapacidades.agregadas.length > 0 && (
              <div>
                <p className="font-medium text-foreground">Flujos de bandejas habilitados:</p>
                <ul className="mt-1 list-disc pl-5">
                  {diffCapacidades.agregadas.map((capacidad) => (
                    <li key={capacidad}>{etiquetaCapacidad(capacidad)}</li>
                  ))}
                </ul>
              </div>
            )}
            {diffCapacidades.removidas.length > 0 && (
              <div>
                <p className="font-medium text-foreground">Flujos de bandejas revocados:</p>
                <ul className="mt-1 list-disc pl-5">
                  {diffCapacidades.removidas.map((capacidad) => (
                    <li key={capacidad}>{etiquetaCapacidad(capacidad)}</li>
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
