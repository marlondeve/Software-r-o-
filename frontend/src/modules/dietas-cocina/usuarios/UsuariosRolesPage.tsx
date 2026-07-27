import type { UsuarioModulo } from "@/modules/dietas-cocina/types/users"
import { useEffect, useMemo, useState } from "react"
import { Plus, Shield, Users } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/features/autenticacion/hooks/useAuth"
import { DashboardPageHeader } from "@/modules/dietas-cocina/inicio/components/DashboardPageHeader"
import { obtenerRolDietas } from "@/modules/dietas-cocina/lib/roles"
import { demoToast } from "@/modules/dietas-cocina/lib/demoFeedback"
import { CambiarRolDialog } from "@/modules/dietas-cocina/usuarios/components/CambiarRolDialog"
import { NuevoUsuarioDialog } from "@/modules/dietas-cocina/usuarios/components/NuevoUsuarioDialog"
import { RestablecerClaveDialog } from "@/modules/dietas-cocina/usuarios/components/RestablecerClaveDialog"
import { RolesPermisosPanel } from "@/modules/dietas-cocina/usuarios/components/RolesPermisosPanel"
import { UsuariosFiltros } from "@/modules/dietas-cocina/usuarios/components/UsuariosFiltros"
import { UsuariosTabla } from "@/modules/dietas-cocina/usuarios/components/UsuariosTabla"
import { mockUsuariosDietas } from "@/modules/dietas-cocina/usuarios/datos/mockUsuarios"
import { usarApiDietasCocina } from "@/modules/dietas-cocina/api"
import { restablecerPasswordUsuario } from "@/api/authModulo.service"
import {
  crearUsuario as crearUsuarioApi,
  cambiarEstadoUsuario,
  cambiarRolUsuario,
  editarUsuario as editarUsuarioApi,
  listarUsuarios,
} from "@/modules/dietas-cocina/api/services/usuarios.service"
import type { RolDietas } from "@/modules/dietas-cocina/types/enums"
import { puedeGestionarUsuariosRoles } from "@/modules/dietas-cocina/usuarios/lib/permisosValidaciones"

const TAMANO_PAGINA_USUARIOS = 10

