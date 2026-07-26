using Bital.Domain.Common;

namespace Bital.Domain.Entities.DietasCocina;

/// <summary>
/// Catálogo de tipos de dietas con tarifas históricas
/// </summary>
public class DietaCatalogo : EntityBase
{
    /// <summary>
    /// Código único del tipo de dieta
    /// </summary>
    public string Codigo { get; set; } = string.Empty;

    /// <summary>
    /// Nombre del tipo de dieta
    /// </summary>
    public string Nombre { get; set; } = string.Empty;

    /// <summary>
    /// Descripción detallada
    /// </summary>
    public string Descripcion { get; set; } = string.Empty;

    /// <summary>
    /// Fecha de inicio de vigencia
    /// </summary>
    public DateTime FechaInicio { get; set; }

    /// <summary>
    /// Fecha de fin de vigencia (null = indefinida)
    /// </summary>
    public DateTime? FechaFin { get; set; }

    /// <summary>
    /// Usuario que realizó la última actualización
    /// </summary>
    public string Usuario { get; set; } = string.Empty;

    /// <summary>
    /// Indica si la dieta está activa (soft delete)
    /// </summary>
    public bool Activa { get; set; } = true;

    // ============================================================================
    // Navegación
    // ============================================================================

    /// <summary>
    /// Histórico de tarifas de esta dieta
    /// </summary>
    public ICollection<TarifaHistorico> HistoricoTarifas { get; set; } = new List<TarifaHistorico>();

    /// <summary>
    /// Dietas que usan este catálogo
    /// </summary>
    public ICollection<FilaDieta> Dietas { get; set; } = new List<FilaDieta>();
}
