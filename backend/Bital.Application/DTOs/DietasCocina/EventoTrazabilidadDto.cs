namespace Bital.Application.DTOs.DietasCocina;

/// <summary>
/// DTO para eventos de trazabilidad de dietas
/// </summary>
public class EventoTrazabilidadDto
{
    /// <summary>
    /// ID del evento
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Tipo de evento
    /// </summary>
    public required string TipoEvento { get; set; }

    /// <summary>
    /// Descripción del evento
    /// </summary>
    public required string Descripcion { get; set; }

    /// <summary>
    /// Estado anterior
    /// </summary>
    public string? EstadoAnterior { get; set; }

    /// <summary>
    /// Estado nuevo
    /// </summary>
    public string? EstadoNuevo { get; set; }

    /// <summary>
    /// Usuario que generó el evento
    /// </summary>
    public required string Usuario { get; set; }

    /// <summary>
    /// Fecha del evento
    /// </summary>
    public DateTime FechaEvento { get; set; }

    /// <summary>
    /// Datos adicionales
    /// </summary>
    public string? DatosAdicionales { get; set; }
}
