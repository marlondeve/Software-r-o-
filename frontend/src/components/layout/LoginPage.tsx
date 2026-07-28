import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Lock, Shield, User } from "lucide-react"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { useLocation, useNavigate } from "react-router-dom"
import { z } from "zod"

import { ClinicaLogo } from "@/components/layout/ClinicaLogo"
import { AppBrandName } from "@/components/layout/AppBrandName"
import { AppLegalFooter } from "@/components/layout/AppLegalFooter"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CambiarPasswordForm } from "@/features/autenticacion/components/CambiarPasswordForm"
import { useAuth } from "@/features/autenticacion/hooks/useAuth"
import {
  esRutaDeModulo,
  obtenerDestinoPostLogin,
  usuarioEsAdministrador,
  usuarioTieneAcceso,
} from "@/lib/modulos"

const loginSchema = z.object({
  usuario: z
    .string()
    .min(1, "El usuario es obligatorio.")
    .min(3, "El usuario debe tener al menos 3 caracteres."),
  password: z.string().min(1, "La contraseña es obligatoria."),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { iniciarSesion } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [tabActiva, setTabActiva] = useState("login")

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      usuario: "",
      password: "",
    },
  })

  async function onSubmit(data: LoginFormValues) {
    setError(null)
    setMensajeExito(null)
    setEnviando(true)

    try {
      const sesion = await iniciarSesion(data.usuario, data.password)
      const origen = (location.state as { from?: string } | null)?.from
      const moduloOrigen = origen ? esRutaDeModulo(origen) : null
      const origenAdministracion =
        origen?.startsWith("/administracion") &&
        usuarioEsAdministrador(sesion)

      const destino =
        origen &&
        ((moduloOrigen && usuarioTieneAcceso(sesion, moduloOrigen)) ||
          origenAdministracion)
          ? origen
          : obtenerDestinoPostLogin(sesion)

      navigate(destino, { replace: true })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible iniciar sesión. Verifique sus credenciales.",
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-background px-4 py-8">
      <div className="flex flex-1 items-center justify-center">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-5 flex justify-center">
          <ClinicaLogo className="h-11" />
        </div>

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-foreground">
            <AppBrandName as="span" />
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Acceso seguro para personal autorizado
          </p>
        </div>

        <Tabs
          value={tabActiva}
          onValueChange={(value) => {
            setTabActiva(value)
            setError(null)
            setMensajeExito(null)
          }}
        >
          <TabsList className="mb-4 grid w-full grid-cols-2">
            <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
            <TabsTrigger value="cambiar">Cambiar contraseña</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-0">
            <form
              id="login-form"
              className="space-y-4"
              onSubmit={form.handleSubmit(onSubmit)}
              noValidate
            >
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
                      <FieldLabel htmlFor="login-usuario">Usuario</FieldLabel>
                      <div className="relative">
                        <User className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          {...field}
                          id="login-usuario"
                          type="text"
                          placeholder="Ingrese su usuario"
                          autoComplete="username"
                          aria-invalid={fieldState.invalid}
                          className="h-9 rounded-full pl-10"
                        />
                      </div>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="password"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="login-password">Contraseña</FieldLabel>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          {...field}
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          aria-invalid={fieldState.invalid}
                          className="h-9 rounded-full px-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((value) => !value)}
                          className="absolute top-1/2 right-4 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                          aria-label={
                            showPassword
                              ? "Ocultar contraseña"
                              : "Mostrar contraseña"
                          }
                        >
                          {showPassword ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      </div>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>

              <Button
                type="submit"
                disabled={enviando}
                className="h-9 w-full rounded-full text-sm font-semibold"
              >
                {enviando ? "Iniciando sesión…" : "Iniciar sesión"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="cambiar" className="mt-0 space-y-4">
            {mensajeExito && (
              <Alert>
                <AlertDescription>{mensajeExito}</AlertDescription>
              </Alert>
            )}
            <CambiarPasswordForm
              onExito={(mensaje) => {
                setMensajeExito(mensaje)
                setError(null)
              }}
            />
          </TabsContent>
        </Tabs>

        <Alert className="mt-6 border-primary/20 bg-primary/5">
          <Shield className="size-4 text-primary" />
          <AlertDescription className="text-sm text-muted-foreground">
            Esta es una plataforma de uso institucional. Sus acciones son
            auditadas para garantizar la seguridad del paciente.
          </AlertDescription>
        </Alert>
      </div>
      </div>

      <AppLegalFooter className="mt-6 shrink-0 pb-2" />
    </main>
  )
}
