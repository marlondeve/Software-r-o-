namespace Bital.Application.DTOs.DietasCocina;

/// <summary>
/// Monto tarifario para un tiempo de comida específico.
/// </summary>
public class TarifaComidaDto
{
    public required string TiempoComida { get; set; }
    public decimal Monto { get; set; }
}
