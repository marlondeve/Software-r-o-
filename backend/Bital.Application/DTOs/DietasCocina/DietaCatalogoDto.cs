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
    public Dictionary<string, decimal> TarifasVigentes { get; set; } = new();
    public bool Activa { get; set; }
    public DateTime FechaInicio { get; set; }
    public DateTime? FechaFin { get; set; }
    public string Usuario { get; set; } = string.Empty;
    public DateTime? ModificadoEn { get; set; }
    /// <summary>
    /// Estado de vigencia: vigente | programada | vencida
    /// </summary>
    public string Estado { get; set; } = "vigente";
    public List<TarifaHistoricoDto> HistoricoTarifas { get; set; } = new();
}
