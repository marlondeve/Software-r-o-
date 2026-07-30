using Bital.Domain.Entities.DietasCocina;
using Bital.Domain.Enums;

namespace Bital.Infrastructure.DietasCocina;

/// <summary>
/// Reglas de negocio alineadas con el frontend (solicitudDieta.ts).
/// </summary>
internal static class DietasReglasNegocio
{
    private static readonly HashSet<EstadoDieta> EstadosNovedad =
    [
        EstadoDieta.Guardado,
        EstadoDieta.Solicitada,
        EstadoDieta.Confirmada,
        EstadoDieta.EnPreparacion,
        EstadoDieta.Devuelta,
    ];

    private static readonly HashSet<EstadoDieta> EstadosCancelarNormal =
    [
        EstadoDieta.Guardado,
        EstadoDieta.Solicitada,
    ];

    private static readonly HashSet<EstadoDieta> EstadosCancelarTardia =
    [
        EstadoDieta.Confirmada,
        EstadoDieta.EnPreparacion,
        EstadoDieta.ListaEnvio,
    ];

    private static readonly HashSet<string> RolesCancelarTardia =
    [
        "Administrador",
    ];

    internal static bool PermiteRegistrarNovedad(EstadoDieta estado) =>
        EstadosNovedad.Contains(estado);

    internal static bool EsCancelacionNormal(EstadoDieta estado) =>
        EstadosCancelarNormal.Contains(estado);

    internal static bool EsCancelacionTardia(EstadoDieta estado, string? rolUsuario) =>
        EstadosCancelarTardia.Contains(estado)
        && !string.IsNullOrWhiteSpace(rolUsuario)
        && RolesCancelarTardia.Contains(NormalizarRol(rolUsuario));

    internal static bool VentanaNovedadesAbierta(TiempoComidaConfig? config, DateTime ahoraLocal)
    {
        if (config is null || !config.Activo)
        {
            return false;
        }

        var hora = ahoraLocal.TimeOfDay;
        return hora <= config.HoraCierre;
    }

    internal static void ValidarCondicionesClinicas(
        bool aislado,
        string? observacionAislamiento,
        bool alergico,
        string? alergias)
    {
        if (aislado && string.IsNullOrWhiteSpace(observacionAislamiento))
        {
            throw new InvalidOperationException(
                "Debe indicar la observación de aislamiento cuando el paciente está aislado.");
        }

        if (alergico && string.IsNullOrWhiteSpace(alergias))
        {
            throw new InvalidOperationException(
                "Debe indicar las alergias del paciente cuando está marcado como alérgico.");
        }
    }

    private static string NormalizarRol(string rol) =>
        rol.Trim() switch
        {
            "admin" or "Admin" => "Administrador",
            _ => rol.Trim(),
        };
}
