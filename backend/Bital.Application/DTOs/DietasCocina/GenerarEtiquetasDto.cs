namespace Bital.Application.DTOs.DietasCocina;

/// <summary>
/// DTO para generar etiquetas desde órdenes completadas
/// </summary>
public class GenerarEtiquetasDto
{
    /// <summary>
    /// IDs de las órdenes de cocina en estado "Completada"
    /// </summary>
    public required List<Guid> OrdenIds { get; set; }
}
