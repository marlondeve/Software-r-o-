namespace Bital.Application.DTOs.DietasCocina;

/// <summary>
/// DTO para crear una nueva orden de cocina
/// </summary>
public class CrearOrdenCocinaDto
{
    /// <summary>
    /// Fecha operativa para la orden
    /// </summary>
    public required DateTime FechaOperativa { get; set; }

    /// <summary>
    /// Tiempo de comida
    /// </summary>
    public required string Comida { get; set; }

    /// <summary>
    /// IDs de las dietas confirmadas a incluir en la orden
    /// </summary>
    public required List<Guid> DietasIds { get; set; }

    /// <summary>
    /// Observaciones opcionales
    /// </summary>
    public string? Observaciones { get; set; }
}
