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

    public static string NormalizarMotivoDevolucion(string motivo)
    {
        if (string.Equals(motivo, MotivoNpoLegacy, StringComparison.OrdinalIgnoreCase))
            return MotivoNvoCanonical;
        return motivo.Trim();
    }

    public static bool EsMotivoAntesEntrega(string motivo)
    {
        var normalizado = NormalizarMotivoDevolucion(motivo);
        return DevolucionAntesEntrega.Contains(normalizado, StringComparer.OrdinalIgnoreCase);
    }

    public static bool EsMotivoPostEntrega(string motivo)
    {
        var normalizado = NormalizarMotivoDevolucion(motivo);
        return DevolucionPostEntrega.Contains(normalizado, StringComparer.OrdinalIgnoreCase);
    }
}
