import { createBrowserRouter, Navigate } from "react-router-dom"

import {
  LazyAnalisisBrechasPage,
  LazyAuditoriaDietasPage,
  LazyAuditoriaEncuestasPage,
  LazyBandejasPisoPage,
  LazyCapturaEncuestaPage,
  LazyCapturaPresencialPage,
  LazyCapturaTelefonicaPage,
  LazyCicloFinalizadoPage,
  LazyCocinaPage,
  LazyConciliacionPage,
  LazyCuestionariosPage,
  LazyDevolucionFlowPage,
  LazyDietasPage,
  LazyDietasTarifasPage,
  LazyEditorCuestionarioPage,
  LazyEncuestaRegistradaPage,
  LazyEncuestasRealizadasPage,
  LazyEntregaFlowPage,
  LazyEtiquetaConsultaPage,
  LazyIdentificacionPacientePage,
  LazyImpresionEtiquetasPage,
  LazyIndicadoresPage,
  LazyInicioDietasPage,
  LazyInicioEncuestasPage,
  LazyParametrosEncuestasPage,
  LazyPermisosAdminPage,
  LazyPreEntregaFlowPage,
  LazyRecepcionProveedorPage,
  LazyReportesClinicosPage,
  LazyReportesProduccionPage,
  LazyRolesAdminPage,
  LazyTiemposRestriccionesView,
  LazyTiposPacienteView,
  LazyUsuariosAdminPage,
  LazyUsuariosRolesEncuestasPage,
  LazyUsuariosRolesPage,
} from "@/app/lazyRoutes"
import { AdminLayout } from "@/components/layout/AdminLayout"
import { LoginPage } from "@/components/layout/LoginPage"
import { MainLayout } from "@/components/layout/MainLayout"
import { NotFoundPage } from "@/components/shared/NotFoundPage"
import { RootRedirect } from "@/components/shared/RootRedirect"
import { GuestRoute } from "@/features/autenticacion/components/GuestRoute"
import { ModulosEntry } from "@/features/autenticacion/components/ModulosEntry"
import { RequireAdmin } from "@/features/autenticacion/components/RequireAdmin"
import { RequireAuth } from "@/features/autenticacion/components/RequireAuth"
import { RequireDietasRuta } from "@/features/autenticacion/components/RequireDietasRuta"
import { RequireModuleAccess } from "@/features/autenticacion/components/RequireModuleAccess"
import { encuestasHabilitado } from "@/lib/modulosFlags"
import { DietasCocinaLayout } from "@/modules/dietas-cocina/DietasCocinaLayout"
import { RequireCapacidadEtiqueta } from "@/modules/dietas-cocina/etiquetas/views/RequireCapacidadEtiqueta"
import { RequireDevolucionEtiqueta } from "@/modules/dietas-cocina/etiquetas/views/RequireDevolucionEtiqueta"
import { ParametrosLayout } from "@/modules/dietas-cocina/parametros/ParametrosLayout"

