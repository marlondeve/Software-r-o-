namespace Bital.Domain.Enums;

public enum RutaDietas
{
    // Gestión de dietas
    ListarDietas = 1,
    CrearDieta = 2,
    EditarDieta = 3,
    EliminarDieta = 4,

    // Catálogo dietas y tarifas
    ListarCatalogoDietas = 5,
    CrearCatalogoDieta = 6,
    EditarCatalogoDieta = 7,
    EliminarCatalogoDieta = 8,

    // Órdenes de cocina
    ListarOrdenes = 10,
    CrearOrden = 11,
    ModificarOrden = 12,
    CancelarOrden = 13,

    // Etiquetas
    ListarEtiquetas = 20,
    ImprimirEtiquetas = 21,

    // Conciliación
    ListarConciliacion = 30,
    AprobarConciliacion = 31,
    RechazarConciliacion = 32,

    // Reportes y dashboards
    VerDashboard = 40,
    ExportarReportes = 41,

    // Parámetros operativos
    VerParametros = 50,
    EditarParametros = 51,

    // Auditoría
    VerAuditoria = 60,

    // Usuarios y permisos
    GestionarUsuarios = 70,
    GestionarPermisos = 71
}
