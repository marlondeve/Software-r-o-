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
import { RolesPermisosPanel } from "@/modules/dietas-cocina/usuarios/components/RolesPermisosPanel"
import { UsuariosFiltros } from "@/modules/dietas-cocina/usuarios/components/UsuariosFiltros"
import { UsuariosTabla } from "@/modules/dietas-cocina/usuarios/components/UsuariosTabla"
import {
  mockUsuariosDietas,
  type UsuarioModulo,
} from "@/modules/dietas-cocina/usuarios/datos/mockUsuarios"
import type { RolDietas } from "@/modules/dietas-cocina/lib/roles"
import { puedeGestionarUsuariosRoles } from "@/modules/dietas-cocina/usuarios/lib/permisosValidaciones"

const TAMANO_PAGINA_USUARIOS = 10

export function UsuariosRolesPage() {
  const { usuario: usuarioActual } = useAuth()
  const rolActual = obtenerRolDietas(usuarioActual)
  const puedeGestionar = puedeGestionarUsuariosRoles(rolActual)
  const data = mockUsuariosDietas
  const [usuarios, setUsuarios] = useState<UsuarioModulo[]>(data.usuarios)
  const [rolFiltro, setRolFiltro] = useState("todos")
  const [estadoFiltro, setEstadoFiltro] = useState("todos")
  const [paginaActual, setPaginaActual] = useState(1)
  const [usuarioRolEdit, setUsuarioRolEdit] = useState<UsuarioModulo | null>(
    null,
  )
  const [dialogRolAbierto, setDialogRolAbierto] = useState(false)
  const [dialogNuevoAbierto, setDialogNuevoAbierto] = useState(false)
  const [usuarioEdit, setUsuarioEdit] = useState<UsuarioModulo | null>(null)

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
    setUsuarios((prev) =>
      prev.map((usuario) =>
        usuario.id === usuarioId ? { ...usuario, rol } : usuario,
      ),
    )
  }

  function toggleEstado(usuario: UsuarioModulo) {
    setUsuarios((prev) =>
      prev.map((item) =>
        item.id === usuario.id
          ? {
              ...item,
              estado: item.estado === "activo" ? "inactivo" : "activo",
            }
          : item,
      ),
    )
  }

  function eliminarUsuario(usuario: UsuarioModulo) {
    setUsuarios((prev) => prev.filter((item) => item.id !== usuario.id))
  }

  function crearUsuario(datos: Omit<UsuarioModulo, "id">) {
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
    setUsuarios((prev) =>
      prev.map((item) => (item.id === id ? { id, ...datos } : item)),
    )
    demoToast(`Usuario "${datos.nombre}" actualizado.`)
  }

  function restablecerClave(usuario: UsuarioModulo) {
    demoToast(
      `Se envió enlace de restablecimiento a ${usuario.correo} (demo).`,
    )
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
          <Card className="gap-0 py-0 shadow-none">
            <UsuariosFiltros
              rolLabel={data.filtros.rol}
              estadoLabel={data.filtros.estado}
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
              <UsuariosTabla
                usuarios={usuariosPagina}
                puedeGestionar={puedeGestionar}
                onEditar={editarUsuario}
                onCambiarRol={abrirCambiarRol}
                onToggleEstado={toggleEstado}
                onRestablecerClave={restablecerClave}
                onEliminar={eliminarUsuario}
              />
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
      />

      <NuevoUsuarioDialog
        open={dialogNuevoAbierto}
        onOpenChange={(open) => {
          setDialogNuevoAbierto(open)
          if (!open) setUsuarioEdit(null)
        }}
        onGuardar={crearUsuario}
        usuarioEdit={usuarioEdit}
        onActualizar={actualizarUsuario}
      />
    </div>
  )
}
