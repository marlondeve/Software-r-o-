using Bital.Domain.Enums;

namespace Bital.Infrastructure.DietasCocina;

public static class RolModuloSeed
{
    public const string NombreAdministrador = "Administrador";
    public const string NombreNutricionista = "Nutricionista";
    public const string NombreProveedor = "Proveedor";
    public const string NombreEnfermera = "Enfermera";
    public const string NombreAuxiliarCocina = "Auxiliar de Cocina";

    public static readonly Guid Administrador = Guid.Parse("11111111-1111-1111-1111-111111000001");
    public static readonly Guid Nutricionista = Guid.Parse("11111111-1111-1111-1111-111111000002");
    public static readonly Guid Proveedor = Guid.Parse("11111111-1111-1111-1111-111111000003");
    public static readonly Guid Enfermera = Guid.Parse("11111111-1111-1111-1111-111111000004");
    /// <summary>Rol legado — ya no forma parte del catálogo por defecto.</summary>
    public static readonly Guid Doctor = Guid.Parse("11111111-1111-1111-1111-111111000005");
    public static readonly Guid AuxiliarCocina = Guid.Parse("11111111-1111-1111-1111-111111000006");

    public static IReadOnlyList<(Guid Id, string Nombre)> RolesPorDefecto =>
    [
        (Administrador, NombreAdministrador),
        (Nutricionista, NombreNutricionista),
        (Proveedor, NombreProveedor),
        (Enfermera, NombreEnfermera),
        (AuxiliarCocina, NombreAuxiliarCocina),
    ];

    public static Guid FromLegacyEnum(int legacyRol) => legacyRol switch
    {
        1 => Administrador,
        2 => Nutricionista,
        3 => Proveedor,
        4 => Enfermera,
        _ => Enfermera,
    };

    public static List<RutaDietas> PermisosNutricionista =>
    [
        RutaDietas.ListarDietas,
        RutaDietas.CrearDieta,
        RutaDietas.EditarDieta,
        RutaDietas.ListarCatalogoDietas,
        RutaDietas.CrearCatalogoDieta,
        RutaDietas.EditarCatalogoDieta,
        RutaDietas.EliminarCatalogoDieta,
        RutaDietas.ListarOrdenes,
        RutaDietas.VerDashboard,
        RutaDietas.ExportarReportes,
        RutaDietas.VerParametros,
        RutaDietas.VerAuditoria,
        RutaDietas.ListarConciliacion,
    ];

    public static List<RutaDietas> PermisosProveedor =>
    [
        RutaDietas.ListarOrdenes,
        RutaDietas.ModificarOrden,
        RutaDietas.CancelarOrden,
        RutaDietas.ImprimirEtiquetas,
        RutaDietas.VerDashboard,
        RutaDietas.ExportarReportes,
        RutaDietas.ListarEtiquetas,
    ];

    public static List<RutaDietas> PermisosEnfermera =>
    [
        RutaDietas.ListarDietas,
        RutaDietas.ListarEtiquetas,
        RutaDietas.RecepcionProveedor,
        RutaDietas.VerDashboard,
    ];

    public static List<RutaDietas> PermisosAuxiliarCocina =>
    [
        RutaDietas.ListarEtiquetas,
        RutaDietas.EntregaPaciente,
        RutaDietas.RechazoAntesEntrega,
        RutaDietas.RecogidaBandeja,
        RutaDietas.VerDashboard,
    ];
}
