import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Lock, Mail, Shield } from "lucide-react"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { useLocation, useNavigate } from "react-router-dom"
import { z } from "zod"

import { ClinicaLogo } from "@/components/layout/ClinicaLogo"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CambiarPasswordForm } from "@/features/autenticacion/components/CambiarPasswordForm"
import { useAuth } from "@/features/autenticacion/hooks/useAuth"
import {
  authInstitucionalDisponible,
  type ModoLoginAuth,
} from "@/services/authService"
import {
  esRutaDeModulo,
  obtenerDestinoPostLogin,
  usuarioEsAdministrador,
  usuarioTieneAcceso,
} from "@/lib/modulos"

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "El correo institucional es obligatorio.")
    .email("Ingrese un correo institucional válido."),
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
  const [modoLogin, setModoLogin] = useState<ModoLoginAuth>("demo")
  const loginInstitucionalDisponible = authInstitucionalDisponible()

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(data: LoginFormValues) {
    setError(null)
    setMensajeExito(null)
    setEnviando(true)

    try {
      const sesion = await iniciarSesion(data.email, data.password, modoLogin)
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
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-5 flex justify-center">
          <ClinicaLogo className="h-11" />
        </div>

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-foreground">BITAL</h1>
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

              {loginInstitucionalDisponible && (
                <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
                  <Label className="text-sm font-medium">Tipo de acceso</Label>
                  <RadioGroup
                    value={modoLogin}
                    onValueChange={(value) => setModoLogin(value as ModoLoginAuth)}
                    className="gap-2"
                  >
                    <div className="flex items-start gap-2">
                      <RadioGroupItem value="demo" id="login-modo-demo" className="mt-0.5" />
                      <Label htmlFor="login-modo-demo" className="cursor-pointer font-normal">
                        <span className="font-medium">Pruebas (demo)</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          Cualquier contraseña. Use prefijos como admin@, nutricionista@,
                          enfermera@.
                        </span>
                      </Label>
                    </div>
                    <div className="flex items-start gap-2">
                      <RadioGroupItem
                        value="institucional"
                        id="login-modo-institucional"
                        className="mt-0.5"
                      />
                      <Label
                        htmlFor="login-modo-institucional"
                        className="cursor-pointer font-normal"
                      >
                        <span className="font-medium">Institucional (API)</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          Valida contra usuarios del módulo con contraseña real.
                        </span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              <FieldGroup className="gap-4">
                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="login-email">
                        Correo institucional
                      </FieldLabel>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          {...field}
                          id="login-email"
                          type="email"
                          placeholder="nombre@clinicadelrio.com.co"
                          autoComplete="email"
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
                {enviando
                  ? "Iniciando sesión…"
                  : modoLogin === "institucional"
                    ? "Iniciar sesión (API)"
                    : "Iniciar sesión (demo)"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="cambiar" className="mt-0 space-y-4">
            {loginInstitucionalDisponible ? (
              <>
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
              </>
            ) : (
              <Alert>
                <AlertDescription className="text-sm">
                  Cambiar contraseña requiere login institucional (API activa).
                </AlertDescription>
              </Alert>
            )}
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
    </main>
  )
}
