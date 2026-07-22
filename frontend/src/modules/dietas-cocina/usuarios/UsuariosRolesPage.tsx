import { useMemo, useState } from "react"
import { Plus, Shield, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardPageHeader } from "@/modules/dietas-cocina/inicio/components/DashboardPageHeader"
import { CambiarRolDialog } from "@/modules/dietas-cocina/usuarios/components/CambiarRolDialog"
import { RolesPermisosPanel } from "@/modules/dietas-cocina/usuarios/components/RolesPermisosPanel"
import { UsuariosFiltros } from "@/modules/dietas-cocina/usuarios/components/UsuariosFiltros"
import { UsuariosTabla } from "@/modules/dietas-cocina/usuarios/components/UsuariosTabla"
import {
  mockUsuariosDietas,
  type UsuarioModulo,
} from "@/modules/dietas-cocina/usuarios/datos/mockUsuarios"
import type { RolDietas } from "@/modules/dietas-cocina/lib/roles"

export function UsuariosRolesPage() {
  const data = mockUsuariosDietas
  const [usuarios, setUsuarios] = useState<UsuarioModulo[]>(data.usuarios)
  const [rolFiltro, setRolFiltro] = useState("todos")
  const [estadoFiltro, setEstadoFiltro] = useState("todos")
  const [usuarioRolEdit, setUsuarioRolEdit] = useState<UsuarioModulo | null>(
    null,
  )
  const [dialogRolAbierto, setDialogRolAbierto] = useState(false)

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((usuario) => {
      const coincideRol = rolFiltro === "todos" || usuario.rol === rolFiltro
      const coincideEstado =
        estadoFiltro === "todos" || usuario.estado === estadoFiltro
      return coincideRol && coincideEstado
    })
  }, [usuarios, rolFiltro, estadoFiltro])

  function abrirCambiarRol(usuario: UsuarioModulo) {
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

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        title="Usuarios y roles"
        subtitle="Gestione el acceso y permisos del personal y proveedores dentro del módulo Dietas y Cocina."
        actions={
          <Button size="sm">
            <Plus data-icon="inline-start" />
            Nuevo Usuario
          </Button>
        }
      />

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
              paginaDesde={data.pagina.desde}
              paginaHasta={Math.min(
                data.pagina.hasta,
                usuariosFiltrados.length || data.pagina.hasta,
              )}
              total={data.total}
              rolSeleccionado={rolFiltro}
              estadoSeleccionado={estadoFiltro}
              onRolChange={setRolFiltro}
              onEstadoChange={setEstadoFiltro}
            />
            <CardContent className="p-0">
              <UsuariosTabla
                usuarios={usuariosFiltrados}
                onEditar={() => undefined}
                onCambiarRol={abrirCambiarRol}
                onToggleEstado={toggleEstado}
                onRestablecerClave={() => undefined}
                onEliminar={eliminarUsuario}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="mt-4">
          <RolesPermisosPanel />
        </TabsContent>
      </Tabs>

      <CambiarRolDialog
        usuario={usuarioRolEdit}
        open={dialogRolAbierto}
        onOpenChange={setDialogRolAbierto}
        onConfirmar={confirmarCambioRol}
      />
    </div>
  )
}
