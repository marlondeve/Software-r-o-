namespace Bital.Application.DTOs.DietasCocina;

/// <summary>
/// DTO de respuesta para etiqueta de enfermería
/// </summary>
public class EtiquetaEnfermeraDto
{
    public Guid Id { get; set; }
    public required string Codigo { get; set; }
    public Guid OrdenCocinaId { get; set; }
    public int NumeroOrden { get; set; }
    public Guid FilaDietaId { get; set; }
    public required string PacienteId { get; set; }
    public required string Paciente { get; set; }
    public required string Cedula { get; set; }
    public required string Pabellon { get; set; }
    public required string Habitacion { get; set; }
    public required string Comida { get; set; }
    public required string TipoDieta { get; set; }
    public required string Consistencia { get; set; }
    public required string EstadoLogistica { get; set; }
    public DateTime FechaOperativa { get; set; }
    public required string GeneradaPor { get; set; }
    public DateTime GeneradaEn { get; set; }
    public DateTime? ImpresaEn { get; set; }
    public string? RecibidoPor { get; set; }
    public DateTime? PreEntregadaEn { get; set; }
    public string? EntregadoPor { get; set; }
    public DateTime? EntregadaEn { get; set; }
    public string? MotivoDevolucion { get; set; }
    public string? EstadoDietaDevolucion { get; set; }
    public string? ObservacionesDevolucion { get; set; }
    public string? FotoDevolucionUrl { get; set; }
    public DateTime? DevueltaEn { get; set; }
    public string? Observaciones { get; set; }
}
