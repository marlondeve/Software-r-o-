namespace Bital.Application.DTOs.DietasCocina;

/// <summary>
/// DTO para marcar etiquetas como impresas o reimpresas
/// </summary>
public class MarcarImpresasDto
{
    /// <summary>
    /// IDs de las etiquetas a marcar
    /// </summary>
    public required List<Guid> EtiquetaIds { get; set; }
}
