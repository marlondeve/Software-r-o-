namespace Bital.Application.DTOs.DietasCocina;

/// <summary>
/// DTO para solicitar o actualizar una dieta
/// </summary>
public class SolicitudDietaDto
{
    public Guid? Id { get; set; }
    public Guid? TipoDietaId { get; set; }
    public string? Consistencia { get; set; }
    public string? DescripcionDieta { get; set; }
    public string? Observaciones { get; set; }
    public bool Guardar { get; set; } // true = guardar sin confirmar, false = confirmar inmediatamente
}
