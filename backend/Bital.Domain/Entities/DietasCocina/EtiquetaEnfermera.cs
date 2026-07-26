using Bital.Domain.Enums;

namespace Bital.Domain.Entities.DietasCocina;

/// <summary>
/// Etiqueta de enfermería para el ciclo logístico de entrega de dietas
/// </summary>
public class EtiquetaEnfermera
{
    /// <summary>
    /// Identificador único de la etiqueta
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Código único de la etiqueta (QR/barcode)
    /// </summary>
    public required string Codigo { get; set; }

    /// <summary>
    /// ID de la orden de cocina asociada
    /// </summary>
    public Guid OrdenCocinaId { get; set; }

    /// <summary>
    /// Orden de cocina asociada
    /// </summary>
    public OrdenCocina? OrdenCocina { get; set; }

    /// <summary>
    /// ID de la dieta asociada
    /// </summary>
    public Guid FilaDietaId { get; set; }

    /// <summary>
    /// Dieta asociada
    /// </summary>
    public FilaDieta? FilaDieta { get; set; }

    /// <summary>
    /// Estado logístico de la etiqueta
    /// </summary>
    public required string EstadoLogistica { get; set; }

    /// <summary>
    /// Momento de comida
    /// </summary>
    public TiempoComida Comida { get; set; }

    /// <summary>
    /// Fecha operativa
    /// </summary>
    public DateTime FechaOperativa { get; set; }

    /// <summary>
    /// Usuario que generó la etiqueta
    /// </summary>
    public required string GeneradaPor { get; set; }

    /// <summary>
    /// Fecha de generación
    /// </summary>
    public DateTime GeneradaEn { get; set; }

    /// <summary>
    /// Fecha de impresión
    /// </summary>
    public DateTime? ImpresaEn { get; set; }

    /// <summary>
    /// Usuario que recibió en pre-entrega (enfermería)
    /// </summary>
    public string? RecibidoPor { get; set; }

    /// <summary>
    /// Fecha de pre-entrega (enfermería recibe)
    /// </summary>
    public DateTime? PreEntregadaEn { get; set; }

    /// <summary>
    /// Usuario que entregó al paciente
    /// </summary>
    public string? EntregadoPor { get; set; }

    /// <summary>
    /// Fecha de entrega al paciente
    /// </summary>
    public DateTime? EntregadaEn { get; set; }

    /// <summary>
    /// Motivo de devolución
    /// </summary>
    public string? MotivoDevolucion { get; set; }

    /// <summary>
    /// Estado de la dieta al momento de devolución
    /// </summary>
    public string? EstadoDietaDevolucion { get; set; }

    /// <summary>
    /// Observaciones de devolución
    /// </summary>
    public string? ObservacionesDevolucion { get; set; }

    /// <summary>
    /// URL de foto de evidencia de devolución
    /// </summary>
    public string? FotoDevolucionUrl { get; set; }

    /// <summary>
    /// Fecha de devolución
    /// </summary>
    public DateTime? DevueltaEn { get; set; }

    /// <summary>
    /// Observaciones generales
    /// </summary>
    public string? Observaciones { get; set; }
}
