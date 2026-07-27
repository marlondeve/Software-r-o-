import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Lock, User } from "lucide-react"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { cambiarPasswordSesion } from "@/services/authService"

const cambiarPasswordSchema = z
  .object({
    usuario: z
      .string()
      .min(1, "El usuario es obligatorio.")
      .min(3, "El usuario debe tener al menos 3 caracteres."),
    passwordActual: z.string().min(1, "La contraseña actual es obligatoria."),
    passwordNueva: z
      .string()
      .min(8, "La nueva contraseña debe tener al menos 8 caracteres."),
    confirmarPassword: z.string().min(1, "Confirme la nueva contraseña."),
  })
  .refine((data) => data.passwordNueva === data.confirmarPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmarPassword"],
  })
  .refine((data) => data.passwordActual !== data.passwordNueva, {
    message: "La nueva contraseña debe ser diferente a la actual.",
    path: ["passwordNueva"],
  })

type CambiarPasswordFormValues = z.infer<typeof cambiarPasswordSchema>

interface CambiarPasswordFormProps {
  onExito?: (mensaje: string) => void
}

export function CambiarPasswordForm({ onExito }: CambiarPasswordFormProps) {
  const [mostrarActual, setMostrarActual] = useState(false)
  const [mostrarNueva, setMostrarNueva] = useState(false)
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const form = useForm<CambiarPasswordFormValues>({
    resolver: zodResolver(cambiarPasswordSchema),
    defaultValues: {
      usuario: "",
      passwordActual: "",
      passwordNueva: "",
      confirmarPassword: "",
    },
  })

  async function onSubmit(data: CambiarPasswordFormValues) {
    setError(null)
    setEnviando(true)
    try {
      const mensaje = await cambiarPasswordSesion(
        data.usuario,
        data.passwordActual,
        data.passwordNueva,
      )
      form.reset()
      onExito?.(mensaje)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo cambiar la contraseña.",
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <FieldGroup className="gap-4">
        <Controller
          name="usuario"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="cambio-usuario">Usuario</FieldLabel>
              <div className="relative">
                <User className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  {...field}
                  id="cambio-usuario"
                  type="text"
                  autoComplete="username"
                  className="h-9 rounded-full pl-10"
                />
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="passwordActual"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="cambio-actual">Contraseña actual</FieldLabel>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  {...field}
                  id="cambio-actual"
                  type={mostrarActual ? "text" : "password"}
                  autoComplete="current-password"
                  className="h-9 rounded-full px-10"
                />
                <button
                  type="button"
                  onClick={() => setMostrarActual((v) => !v)}
                  className="absolute top-1/2 right-4 -translate-y-1/2 text-muted-foreground"
                  aria-label={mostrarActual ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {mostrarActual ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="passwordNueva"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="cambio-nueva">Nueva contraseña</FieldLabel>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  {...field}
                  id="cambio-nueva"
                  type={mostrarNueva ? "text" : "password"}
                  autoComplete="new-password"
                  className="h-9 rounded-full px-10"
                />
                <button
                  type="button"
                  onClick={() => setMostrarNueva((v) => !v)}
                  className="absolute top-1/2 right-4 -translate-y-1/2 text-muted-foreground"
                  aria-label={mostrarNueva ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {mostrarNueva ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="confirmarPassword"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="cambio-confirmar">Confirmar nueva contraseña</FieldLabel>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  {...field}
                  id="cambio-confirmar"
                  type={mostrarConfirmar ? "text" : "password"}
                  autoComplete="new-password"
                  className="h-9 rounded-full px-10"
                />
                <button
                  type="button"
                  onClick={() => setMostrarConfirmar((v) => !v)}
                  className="absolute top-1/2 right-4 -translate-y-1/2 text-muted-foreground"
                  aria-label={mostrarConfirmar ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {mostrarConfirmar ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      <Button
        type="submit"
        disabled={enviando}
        className="h-9 w-full rounded-full text-sm font-semibold"
      >
        {enviando ? "Guardando…" : "Cambiar contraseña"}
      </Button>
    </form>
  )
}