export function UsuariosRolesPage() {
  const { usuario: usuarioActual } = useAuth()
  const rolActual = obtenerRolDietas(usuarioActual)
  const puedeGestionar = puedeGestionarUsuariosRoles(rolActual)
  const apiActiva = usarApiDietasCocina()
  const filtrosUi = mockUsuariosDietas.filtros
  const [usuarios, setUsuarios] = useState<UsuarioModulo[]>(() =>
    apiActiva ? [] : mockUsuariosDietas.usuarios,
  )
  const [rolFiltro, setRolFiltro] = useState("todos")
  const [estadoFiltro, setEstadoFiltro] = useState("todos")
  const [paginaActual, setPaginaActual] = useState(1)
  const [usuarioRolEdit, setUsuarioRolEdit] = useState<UsuarioModulo | null>(
    null,
  )
  const [dialogRolAbierto, setDialogRolAbierto] = useState(false)
  const [dialogNuevoAbierto, setDialogNuevoAbierto] = useState(false)
  const [usuarioEdit, setUsuarioEdit] = useState<UsuarioModulo | null>(null)
  const [usuarioClaveRestablecida, setUsuarioClaveRestablecida] =
    useState<UsuarioModulo | null>(null)
  const [passwordTemporal, setPasswordTemporal] = useState("")
  const [mensajeClaveRestablecida, setMensajeClaveRestablecida] = useState("")
  const [dialogClaveAbierto, setDialogClaveAbierto] = useState(false)
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false)
  const [errorUsuarios, setErrorUsuarios] = useState<string | null>(null)

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((usuario) => {
      const coincideRol = rolFiltro === "todos" || usuario.rol === rolFiltro
      const coincideEstado =
        estadoFiltro === "todos" || usuario.estado === estadoFiltro
      return coincideRol && coincideEstado
    })
  }, [usuarios, rolFiltro, estadoFiltro])

  const totalFiltrados = usuariosFiltrados.length
  const totalPaginas = Math.max(
    1,
    Math.ceil(totalFiltrados / TAMANO_PAGINA_USUARIOS),
  )

  const usuariosPagina = useMemo(() => {
    const inicio = (paginaActual - 1) * TAMANO_PAGINA_USUARIOS
    return usuariosFiltrados.slice(inicio, inicio + TAMANO_PAGINA_USUARIOS)
  }, [usuariosFiltrados, paginaActual])

  const paginaDesde =
    totalFiltrados === 0
      ? 0
      : (paginaActual - 1) * TAMANO_PAGINA_USUARIOS + 1
  const paginaHasta = Math.min(
    paginaActual * TAMANO_PAGINA_USUARIOS,
    totalFiltrados,
  )

  useEffect(() => {
    if (!apiActiva) return
    setCargandoUsuarios(true)
    setErrorUsuarios(null)
    void listarUsuarios({
      rol: rolFiltro !== "todos" ? (rolFiltro as RolDietas) : undefined,
      estado: estadoFiltro !== "todos" ? estadoFiltro === "activo" : undefined,
      page: paginaActual,
      pageSize: TAMANO_PAGINA_USUARIOS,
    })
      .then((res) => setUsuarios(res.usuarios))
      .catch((error) => {
        setUsuarios([])
        setErrorUsuarios(
          error instanceof Error ? error.message : "No se pudieron cargar los usuarios.",
        )
      })
      .finally(() => setCargandoUsuarios(false))
  }, [apiActiva, rolFiltro, estadoFiltro, paginaActual])

  useEffect(() => {
    setPaginaActual(1)
  }, [rolFiltro, estadoFiltro])

  useEffect(() => {
    if (paginaActual > totalPaginas) {
      setPaginaActual(totalPaginas)
    }
  }, [paginaActual, totalPaginas])

  function abrirCambiarRol(usuario: UsuarioModulo) {
    if (!puedeGestionar) {
      demoToast("No tiene permisos para cambiar roles.")
      return
    }
    setUsuarioRolEdit(usuario)
    setDialogRolAbierto(true)
  }

  function confirmarCambioRol(usuarioId: string, rol: RolDietas) {
    if (apiActiva) {
      void cambiarRolUsuario(usuarioId, rol)
        .then(() => listarUsuarios({ page: 1, pageSize: 100 }))
        .then((res) => {
          setUsuarios(res.usuarios)
          demoToast("Rol actualizado correctamente.", "success")
        })
        .catch((error) => {
          demoToast(
            error instanceof Error ? error.message : "No se pudo cambiar el rol.",
            "error",
          )
        })
      return
    }
    setUsuarios((prev) =>
      prev.map((usuario) =>
        usuario.id === usuarioId ? { ...usuario, rol } : usuario,
      ),
    )
  }

  function toggleEstado(usuario: UsuarioModulo) {
    const nuevoEstado = usuario.estado === "activo" ? "inactivo" : "activo"
    if (apiActiva) {
      void cambiarEstadoUsuario(usuario.id, nuevoEstado === "activo")
        .then(() => {
          setUsuarios((prev) =>
            prev.map((item) =>
              item.id === usuario.id ? { ...item, estado: nuevoEstado } : item,
            ),
          )
          demoToast(
            `Usuario ${usuario.nombre} ${nuevoEstado === "activo" ? "activado" : "desactivado"}.`,
            "success",
          )
        })
        .catch((error) => {
          demoToast(
            error instanceof Error
              ? error.message
              : "No se pudo cambiar el estado del usuario.",
            "error",
          )
        })
      return
    }
    setUsuarios((prev) =>
      prev.map((item) =>
        item.id === usuario.id ? { ...item, estado: nuevoEstado } : item,
      ),
    )
  }

  function eliminarUsuario(usuario: UsuarioModulo) {
    setUsuarios((prev) => prev.filter((item) => item.id !== usuario.id))
  }

  function crearUsuarioHandler(datos: Omit<UsuarioModulo, "id">) {
    if (apiActiva) {
      void crearUsuarioApi(datos)
        .then((creado) => {
          setUsuarios((prev) => [creado, ...prev])
          setPaginaActual(1)
          demoToast(`Usuario "${creado.nombre}" creado correctamente.`, "success")
        })
        .catch((error) => {
          demoToast(
            error instanceof Error ? error.message : "No se pudo crear el usuario.",
            "error",
          )
        })
      return
    }
    const nums = usuarios
      .map((u) => Number.parseInt(u.id, 10))
      .filter((n) => !Number.isNaN(n))
    const nextId = String((nums.length ? Math.max(...nums) : 0) + 1)

    setUsuarios((prev) => [{ id: nextId, ...datos }, ...prev])
    setPaginaActual(1)
    demoToast(`Usuario "${datos.nombre}" creado correctamente (demo).`)
  }

  function editarUsuario(usuario: UsuarioModulo) {
    setUsuarioEdit(usuario)
    setDialogNuevoAbierto(true)
  }

  function actualizarUsuario(id: string, datos: Omit<UsuarioModulo, "id">) {
    if (apiActiva) {
      void editarUsuarioApi(id, datos)
        .then((actualizado) => {
          setUsuarios((prev) =>
            prev.map((item) => (item.id === id ? actualizado : item)),
          )
          demoToast(`Usuario "${actualizado.nombre}" actualizado.`, "success")
        })
        .catch((error) => {
          demoToast(
            error instanceof Error ? error.message : "No se pudo actualizar el usuario.",
            "error",
          )
        })
      return
    }
    setUsuarios((prev) =>
      prev.map((item) => (item.id === id ? { id, ...datos } : item)),
    )
    demoToast(`Usuario "${datos.nombre}" actualizado.`)
  }

  function restablecerClave(usuario: UsuarioModulo) {
    if (apiActiva) {
      void restablecerPasswordUsuario(usuario.id)
        .then((resultado) => {
          setUsuarioClaveRestablecida(usuario)
          setPasswordTemporal(resultado.passwordTemporal)
          setMensajeClaveRestablecida(resultado.mensaje)
          setDialogClaveAbierto(true)
        })
        .catch((error) => {
          demoToast(
            error instanceof Error
              ? error.message
              : "No se pudo restablecer la contraseña.",
            "error",
          )
        })
      return
    }

    const temporal = `Tmp${Math.random().toString(36).slice(2, 10)}`
    setUsuarioClaveRestablecida(usuario)
    setPasswordTemporal(temporal)
    setMensajeClaveRestablecida(
      "Contraseña temporal generada (demo). El usuario debe cambiarla en el login.",
    )
    setDialogClaveAbierto(true)
  }

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        title="Usuarios y roles"
        subtitle="Gestione el acceso y permisos del personal y proveedores dentro del módulo Dietas y Cocina."
        actions={
          <Button size="sm" onClick={() => setDialogNuevoAbierto(true)}>
            <Plus data-icon="inline-start" />
            Nuevo Usuario
          </Button>
        }
      />

      {!puedeGestionar && (
        <Alert>
          <AlertDescription>
            Tiene acceso de lectura. Solo administradores o usuarios con permiso
            en &quot;Usuarios y roles&quot; pueden modificar roles y permisos.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="usuarios">
        <TabsList
          variant="line"
          className="w-full justify-start rounded-none border-b bg-transparent px-0"
        >
          <TabsTrigger value="usuarios" className="gap-1.5 px-3">
            <Users className="size-4" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-1.5 px-3">
            <Shield className="size-4" />
            Roles y permisos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios" className="mt-4">
          {apiActiva && errorUsuarios && (
            <Alert className="mb-4">
              <AlertDescription>{errorUsuarios}</AlertDescription>
            </Alert>
          )}
          <Card className="gap-0 py-0 shadow-none">
            <UsuariosFiltros
              rolLabel={filtrosUi.rol}
              estadoLabel={filtrosUi.estado}
              paginaDesde={paginaDesde}
              paginaHasta={paginaHasta}
              total={totalFiltrados}
              paginaActual={paginaActual}
              totalPaginas={totalPaginas}
              rolSeleccionado={rolFiltro}
              estadoSeleccionado={estadoFiltro}
              onRolChange={setRolFiltro}
              onEstadoChange={setEstadoFiltro}
              onCambiarPagina={setPaginaActual}
            />
            <CardContent className="p-0">
              {apiActiva && cargandoUsuarios ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  Cargando usuarios…
                </p>
              ) : (
              <UsuariosTabla
                usuarios={usuariosPagina}
                puedeGestionar={puedeGestionar}
                onEditar={editarUsuario}
                onCambiarRol={abrirCambiarRol}
                onToggleEstado={toggleEstado}
                onRestablecerClave={restablecerClave}
                onEliminar={eliminarUsuario}
              />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="mt-4">
          <RolesPermisosPanel puedeGestionar={puedeGestionar} />
        </TabsContent>
      </Tabs>

      <CambiarRolDialog
        usuario={usuarioRolEdit}
        open={dialogRolAbierto}
        onOpenChange={setDialogRolAbierto}
        onConfirmar={confirmarCambioRol}
        puedeGestionar={puedeGestionar}
        apiActiva={apiActiva}
      />

      <NuevoUsuarioDialog
        open={dialogNuevoAbierto}
        onOpenChange={(open) => {
          setDialogNuevoAbierto(open)
          if (!open) setUsuarioEdit(null)
        }}
        onGuardar={crearUsuarioHandler}
        usuarioEdit={usuarioEdit}
        onActualizar={actualizarUsuario}
      />

      <RestablecerClaveDialog
        open={dialogClaveAbierto}
        onOpenChange={setDialogClaveAbierto}
        usuario={usuarioClaveRestablecida}
        passwordTemporal={passwordTemporal}
        mensaje={mensajeClaveRestablecida}
      />
    </div>
  )
}
