import { createBrowserRouter, Navigate } from "react-router-dom"

import { AdminLayout } from "@/components/layout/AdminLayout"
import { NotFoundPage } from "@/components/shared/NotFoundPage"
import { RootRedirect } from "@/components/shared/RootRedirect"
import { LoginPage } from "@/components/layout/LoginPage"
import { MainLayout } from "@/components/layout/MainLayout"
import { GuestRoute } from "@/features/autenticacion/components/GuestRoute"
import { RequireAdmin } from "@/features/autenticacion/components/RequireAdmin"
import { RequireAuth } from "@/features/autenticacion/components/RequireAuth"
import { RequireDietasRuta } from "@/features/autenticacion/components/RequireDietasRuta"
import { RequireModuleAccess } from "@/features/autenticacion/components/RequireModuleAccess"
import { SeleccionModuloPage } from "@/features/autenticacion/components/SeleccionModuloPage"
import { PermisosPage } from "@/features/administracion/permisos/PermisosPage"
import { RolesPage } from "@/features/administracion/roles/RolesPage"
import { UsuariosPage } from "@/features/administracion/usuarios/UsuariosPage"
import { AuditoriaPage as AuditoriaDietasPage } from "@/modules/dietas-cocina/auditoria/AuditoriaPage"
import { CocinaPage } from "@/modules/dietas-cocina/cocina/CocinaPage"
import { ConciliacionPage } from "@/modules/dietas-cocina/conciliacion/ConciliacionPage"
import { DietasPage } from "@/modules/dietas-cocina/dietas/DietasPage"
import { EtiquetasPage } from "@/modules/dietas-cocina/etiquetas/EtiquetasPage"
import { InicioPage as InicioDietasPage } from "@/modules/dietas-cocina/inicio/InicioPage"
import { ParametrosLayout } from "@/modules/dietas-cocina/parametros/ParametrosLayout"
import { TiemposRestriccionesView } from "@/modules/dietas-cocina/parametros/views/TiemposRestriccionesView"
import { TiposPacienteView } from "@/modules/dietas-cocina/parametros/views/TiposPacienteView"
import { ReportesPage } from "@/modules/dietas-cocina/reportes/ReportesPage"
import { UsuariosRolesPage } from "@/modules/dietas-cocina/usuarios/UsuariosRolesPage"
import { AnalisisBrechasPage } from "@/modules/encuestas/analisis-brechas/AnalisisBrechasPage"
import { AuditoriaPage as AuditoriaEncuestasPage } from "@/modules/encuestas/auditoria/AuditoriaPage"
import { CapturaEncuestaPage } from "@/modules/encuestas/captura-encuesta/CapturaEncuestaPage"
import { CapturaPresencialPage } from "@/modules/encuestas/captura-presencial/CapturaPresencialPage"
import { CapturaTelefonicaPage } from "@/modules/encuestas/captura-telefonica/CapturaTelefonicaPage"
import { CuestionariosPage } from "@/modules/encuestas/cuestionarios/CuestionariosPage"
import { EditorCuestionarioPage } from "@/modules/encuestas/editor-cuestionario/EditorCuestionarioPage"
import { EncuestaRegistradaPage } from "@/modules/encuestas/captura-encuesta/EncuestaRegistradaPage"
import { EncuestasRealizadasPage } from "@/modules/encuestas/encuestas-realizadas/EncuestasRealizadasPage"
import { IdentificacionPacientePage } from "@/modules/encuestas/identificacion-paciente/IdentificacionPacientePage"
import { IndicadoresPage } from "@/modules/encuestas/indicadores/IndicadoresPage"
import { InicioPage as InicioEncuestasPage } from "@/modules/encuestas/inicio/InicioPage"
import { ParametrosPage as ParametrosEncuestasPage } from "@/modules/encuestas/parametros/ParametrosPage"
import { UsuariosRolesPage as UsuariosRolesEncuestasPage } from "@/modules/encuestas/usuarios/UsuariosRolesPage"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootRedirect />,
  },
  {
    path: "/login",
    element: (
      <GuestRoute>
        <LoginPage />
      </GuestRoute>
    ),
  },
  {
    path: "/modulos",
    element: (
      <RequireAuth>
        <SeleccionModuloPage />
      </RequireAuth>
    ),
  },
  {
    path: "/dietas-cocina",
    element: (
      <RequireAuth>
        <RequireModuleAccess moduloId="dietas-cocina">
          <MainLayout module="dietas-cocina" />
        </RequireModuleAccess>
      </RequireAuth>
    ),
    children: [
      {
        element: <RequireDietasRuta />,
        children: [
          { index: true, element: <InicioDietasPage /> },
          { path: "inicio", element: <InicioDietasPage /> },
          { path: "dietas", element: <DietasPage /> },
          { path: "cocina", element: <CocinaPage /> },
          { path: "etiquetas", element: <EtiquetasPage /> },
          { path: "reportes", element: <ReportesPage /> },
          { path: "conciliacion", element: <ConciliacionPage /> },
          {
            path: "parametros",
            element: <ParametrosLayout />,
            children: [
              { index: true, element: <Navigate to="tiempos" replace /> },
              { path: "tiempos", element: <TiemposRestriccionesView /> },
              { path: "tipos-paciente", element: <TiposPacienteView /> },
            ],
          },
          { path: "auditoria", element: <AuditoriaDietasPage /> },
          { path: "usuarios", element: <UsuariosRolesPage /> },
        ],
      },
    ],
  },
  {
    path: "/encuestas",
    element: (
      <RequireAuth>
        <RequireModuleAccess moduloId="encuestas">
          <MainLayout module="encuestas" />
        </RequireModuleAccess>
      </RequireAuth>
    ),
    children: [
      { index: true, element: <InicioEncuestasPage /> },
      { path: "inicio", element: <InicioEncuestasPage /> },
      { path: "identificacion-paciente", element: <IdentificacionPacientePage /> },
      { path: "captura-presencial", element: <CapturaPresencialPage /> },
      { path: "captura-telefonica", element: <CapturaTelefonicaPage /> },
      { path: "encuestas-realizadas", element: <EncuestasRealizadasPage /> },
      { path: "cuestionarios", element: <CuestionariosPage /> },
      {
        path: "cuestionarios/:cuestionarioId/editor",
        element: <EditorCuestionarioPage />,
      },
      { path: "indicadores", element: <IndicadoresPage /> },
      { path: "analisis-brechas", element: <AnalisisBrechasPage /> },
      { path: "parametros", element: <ParametrosEncuestasPage /> },
      { path: "usuarios", element: <UsuariosRolesEncuestasPage /> },
      { path: "auditoria", element: <AuditoriaEncuestasPage /> },
    ],
  },
  {
    path: "/encuestas/captura-encuesta",
    element: (
      <RequireAuth>
        <RequireModuleAccess moduloId="encuestas">
          <CapturaEncuestaPage />
        </RequireModuleAccess>
      </RequireAuth>
    ),
  },
  {
    path: "/encuestas/captura-encuesta/registrada",
    element: (
      <RequireAuth>
        <RequireModuleAccess moduloId="encuestas">
          <EncuestaRegistradaPage />
        </RequireModuleAccess>
      </RequireAuth>
    ),
  },
  {
    path: "/administracion",
    element: (
      <RequireAuth>
        <RequireAdmin>
          <AdminLayout />
        </RequireAdmin>
      </RequireAuth>
    ),
    children: [
      { index: true, element: <UsuariosPage /> },
      { path: "usuarios", element: <UsuariosPage /> },
      { path: "roles", element: <RolesPage /> },
      { path: "permisos", element: <PermisosPage /> },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
])
