import type { RutaDietasConfig } from "@/lib/configAccesoModulos"
import { RUTAS_DIETAS } from "@/lib/configAccesoModulos"
import { Switch } from "@/components/ui/switch"

interface PermisosRolFormProps {
  rutas: RutaDietasConfig[]
  onAlternar: (ruta: RutaDietasConfig, activo: boolean) => void
  disabled?: boolean
  idPrefix?: string
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

export function PermisosRolForm({
  rutas,
  onAlternar,
  disabled = false,
  idPrefix = "permiso",
}: PermisosRolFormProps) {
  return (
    <>
      {RUTAS_DIETAS.map((ruta) => (
        <SwitchPermiso
          key={ruta.id}
          id={`${idPrefix}-${ruta.id}`}
          label={ruta.label}
          checked={rutas.includes(ruta.id)}
          disabled={disabled || ruta.id === "inicio"}
          onChange={(activo) => onAlternar(ruta.id, activo)}
        />
      ))}
    </>
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
