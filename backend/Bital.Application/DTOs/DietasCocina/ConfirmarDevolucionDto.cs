namespace Bital.Application.DTOs.DietasCocina;

/// <summary>
/// DTO para registrar devolución de dieta
/// </summary>
public class ConfirmarDevolucionDto
{
    /// <summary>
    /// Motivo de la devolución
    /// </summary>
    public required string Motivo { get; set; }

    /// <summary>
    /// Estado de la dieta al momento de devolución (consumida parcialmente, intacta, etc.)
    /// </summary>
    public required string EstadoDieta { get; set; }

    /// <summary>
    /// Observaciones adicionales
    /// </summary>
    public string? Observaciones { get; set; }

    /// <summary>
    /// URL de foto de evidencia (opcional, puede subirse después)
    /// </summary>
    public string? FotoUrl { get; set; }
}
