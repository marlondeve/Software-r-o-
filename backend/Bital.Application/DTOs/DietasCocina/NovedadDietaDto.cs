namespace Bital.Application.DTOs.DietasCocina;

/// <summary>
/// DTO para registrar una novedad en una dieta
/// </summary>
public class NovedadDietaDto
{
    /// <summary>
    /// Tipo de novedad: cambio_dieta, alergia_descubierta, rechazo_paciente, etc.
    /// </summary>
    public required string TipoNovedad { get; set; }

    /// <summary>
    /// Descripción detallada de la novedad
    /// </summary>
    public required string Descripcion { get; set; }

    /// <summary>
    /// Observaciones adicionales
    /// </summary>
    public string? Observaciones { get; set; }

    /// <summary>
    /// Indica si requiere acción inmediata
    /// </summary>
    public bool RequiereAccion { get; set; }
}
