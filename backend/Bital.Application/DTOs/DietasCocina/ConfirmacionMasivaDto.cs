namespace Bital.Application.DTOs.DietasCocina;

/// <summary>
/// DTO para confirmación masiva de dietas
/// </summary>
public class ConfirmacionMasivaDto
{
    public List<Guid> DietasIds { get; set; } = new();
    public string Usuario { get; set; } = string.Empty;
}
