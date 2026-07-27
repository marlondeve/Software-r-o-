using Bital.Domain.Common;

namespace Bital.Domain.Entities.DietasCocina;

/// <summary>
/// Orden de producción para cocina (una orden agrupa múltiples dietas)
/// </summary>
public class OrdenCocina : EntityBase
{
    /// <summary>
    /// Número correlativo de la orden
    /// </summary>
    public int NumeroOrden { get; set; }

    /// <summary>
    /// Tiempo de comida de esta orden
    /// </summary>
    public Enums.TiempoComida Comida { get; set; }

    /// <summary>
    /// Fecha operativa de la orden
    /// </summary>
    public DateTime FechaOperativa { get; set; }

    /// <summary>
    /// Total de dietas en la orden
    /// </summary>
    public int TotalDietas { get; set; }

    /// <summary>
    /// Usuario que generó la orden
    /// </summary>
    public string GeneradoPor { get; set; } = string.Empty;

    /// <summary>
    /// Fecha y hora de generación
    /// </summary>
    public DateTime GeneradoEn { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Estado de la orden (Pendiente, EnPreparacion, Completada)
    /// </summary>
    public string Estado { get; set; } = "Pendiente";

    /// <summary>
    /// Observaciones generales
    /// </summary>
    public string? Observaciones { get; set; }

    /// <summary>
    /// Estado del checklist operativo serializado (JSON)
    /// </summary>
    public string? ChecklistJson { get; set; }

    // ============================================================================
    // Navegación
    // ============================================================================

    /// <summary>
    /// Dietas incluidas en esta orden
    /// </summary>
    public ICollection<FilaDieta> Dietas { get; set; } = new List<FilaDieta>();
}
