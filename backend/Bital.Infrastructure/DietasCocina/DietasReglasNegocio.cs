using Bital.Domain.Entities.DietasCocina;
using Bital.Domain.Enums;
using System.Globalization;

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
        RolModuloSeed.NombreAdministrador,
    ];

    internal static bool PermiteRegistrarNovedad(EstadoDieta estado) =>
        EstadosNovedad.Contains(estado);

    internal static bool EsCancelacionNormal(EstadoDieta estado) =>
        EstadosCancelarNormal.Contains(estado);

    internal static bool EsCancelacionTardia(EstadoDieta estado, string? rolUsuario) =>
        EstadosCancelarTardia.Contains(estado)
        && !string.IsNullOrWhiteSpace(rolUsuario)
        && RolesCancelarTardia.Contains(NormalizarRol(rolUsuario));

    internal static bool EsMerienda(TiempoComida comida) =>
        comida is TiempoComida.MediaNueve or TiempoComida.Onces or TiempoComida.MediaNoche;

    internal static bool RequiereConsistencia(TiempoComida comida) =>
        !EsMerienda(comida);

    internal static void ValidarCamposClinicosPorComida(FilaDieta fila)
    {
        if (!fila.TipoDietaId.HasValue && string.IsNullOrWhiteSpace(fila.DescripcionDieta))
        {
            throw new InvalidOperationException(
                "El tipo de dieta es obligatorio para esta comida.");
        }

        if (RequiereConsistencia(fila.Comida) && string.IsNullOrEmpty(fila.Consistencia))
        {
            throw new InvalidOperationException(
                "La consistencia es obligatoria para esta comida.");
        }
    }

    internal static void ValidarTarifaTipoDietaParaComida(
        FilaDieta fila,
        IEnumerable<TarifaHistorico> tarifasCatalogo,
        DateTime hoy)
    {
        if (!fila.TipoDietaId.HasValue)
        {
            return;
        }

        if (!TarifasCatalogoHelper.TieneTarifaVigenteParaComida(
                tarifasCatalogo.Where(t => t.DietaCatalogoId == fila.TipoDietaId),
                fila.Comida,
                hoy))
        {
            throw new InvalidOperationException(
                $"El tipo de dieta seleccionado no tiene tarifa vigente para {fila.Comida}.");
        }
    }

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
            "admin" or "Admin" => RolModuloSeed.NombreAdministrador,
            _ => rol.Trim(),
        };

    /// <summary>
    /// Resuelve el servicio clínico desde Vital (ClaPro) o infiere desde el pabellón.
    /// ClaPro suele ser un código (ej. "2", "3"); si no es descriptivo, se usa el pabellón.
    /// </summary>
    internal static string ResolverServicioClinico(string? servicioHIS, string pabellon)
    {
        // UCI ADULTO / UCI PEDIÁTRICA, etc.: el pabellón manda sobre un servicio genérico del HIS.
        var especialidad = EspecialidadDesdePabellon(pabellon);
        if (especialidad != null)
            return especialidad;

        if (EsServicioDescriptivo(servicioHIS))
            return servicioHIS!.Trim();

        return InferirServicioDesdePabellon(pabellon);
    }

    private static string? EspecialidadDesdePabellon(string pabellon)
    {
        if (string.IsNullOrWhiteSpace(pabellon))
            return null;

        var normalizado = pabellon.ToUpperInvariant();
        if (normalizado.Contains("UCI")) return "UCI";
        if (normalizado.Contains("URGENCI")) return "Urgencias";
        if (normalizado.Contains("NEONATAL")) return "Neonatal";
        return null;
    }

    internal static bool EsServicioDescriptivo(string? servicioHIS)
    {
        if (string.IsNullOrWhiteSpace(servicioHIS))
            return false;

        var valor = servicioHIS.Trim();

        if (valor.Equals("Sin información", StringComparison.OrdinalIgnoreCase) ||
            valor.Equals("Sin servicio", StringComparison.OrdinalIgnoreCase))
            return false;

        // ClaPro numérico (ej. "2", "3") no es una etiqueta legible para el usuario.
        if (valor.All(char.IsDigit))
            return false;

        // Códigos cortos sin letras (ej. "03") tampoco se muestran como servicio.
        if (valor.Length <= 2 && !valor.Any(char.IsLetter))
            return false;

        return true;
    }

    internal static string InferirServicioDesdePabellon(string pabellon)
    {
        if (string.IsNullOrWhiteSpace(pabellon))
            return "Sin servicio";

        var normalizado = pabellon.ToUpperInvariant();
        if (normalizado.Contains("UCI")) return "UCI";
        if (normalizado.Contains("URGENCI")) return "Urgencias";
        if (normalizado.Contains("NEONATAL")) return "Neonatal";
        if (normalizado.Contains("HOSPITALIZ") || normalizado.Contains("PISO"))
            return "Hospitalización";

        return CultureInfo.CurrentCulture.TextInfo.ToTitleCase(pabellon.ToLowerInvariant());
    }
}
