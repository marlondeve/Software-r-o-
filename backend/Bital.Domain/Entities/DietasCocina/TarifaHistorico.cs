using Bital.Domain.Common;

namespace Bital.Domain.Entities.DietasCocina;

/// <summary>
/// Registro histórico de tarifas por año para un tipo de dieta
/// </summary>
public class TarifaHistorico : EntityBase
{
    /// <summary>
    /// ID de la dieta en el catálogo
    /// </summary>
    public Guid DietaCatalogoId { get; set; }

    /// <summary>
    /// Año de vigencia de la tarifa
    /// </summary>
    public int Anio { get; set; }

    /// <summary>
    /// Monto de la tarifa
    /// </summary>
    public decimal Monto { get; set; }

    /// <summary>
    /// Fecha de inicio de vigencia
    /// </summary>
    public DateTime VigenciaDesde { get; set; }

    /// <summary>
    /// Fecha de fin de vigencia
    /// </summary>
    public DateTime VigenciaHasta { get; set; }

    /// <summary>
    /// Indica si esta tarifa está activa
    /// </summary>
    public bool Activa { get; set; } = true;

    /// <summary>
    /// Observaciones o justificación del cambio
    /// </summary>
    public string? Observaciones { get; set; }

    // ============================================================================
    // Navegación
    // ============================================================================

    /// <summary>
    /// Dieta asociada a esta tarifa
    /// </summary>
    public DietaCatalogo DietaCatalogo { get; set; } = null!;
}
