namespace Bital.Application.DTOs.DietasCocina;

/// <summary>
/// DTO para órdenes de cocina
/// </summary>
public class OrdenCocinaDto
{
    /// <summary>
    /// ID de la orden
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Número correlativo de la orden
    /// </summary>
    public int NumeroOrden { get; set; }

    /// <summary>
    /// Tiempo de comida
    /// </summary>
    public string Comida { get; set; } = string.Empty;

    /// <summary>
    /// Fecha operativa
    /// </summary>
    public DateTime FechaOperativa { get; set; }

    /// <summary>
    /// Total de dietas incluidas
    /// </summary>
    public int TotalDietas { get; set; }

    /// <summary>
    /// Estado de la orden
    /// </summary>
    public string Estado { get; set; } = string.Empty;

    /// <summary>
    /// Usuario que generó la orden
    /// </summary>
    public string GeneradoPor { get; set; } = string.Empty;

    /// <summary>
    /// Fecha de generación
    /// </summary>
    public DateTime GeneradoEn { get; set; }

    /// <summary>
    /// Observaciones
    /// </summary>
    public string? Observaciones { get; set; }

    /// <summary>
    /// Lista de dietas incluidas (opcional, para detalle)
    /// </summary>
    public List<FilaDietaDto>? Dietas { get; set; }
}
