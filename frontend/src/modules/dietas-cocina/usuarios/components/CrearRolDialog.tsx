import type { RutaDietasConfig } from "@/lib/configAccesoModulos"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { CapacidadEtiquetas } from "@/modules/dietas-cocina/types/enums"
import { demoToast } from "@/modules/dietas-cocina/lib/demoFeedback"
import { crearRol } from "@/modules/dietas-cocina/api/services/usuarios.service"
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
  CAPACIDADES_ETIQUETAS,
  CAPACIDADES_BANDEJAS_PISO,
} from "@/modules/dietas-cocina/etiquetas/lib/permisosEtiquetas"
import {
  diffPermisosRol,
  etiquetaRuta,
  validarPermisosRol,
} from "@/modules/dietas-cocina/usuarios/lib/permisosValidaciones"
import { rutasToPermisosRecord } from "@/modules/dietas-cocina/usuarios/lib/permisosApiBridge"

function etiquetaCapacidad(id: CapacidadEtiquetas): string {
  return CAPACIDADES_ETIQUETAS.find((item) => item.id === id)?.label ?? id
}

interface CrearRolDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  nombresExistentes: string[]
  apiActiva: boolean
  onRolCreado: () => void
}

export function CrearRolDialog({
  open,
  onOpenChange,
  nombresExistentes,
  apiActiva,
  onRolCreado,
}: CrearRolDialogProps) {
  const [nombre, setNombre] = useState("")
  const [rutas, setRutas] = useState<RutaDietasConfig[]>(["inicio"])
  const [capacidades, setCapacidades] = useState<CapacidadEtiquetas[]>([
    ...CAPACIDADES_BANDEJAS_PISO,
  ])
  const [confirmacionAbierta, setConfirmacionAbierta] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const validacion = useMemo(() => validarPermisosRol(rutas), [rutas])

  const nombreNormalizado = nombre.trim()
  const nombreDuplicado = nombresExistentes.some(
    (item) => item.toLowerCase() === nombreNormalizado.toLowerCase(),
  )

  function cerrarDialogo() {
    setNombre("")
    setRutas(["inicio"])
    setCapacidades([...CAPACIDADES_BANDEJAS_PISO])
    onOpenChange(false)
  }

  function solicitarConfirmacion() {
    if (nombreNormalizado.length < 3) {
      demoToast("El nombre del rol debe tener al menos 3 caracteres.", "error")
      return
    }
    if (nombreDuplicado) {
      demoToast("Ya existe un rol con ese nombre.", "error")
      return
    }
    if (!validacion.valido) {
      demoToast(validacion.mensaje ?? "Permisos inválidos.", "error")
      return
    }
    setConfirmacionAbierta(true)
  }

  async function aplicarCreacion() {
    if (!apiActiva) {
      demoToast("La creación de roles requiere conexión con el API.", "error")
      return
    }

    setGuardando(true)
    try {
      await crearRol({
        nombre: nombreNormalizado,
        permisos: rutasToPermisosRecord(rutas),
        capacidadesEtiquetas: rutas.includes("bandejas-piso") ? capacidades : [],
      })
      demoToast(`Rol "${nombreNormalizado}" creado correctamente.`, "success")
      onRolCreado()
      cerrarDialogo()
    } catch (error) {
      demoToast(
        error instanceof Error ? error.message : "No se pudo crear el rol.",
        "error",
      )
    } finally {
      setGuardando(false)
    }
  }

  const diff = diffPermisosRol([], rutas)

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!value) cerrarDialogo()
          else onOpenChange(value)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Crear rol</DialogTitle>
            <DialogDescription>
              Defina un nombre y las secciones habilitadas para el nuevo rol.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="crear-rol-nombre">Nombre del rol</Label>
              <Input
                id="crear-rol-nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Supervisor de cocina"
                className="bg-card"
              />
            </div>

            <ScrollArea className="max-h-72 rounded-lg border px-4 py-2">
              <PermisosRolForm
                rutas={rutas}
                idPrefix="crear-rol"
                onAlternar={(ruta, activo) =>
                  setRutas((prev) => alternarRutaPermiso(prev, ruta, activo))
                }
              />
              {rutas.includes("bandejas-piso") && (
                <CapacidadesEtiquetasForm
                  capacidades={capacidades}
                  idPrefix="crear-rol-cap"
                  soloGrupo="bandejas"
                  onAlternar={(capacidad, activo) =>
                    setCapacidades((prev) =>
                      alternarCapacidadEtiquetaLista(prev, capacidad, activo),
                    )
                  }
                />
              )}
            </ScrollArea>

            {!validacion.valido && validacion.mensaje && (
              <p className="text-sm text-destructive">{validacion.mensaje}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={cerrarDialogo}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={
                guardando ||
                nombreNormalizado.length < 3 ||
                nombreDuplicado ||
                !validacion.valido
              }
              onClick={solicitarConfirmacion}
            >
              {guardando ? "Creando…" : "Revisar rol"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmarAccionDialog
        open={confirmacionAbierta}
        onOpenChange={setConfirmacionAbierta}
        titulo="Confirmar creación de rol"
        advertencia={validacion.advertencia}
        confirmarLabel="Crear rol"
        descripcion={
          <>
            <p>
              Creará el rol <strong>{nombreNormalizado}</strong> con las
              secciones seleccionadas.
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
            {capacidades.length > 0 && (
              <div>
                <p className="font-medium text-foreground">Flujos de bandejas:</p>
                <ul className="mt-1 list-disc pl-5">
                  {capacidades.map((capacidad) => (
                    <li key={capacidad}>{etiquetaCapacidad(capacidad)}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        }
        onConfirmar={aplicarCreacion}
      />
    </>
  )
}
