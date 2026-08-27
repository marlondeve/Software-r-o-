namespace Bital.Infrastructure.DietasCocina;

/// <summary>
/// Hora operativa del hospital (America/Bogota) para ventanas de solicitud y novedades.
/// </summary>
internal static class HorarioOperativoHelper
{
    private static readonly TimeZoneInfo ZonaColombia = ResolverZonaColombia();

    internal static DateTime AhoraColombia() =>
        TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, ZonaColombia);

    internal static DateTime AHoraColombia(DateTime fechaHora)
    {
        var comoUtc = fechaHora.Kind switch
        {
            DateTimeKind.Utc => fechaHora,
            DateTimeKind.Local => fechaHora.ToUniversalTime(),
            _ => DateTime.SpecifyKind(fechaHora, DateTimeKind.Utc),
        };
        return TimeZoneInfo.ConvertTimeFromUtc(comoUtc, ZonaColombia);
    }

    private static TimeZoneInfo ResolverZonaColombia()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById(
                OperatingSystem.IsWindows() ? "SA Pacific Standard Time" : "America/Bogota");
        }
        catch (TimeZoneNotFoundException)
        {
            return TimeZoneInfo.CreateCustomTimeZone(
                "America/Bogota",
                TimeSpan.FromHours(-5),
                "Colombia",
                "COT");
        }
    }
}
