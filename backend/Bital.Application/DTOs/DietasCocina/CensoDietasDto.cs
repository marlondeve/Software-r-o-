namespace Bital.Application.DTOs.DietasCocina;

/// <summary>
/// DTO para respuesta del censo de dietas
/// </summary>
public class CensoDietasDto
{
    public DateTime FechaOperativa { get; set; }
    public string Comida { get; set; } = string.Empty;
    public List<FilaDietaDto> Filas { get; set; } = new();
    public int TotalPacientes { get; set; }
    public int DietasSolicitadas { get; set; }
    public int DietasPendientes { get; set; }
    public int DietasConfirmadas { get; set; }
}
