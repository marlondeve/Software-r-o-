using System.Security.Cryptography;
using System.Text;
using Bital.Domain.Entities.DietasCocina;
using Bital.Domain.Enums;

namespace Bital.Infrastructure.DietasCocina;

/// <summary>
/// Alinea reportes de producción con la planilla de cocina (contrato FCR):
/// tipos agrupados (p. ej. «Normales y derivadas») y bandejas suministradas.
/// </summary>
internal static class ContratoCocinaHelper
{
    internal const string LineaNormalesYDerivadas = "Normales y derivadas";
    internal static readonly Guid CatalogoNormalesId = Guid.Parse("aaaaaaaa-0001-4000-8000-000000000001");

    private static readonly HashSet<string> TiposDerivados = new(StringComparer.OrdinalIgnoreCase)
    {
        "Normal para la edad",
        "Normales y derivadas",
        "Hiposodica",
        "Hiposódica",
        "Hipograsa",
        "Hipoglucida",
        "Hipoglúcida",
        "Astringente",
        "Gastroprotectora",
        "Inmunoprotectora",
    };

    internal static bool EsMerienda(TiempoComida comida) =>
        comida is TiempoComida.MediaNueve or TiempoComida.Onces or TiempoComida.MediaNoche;

    /// <summary>
    /// Línea del tarifario FCR / planilla de cocina.
    /// Hiposódica, hipograsa y demás derivadas se facturan como «Normales y derivadas».
    /// </summary>
    internal static string LineaContrato(string? nombreTipoDieta)
    {
        var nombre = (nombreTipoDieta ?? string.Empty).Trim();
        if (nombre.Length == 0 || TiposDerivados.Contains(nombre))
            return LineaNormalesYDerivadas;

        if (nombre.Contains("licuado", StringComparison.OrdinalIgnoreCase))
            return "Hiperproteico licuado completa";

        if (nombre.Contains("Merienda mañana", StringComparison.OrdinalIgnoreCase)
            || nombre.Contains("Merienda manana", StringComparison.OrdinalIgnoreCase))
            return "Merienda mañana";

        if (nombre.Contains("Merienda tarde", StringComparison.OrdinalIgnoreCase))
            return "Merienda tarde";

        if (nombre.Contains("Merienda noche", StringComparison.OrdinalIgnoreCase))
            return "Merienda noche";

        return nombre;
    }

    /// <summary>
    /// Bandeja que cocina suministra y factura (misma lógica que la planilla 24–30 ago):
    /// etiqueta impresa, orden en curso/completada, o cancelación de almuerzo/cena
    /// cuando el turno ya iba en producción. El desayuno cancelado sin etiqueta no se cobra.
    /// Las meriendas solo cuentan con etiqueta y sin cancelar.
    /// </summary>
    internal static bool EsSuministrada(FilaDieta fila, string? estadoOrden, bool tieneEtiqueta)
    {
        if (EsMerienda(fila.Comida))
            return tieneEtiqueta && fila.Estado != EstadoDieta.Cancelada;

        if (tieneEtiqueta)
            return true;

        if (EsOrdenEnProduccion(estadoOrden))
            return true;

        if (string.Equals(estadoOrden, "Cancelada", StringComparison.OrdinalIgnoreCase)
            && fila.Comida is TiempoComida.Almuerzo or TiempoComida.Cena)
        {
            return true;
        }

        return false;
    }

    internal sealed record LineaPlanillaDef(TiempoComida Comida, string Linea, string Etiqueta);

    /// <summary>
    /// Filas de la planilla de cocina (contrato FCR), en el mismo orden que usa el proveedor.
    /// </summary>
    internal static readonly LineaPlanillaDef[] PlantillaFcr =
    [
        new(TiempoComida.Desayuno, LineaNormalesYDerivadas, "Desayunos normales y derivadas"),
        new(TiempoComida.Desayuno, "Hiperproteico", "Desayunos hiperproteico"),
        new(TiempoComida.Desayuno, "Niños de 10 m en adelante", "Niños de 10 m en adelante"),
        new(TiempoComida.Desayuno, "Hipoproteico", "Desayuno hipoproteico"),
        new(TiempoComida.Desayuno, "Líquido completa", "Desayuno líquido"),
        new(TiempoComida.Desayuno, "Líquidos claros", "Desayunos líquidos claros"),
        new(TiempoComida.Desayuno, "Hiperproteico licuado completa", "Desayuno hiperproteico licuado completa"),
        new(TiempoComida.Almuerzo, LineaNormalesYDerivadas, "Almuerzos normales y derivadas"),
        new(TiempoComida.Almuerzo, "Hiperproteico", "Almuerzos hiperproteico"),
        new(TiempoComida.Almuerzo, "Hipoproteico", "Almuerzo hipoproteico"),
        new(TiempoComida.Almuerzo, "Renal", "Almuerzo renal"),
        new(TiempoComida.Almuerzo, "Líquidos claros", "Almuerzo líquidos claros"),
        new(TiempoComida.Almuerzo, "Niños de 6 a 10 meses", "Niños de 6 a 10 meses"),
        new(TiempoComida.Almuerzo, "Niños de 10 m en adelante", "Niños de 10 m en adelante"),
        new(TiempoComida.Almuerzo, "Líquido completa", "Almuerzo líquido completa"),
        new(TiempoComida.Almuerzo, "Hiperproteico licuado completa", "Almuerzo hiperproteico licuado completo"),
        new(TiempoComida.Cena, LineaNormalesYDerivadas, "Cenas normales y derivadas"),
        new(TiempoComida.Cena, "Hiperproteico", "Cenas hiperproteico"),
        new(TiempoComida.Cena, "Niños de 6 a 10 meses", "Niños de 6 a 10 meses"),
        new(TiempoComida.Cena, "Niños de 10 m en adelante", "Niños de 10 m en adelante"),
        new(TiempoComida.Cena, "Hipoproteico", "Cena hipoproteica"),
        new(TiempoComida.Cena, "Renal", "Cena renal"),
        new(TiempoComida.Cena, "Líquidos claros", "Cena líquidos claros"),
        new(TiempoComida.Cena, "Líquido completa", "Cena líquida completa"),
        new(TiempoComida.Cena, "Hiperproteico licuado completa", "Cena hiperproteica licuada completa"),
        new(TiempoComida.MediaNueve, "Merienda mañana", "Merienda mañana"),
        new(TiempoComida.Onces, "Merienda tarde", "Merienda tarde"),
        new(TiempoComida.MediaNoche, "Merienda noche", "Merienda noche"),
    ];