const encuestasRoutes = encuestasHabilitado()
  ? [
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
          { index: true, element: <LazyInicioEncuestasPage /> },
          { path: "inicio", element: <LazyInicioEncuestasPage /> },
          {
            path: "identificacion-paciente",
            element: <LazyIdentificacionPacientePage />,
          },
          { path: "captura-presencial", element: <LazyCapturaPresencialPage /> },
          { path: "captura-telefonica", element: <LazyCapturaTelefonicaPage /> },
          {
            path: "encuestas-realizadas",
            element: <LazyEncuestasRealizadasPage />,
          },
          { path: "cuestionarios", element: <LazyCuestionariosPage /> },
          {
            path: "cuestionarios/:cuestionarioId/editor",
            element: <LazyEditorCuestionarioPage />,
          },
          { path: "indicadores", element: <LazyIndicadoresPage /> },
          { path: "analisis-brechas", element: <LazyAnalisisBrechasPage /> },
          { path: "parametros", element: <LazyParametrosEncuestasPage /> },
          { path: "usuarios", element: <LazyUsuariosRolesEncuestasPage /> },
          { path: "auditoria", element: <LazyAuditoriaEncuestasPage /> },
        ],
      },
      {
        path: "/encuestas/captura-encuesta",
        element: (
          <RequireAuth>
            <RequireModuleAccess moduloId="encuestas">
              <LazyCapturaEncuestaPage />
            </RequireModuleAccess>
          </RequireAuth>
        ),
      },
      {
        path: "/encuestas/captura-encuesta/registrada",
        element: (
          <RequireAuth>
            <RequireModuleAccess moduloId="encuestas">
              <LazyEncuestaRegistradaPage />
            </RequireModuleAccess>
          </RequireAuth>
        ),
      },
    ]
  : [
      {
        path: "/encuestas/*",
        element: <Navigate to="/dietas-cocina/inicio" replace />,
      },
    ]

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
        <ModulosEntry />
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
        element: <DietasCocinaLayout />,
        children: [
          {
            element: <RequireDietasRuta />,
            children: [
              { index: true, element: <LazyInicioDietasPage /> },
              { path: "inicio", element: <LazyInicioDietasPage /> },
              { path: "dietas", element: <LazyDietasPage /> },
              { path: "dietas-tarifas", element: <LazyDietasTarifasPage /> },
              { path: "cocina", element: <LazyCocinaPage /> },
              {
                path: "impresion-etiquetas",
                element: <LazyImpresionEtiquetasPage />,
              },
              {
                path: "recepcion-proveedor",
                element: <LazyRecepcionProveedorPage />,
                children: [
                  {
                    path: "escaneo",
                    element: (
                      <RequireCapacidadEtiqueta capacidad="recepcion_proveedor">
                        <LazyPreEntregaFlowPage />
                      </RequireCapacidadEtiqueta>
                    ),
                  },
                  {
                    path: "exito",
                    element: (
                      <RequireCapacidadEtiqueta capacidad="recepcion_proveedor">
                        <LazyCicloFinalizadoPage origen="recepcion" />
                      </RequireCapacidadEtiqueta>
                    ),
                  },
                ],
              },
              {
                path: "bandejas-piso",
                element: <LazyBandejasPisoPage />,
                children: [
                  {
                    path: "consulta/:codigo",
                    element: (
                      <RequireCapacidadEtiqueta capacidad="entrega_paciente">
                        <LazyEtiquetaConsultaPage />
                      </RequireCapacidadEtiqueta>
                    ),
                  },
                  {
                    path: "entrega",
                    element: (
                      <RequireCapacidadEtiqueta capacidad="entrega_paciente">
                        <LazyEntregaFlowPage />
                      </RequireCapacidadEtiqueta>
                    ),
                  },
                  {
                    path: "devolucion/:tipo",
                    element: (
                      <RequireDevolucionEtiqueta>
                        <LazyDevolucionFlowPage />
                      </RequireDevolucionEtiqueta>
                    ),
                  },
                  {
                    path: "exito",
                    element: (
                      <RequireCapacidadEtiqueta operativa>
                        <LazyCicloFinalizadoPage origen="piso" />
                      </RequireCapacidadEtiqueta>
                    ),
                  },
                ],
              },
              {
                path: "reportes-clinicos",
                element: <LazyReportesClinicosPage />,
              },
              {
                path: "reportes-produccion",
                element: <LazyReportesProduccionPage />,
              },
              { path: "conciliacion", element: <LazyConciliacionPage /> },
              {
                path: "parametros",
                element: <ParametrosLayout />,
                children: [
                  { index: true, element: <Navigate to="tiempos" replace /> },
                  {
                    path: "tiempos",
                    element: <LazyTiemposRestriccionesView />,
                  },
                  {
                    path: "tipos-paciente",
                    element: <LazyTiposPacienteView />,
                  },
                ],
              },
              { path: "auditoria", element: <LazyAuditoriaDietasPage /> },
              { path: "usuarios", element: <LazyUsuariosRolesPage /> },
            ],
          },
        ],
      },
    ],
  },
  ...encuestasRoutes,
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
      { index: true, element: <LazyUsuariosAdminPage /> },
      { path: "usuarios", element: <LazyUsuariosAdminPage /> },
      { path: "roles", element: <LazyRolesAdminPage /> },
      { path: "permisos", element: <LazyPermisosAdminPage /> },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
])
