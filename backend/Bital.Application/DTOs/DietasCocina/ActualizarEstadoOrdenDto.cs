namespace Bital.Application.DTOs.DietasCocina;

/// <summary>
/// DTO para actualizar el estado de una orden de cocina
/// </summary>
public class ActualizarEstadoOrdenDto
{
    /// <summary>
    /// Nuevo estado de la orden
    /// </summary>
    public required string Estado { get; set; }

    /// <summary>
    /// Observaciones del cambio de estado
    /// </summary>
    public string? Observaciones { get; set; }
}
