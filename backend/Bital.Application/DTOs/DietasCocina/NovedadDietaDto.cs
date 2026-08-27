namespace Bital.Application.DTOs.DietasCocina;

/// <summary>
/// DTO para registrar una novedad en una dieta (cambio clínico posterior a la solicitud).
/// </summary>
public class NovedadDietaDto
{
    /// <summary>
    /// Tipo de evento de trazabilidad (p. ej. novedad_registrada).
    /// </summary>
    public string? TipoNovedad { get; set; }

    /// <summary>
    /// Motivo visible (p. ej. «Cambio clínico»).
    /// </summary>
    public string? Descripcion { get; set; }

    /// <summary>
    /// Alias del motivo enviado por el front legado.
    /// </summary>
    public string? Motivo { get; set; }

    /// <summary>
    /// Observaciones adicionales de la novedad (no sustituyen las de la dieta).
    /// </summary>
    public string? Observaciones { get; set; }

    public bool RequiereAccion { get; set; }

    public Guid? TipoDietaId { get; set; }
    public string? Consistencia { get; set; }
    public string? DescripcionDieta { get; set; }
    public bool? Aislado { get; set; }
    public string? Aislamiento { get; set; }
    public string? ObservacionAislamiento { get; set; }
    public bool? Alergico { get; set; }
    public string? Alergias { get; set; }
}
