import type { RutaDietasConfig } from "@/lib/configAccesoModulos"
import { RUTAS_DIETAS } from "@/lib/configAccesoModulos"
import { Switch } from "@/components/ui/switch"

interface PermisosRolFormProps {
  rutas: RutaDietasConfig[]
  onAlternar: (ruta: RutaDietasConfig, activo: boolean) => void
  disabled?: boolean
  idPrefix?: string
}

const GRUPOS_PERMISOS: {
  titulo: string
  rutas: RutaDietasConfig[]
}[] = [
  {
    titulo: "General",
    rutas: ["inicio"],
  },
  {
    titulo: "Clínica y nutrición",
    rutas: ["dietas", "dietas-tarifas", "conciliacion"],
  },
  {
    titulo: "Producción y despacho",
    rutas: ["cocina", "impresion-etiquetas"],
  },
  {
    titulo: "Logística en piso",
    rutas: ["recepcion-proveedor", "bandejas-piso"],
  },
  {
    titulo: "Indicadores",
    rutas: ["reportes-clinicos", "reportes-produccion"],
  },
  {
    titulo: "Administración",
    rutas: ["parametros", "auditoria", "usuarios"],
  },
]

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
      <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer text-sm">
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

function etiquetaRutaConfig(id: RutaDietasConfig): string {
  return RUTAS_DIETAS.find((ruta) => ruta.id === id)?.label ?? id
}

export function PermisosRolForm({
  rutas,
  onAlternar,
  disabled = false,
  idPrefix = "permiso",
}: PermisosRolFormProps) {
  return (
    <div className="space-y-4">
      {GRUPOS_PERMISOS.map((grupo) => (
        <div key={grupo.titulo} className="space-y-0.5">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {grupo.titulo}
          </p>
          {grupo.rutas.map((rutaId) => (
            <SwitchPermiso
              key={rutaId}
              id={`${idPrefix}-${rutaId}`}
              label={etiquetaRutaConfig(rutaId)}
              checked={rutas.includes(rutaId)}
              disabled={disabled || rutaId === "inicio"}
              onChange={(activo) => onAlternar(rutaId, activo)}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function alternarRutaPermiso(
  rutas: RutaDietasConfig[],
  ruta: RutaDietasConfig,
  activo: boolean,
): RutaDietasConfig[] {
  if (ruta === "inicio" && !activo) return rutas
  const set = new Set(rutas)
  if (activo) set.add(ruta)
  else set.delete(ruta)
  return Array.from(set) as RutaDietasConfig[]
}
