using Bital.Domain.Common;
using Bital.Domain.Enums;

namespace Bital.Domain.Entities.DietasCocina;

/// <summary>
/// Registro de eventos en el ciclo de vida de una dieta (trazabilidad)
/// </summary>
public class EventoTrazabilidad : EntityBase
{
    /// <summary>
    /// ID de la dieta asociada
    /// </summary>
    public Guid FilaDietaId { get; set; }

    /// <summary>
    /// Estado al que se transicionó
    /// </summary>
    public EstadoDieta EstadoNuevo { get; set; }

    /// <summary>
    /// Estado anterior
    /// </summary>
    public EstadoDieta? EstadoAnterior { get; set; }

    /// <summary>
    /// Tipo de evento (transición, novedad, cancelación, etc.)
    /// </summary>
    public string TipoEvento { get; set; } = string.Empty;

    /// <summary>
    /// Descripción del evento
    /// </summary>
    public string Descripcion { get; set; } = string.Empty;

    /// <summary>
    /// Usuario que generó el evento
    /// </summary>
    public string Usuario { get; set; } = string.Empty;

    /// <summary>
    /// Fecha y hora del evento
    /// </summary>
    public DateTime FechaEvento { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Datos adicionales en formato JSON (opcional)
    /// </summary>
    public string? DatosAdicionales { get; set; }

    // ============================================================================
    // Navegación
    // ============================================================================

    /// <summary>
    /// Dieta asociada
    /// </summary>
    public FilaDieta FilaDieta { get; set; } = null!;
}
