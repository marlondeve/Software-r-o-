namespace Bital.Application.DTOs.DietasCocina;

/// <summary>
/// DTO para el histórico de tarifas de una dieta del catálogo
/// </summary>
public class TarifaHistoricoDto
{
    public Guid Id { get; set; }
    public int Anio { get; set; }
    public decimal Monto { get; set; }
    public DateTime VigenciaDesde { get; set; }
    public DateTime VigenciaHasta { get; set; }
    public bool Vigente { get; set; }
    public string RegistradoPor { get; set; } = string.Empty;
    public string? MotivoCambio { get; set; }
    public DateTime CreadoEn { get; set; }
}
