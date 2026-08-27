namespace Bital.Infrastructure.DietasCocina;

/// <summary>
/// Catálogos de motivos alineados con el frontend (enums.ts, devolucionConfig.ts).
/// </summary>
public static class MotivosEtiquetasCatalogo
{
    public const string MotivoNvoCanonical = "Paciente en NVO o ayuno";
    public const string MotivoNpoLegacy = "Paciente en NPO o ayuno";

    public static readonly IReadOnlyList<string> DevolucionAntesEntrega =
    [
        "Paciente no estaba en habitación",
        MotivoNvoCanonical,
        "Paciente se negó antes de recibir",
        "Bandeja incorrecta para el paciente",
        "Bandeja dañada o contaminada",
        "Temperatura inadecuada",
    ];

    public static readonly IReadOnlyList<string> DevolucionPostEntrega =
    [
        "Se consumió",
        "Consumo parcial",
        "No se consumió",
        "Bandeja sin abrir",
    ];

    public static readonly IReadOnlyList<string> DevolucionTodos =
        DevolucionAntesEntrega.Concat(DevolucionPostEntrega).ToList();

    public static readonly IReadOnlyList<(string Id, string Label)> Cancelacion =
    [
        ("alta-medica", "Alta médica"),
        ("traslado", "Traslado"),
        ("fallecimiento", "Fallecimiento"),
        ("nvo", "NVO / Nada vía oral"),
        ("error-solicitud", "Error de solicitud"),
        ("otro", "Otro"),
    ];

    public static readonly HashSet<string> CancelacionIds =
        Cancelacion.Select(item => item.Id).ToHashSet(StringComparer.OrdinalIgnoreCase);

    /// <summary>
    /// Una devolución histórica puede no tener motivo registrado: se normaliza a
    /// cadena vacía para que ningún consumidor (reportes, KPIs) falle por nulo.
    /// </summary>
    public static string NormalizarMotivoDevolucion(string? motivo)
    {
        if (string.IsNullOrWhiteSpace(motivo))
            return string.Empty;

        if (string.Equals(motivo.Trim(), MotivoNpoLegacy, StringComparison.OrdinalIgnoreCase))
            return MotivoNvoCanonical;

        return motivo.Trim();
    }

    public static bool EsMotivoAntesEntrega(string? motivo)
    {
        var normalizado = NormalizarMotivoDevolucion(motivo);
        return normalizado.Length > 0
            && DevolucionAntesEntrega.Contains(normalizado, StringComparer.OrdinalIgnoreCase);
    }

    public static bool EsMotivoPostEntrega(string? motivo)
    {
        var normalizado = NormalizarMotivoDevolucion(motivo);
        return normalizado.Length > 0
            && DevolucionPostEntrega.Contains(normalizado, StringComparer.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Clasifica una devolución igual que el frontend (devolucionConfig.ts): manda el
    /// motivo y, si no está catalogado, decide si la bandeja llegó al paciente. Así toda
    /// devolución cae en exactamente una categoría y el reporte coincide con la pantalla.
    /// </summary>
    public static bool EsRechazoAntesEntrega(string? motivo, bool huboEntrega)
    {
        if (EsMotivoAntesEntrega(motivo)) return true;
        if (EsMotivoPostEntrega(motivo)) return false;
        return !huboEntrega;
    }

    public static bool EsRecogidaPostEntrega(string? motivo, bool huboEntrega) =>
        !EsRechazoAntesEntrega(motivo, huboEntrega);
}