    /// <summary>
    /// Orden cancelada de almuerzo/cena sin fila: cocina ya la tenía en el turno.
    /// El desayuno cancelado sin etiqueta no se cobra.
    /// </summary>
    internal static bool EsOrdenHuerfanaSuministrada(OrdenCocina orden) =>
        orden.Comida is TiempoComida.Almuerzo or TiempoComida.Cena
        && string.Equals(orden.Estado, "Cancelada", StringComparison.OrdinalIgnoreCase);

    internal static string EtiquetaComidaContrato(TiempoComida comida) =>
        comida switch
        {
            TiempoComida.Desayuno => "Desayuno",
            TiempoComida.Almuerzo => "Almuerzo",
            TiempoComida.Cena => "Cena",
            TiempoComida.MediaNueve => "Merienda mañana",
            TiempoComida.Onces => "Merienda tarde",
            TiempoComida.MediaNoche => "Merienda noche",
            _ => comida.ToString(),
        };

    private static bool EsOrdenEnProduccion(string? estadoOrden) =>
        estadoOrden is "Completada" or "Despachada" or "EnPreparacion";

    internal static string ClavePeriodo(DateTime desde, DateTime hasta) =>
        $"{desde:yyyy-MM-dd}/{hasta:yyyy-MM-dd}";

    /// <summary>
    /// Rango de conciliación en fechas Colombia. Atajos: ultimos-7, ultimos-30, mes-anterior.
    /// </summary>
    internal static (DateTime Desde, DateTime Hasta) ResolverRango(
        DateTime? desde,
        DateTime? hasta,
        string? periodo)
    {
        var hoy = HorarioOperativoHelper.HoyColombia();
        if (desde.HasValue || hasta.HasValue)
        {
            var d = (desde ?? hoy.AddDays(-29)).Date;
            var h = (hasta ?? hoy).Date;
            return h < d ? (h, d) : (d, h);
        }

        var clave = (periodo ?? string.Empty).Trim().ToLowerInvariant()
            .Replace('_', '-');
        if (clave is "mes-anterior" or "mesanterior")
        {
            var primerDiaMes = new DateTime(hoy.Year, hoy.Month, 1);
            var fin = primerDiaMes.AddDays(-1);
            return (new DateTime(fin.Year, fin.Month, 1), fin);
        }

        if (clave is "ultimos-7" or "7d" or "7")
            return (hoy.AddDays(-6), hoy);

        return (hoy.AddDays(-29), hoy);
    }

    internal static Guid IdGrupoCorte(
        DateTime desde,
        DateTime hasta,
        TiempoComida comida,
        string linea)
    {
        var key = $"fcr|{desde:yyyy-MM-dd}|{hasta:yyyy-MM-dd}|{(int)comida}|{linea}";
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(key));
        var bytes = hash.AsSpan(0, 16).ToArray();
        bytes[6] = (byte)((bytes[6] & 0x0F) | 0x40);
        bytes[8] = (byte)((bytes[8] & 0x3F) | 0x80);
        return new Guid(bytes);
    }

    internal static decimal ResolverTarifaLineaContrato(
        IReadOnlyList<TarifaHistorico> tarifas,
        string linea,
        TiempoComida comida,
        DateTime fecha)
    {
        var tarifa = tarifas
            .Where(t =>
                t.TiempoComida == comida
                && TarifasCatalogoHelper.EsTarifaVigente(t, fecha.Date)
                && t.DietaCatalogo != null
                && LineaContrato(t.DietaCatalogo.Nombre) == linea)
            .OrderByDescending(t => t.VigenciaDesde)
            .FirstOrDefault();

        if (tarifa != null)
            return tarifa.Monto;

        return tarifas
            .Where(t =>
                t.TiempoComida == comida
                && TarifasCatalogoHelper.EsTarifaVigente(t, fecha.Date)
                && t.DietaCatalogoId == CatalogoNormalesId)
            .OrderByDescending(t => t.VigenciaDesde)
            .Select(t => t.Monto)
            .FirstOrDefault();
    }
}
