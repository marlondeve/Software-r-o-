namespace Bital.Application.DTOs.DietasCocina;

/// <summary>
/// DTO para el catálogo de dietas
/// </summary>
public class DietaCatalogoDto
{
    public Guid Id { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public decimal? TarifaActual { get; set; }
    public bool Activa { get; set; }
}
