import { useState, type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { useConfigAccesoModulos } from "@/hooks/useConfigAccesoModulos"
import {
  ROLES_DIETAS,
  ROLES_ENCUESTAS,
  RUTAS_DIETAS,
  RUTAS_ENCUESTAS,
  alternarAccesoModulo,
  alternarPermisoRutaDietas,
  alternarPermisoRutaEncuestas,
  type RolEncuestas,
} from "@/lib/configAccesoModulos"
import { modulosConfig } from "@/lib/modulos"
import type { RolDietas } from "@/modules/dietas-cocina/lib/roles"
import { cn } from "@/lib/utils"

interface ConfiguracionAccesoModulosDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function SwitchFila({
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
    <div
      className={cn(
        "flex items-center justify-between gap-4 px-3 py-3",
        disabled && "opacity-50",
      )}
    >
      <label
        htmlFor={id}
        className={cn(
          "min-w-0 flex-1 text-sm font-medium text-foreground",
          disabled ? "cursor-not-allowed" : "cursor-pointer",
        )}
      >
        {label}
      </label>
      <div className="shrink-0">
        <Switch
          id={id}
          checked={checked}
          disabled={disabled}
          onCheckedChange={onChange}
          aria-label={label}
        />
      </div>
    </div>
  )
}

function TabPanelScroll({ children }: { children: ReactNode }) {
  return (
    <ScrollArea className="mt-3 max-h-[50vh] overflow-hidden">
      <div className="space-y-4 pr-3">{children}</div>
    </ScrollArea>
  )
}

export function ConfiguracionAccesoModulosDialog({
  open,
  onOpenChange,
}: ConfiguracionAccesoModulosDialogProps) {
  const { config, actualizar, restablecer } = useConfigAccesoModulos()
  const [borrador, setBorrador] = useState(config)
  const [rolDietasActivo, setRolDietasActivo] = useState<RolDietas>("Nutricionista")
  const [rolEncuestasActivo, setRolEncuestasActivo] =
    useState<RolEncuestas>("Analista SIAO")

  function sincronizarAlAbrir(isOpen: boolean) {
    if (isOpen) setBorrador(config)
    onOpenChange(isOpen)
  }

  function guardar() {
    actualizar(borrador)
    onOpenChange(false)
  }

  function handleRestablecer() {
    const defaultConfig = restablecer()
    setBorrador(defaultConfig)
  }

  const rolDietasTieneAcceso = borrador.rolesConAcceso["dietas-cocina"].includes(
    rolDietasActivo,
  )
  const rolEncuestasTieneAcceso = borrador.rolesConAcceso.encuestas.includes(
    rolEncuestasActivo,
  )

  return (
    <Dialog open={open} onOpenChange={sincronizarAlAbrir}>
      <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Roles y permisos por módulo</DialogTitle>
          <DialogDescription>
            Define qué roles pueden acceder a cada módulo y qué secciones ven
            dentro de ellos.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="dietas-cocina" className="min-h-0 flex-1 overflow-hidden">
          <TabsList className="w-full">
            <TabsTrigger value="dietas-cocina" className="flex-1">
              {modulosConfig["dietas-cocina"].titulo}
            </TabsTrigger>
            <TabsTrigger value="encuestas" className="flex-1">
              {modulosConfig.encuestas.titulo}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dietas-cocina" className="overflow-hidden">
            <TabPanelScroll>
            <section>
              <h3 className="mb-2 text-sm font-medium text-foreground">
                Acceso al módulo
              </h3>
              <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
                {ROLES_DIETAS.map((rol) => (
                  <SwitchFila
                    key={rol}
                    id={`acceso-dietas-${rol}`}
                    label={rol}
                    checked={borrador.rolesConAcceso["dietas-cocina"].includes(rol)}
                    onChange={(activo) =>
                      setBorrador((prev) =>
                        alternarAccesoModulo(prev, "dietas-cocina", rol, activo),
                      )
                    }
                  />
                ))}
              </div>
            </section>

            <Separator />

            <section>
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-sm font-medium text-foreground">
                  Permisos por sección
                </h3>
                <Select
                  value={rolDietasActivo}
                  onValueChange={(v) => setRolDietasActivo(v as RolDietas)}
                >
                  <SelectTrigger className="h-8 w-40">
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
              </div>

              {!rolDietasTieneAcceso ? (
                <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                  Este rol no tiene acceso al módulo. Actívalo arriba para
                  configurar sus secciones.
                </p>
              ) : (
                <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
                  {RUTAS_DIETAS.map((ruta) => (
                    <SwitchFila
                      key={ruta.id}
                      id={`permiso-dietas-${rolDietasActivo}-${ruta.id}`}
                      label={ruta.label}
                      checked={(borrador.permisosDietas[rolDietasActivo] ?? []).includes(
                        ruta.id,
                      )}
                      onChange={(activo) =>
                        setBorrador((prev) =>
                          alternarPermisoRutaDietas(
                            prev,
                            rolDietasActivo,
                            ruta.id,
                            activo,
                          ),
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </section>
            </TabPanelScroll>
          </TabsContent>

          <TabsContent value="encuestas" className="overflow-hidden">
            <TabPanelScroll>
            <section>
              <h3 className="mb-2 text-sm font-medium text-foreground">
                Acceso al módulo
              </h3>
              <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
                {ROLES_ENCUESTAS.map((rol) => (
                  <SwitchFila
                    key={rol}
                    id={`acceso-encuestas-${rol}`}
                    label={rol}
                    checked={borrador.rolesConAcceso.encuestas.includes(rol)}
                    onChange={(activo) =>
                      setBorrador((prev) =>
                        alternarAccesoModulo(prev, "encuestas", rol, activo),
                      )
                    }
                  />
                ))}
              </div>
            </section>

            <Separator />

            <section>
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-sm font-medium text-foreground">
                  Permisos por sección
                </h3>
                <Select
                  value={rolEncuestasActivo}
                  onValueChange={(v) => setRolEncuestasActivo(v as RolEncuestas)}
                >
                  <SelectTrigger className="h-8 w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES_ENCUESTAS.map((rol) => (
                      <SelectItem key={rol} value={rol}>
                        {rol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!rolEncuestasTieneAcceso ? (
                <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                  Este rol no tiene acceso al módulo. Actívalo arriba para
                  configurar sus secciones.
                </p>
              ) : (
                <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
                  {RUTAS_ENCUESTAS.map((ruta) => (
                    <SwitchFila
                      key={ruta.id}
                      id={`permiso-encuestas-${rolEncuestasActivo}-${ruta.id}`}
                      label={ruta.label}
                      checked={(
                        borrador.permisosEncuestas[rolEncuestasActivo] ?? []
                      ).includes(ruta.id)}
                      onChange={(activo) =>
                        setBorrador((prev) =>
                          alternarPermisoRutaEncuestas(
                            prev,
                            rolEncuestasActivo,
                            ruta.id,
                            activo,
                          ),
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </section>
            </TabPanelScroll>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button type="button" variant="ghost" onClick={handleRestablecer}>
            Restablecer
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={guardar}>
              Guardar cambios
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
