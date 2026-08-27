namespace Bital.Application.DTOs.DietasCocina;

/// <summary>
/// Filtros opcionales para el reporte operativo de preparación de dietas (cocina).
/// </summary>
public class FiltrosReporteCocinaDto
{
    public DateTime Fecha { get; set; }
    public string Comida { get; set; } = string.Empty;
    public string? Pabellon { get; set; }
    public string? Habitacion { get; set; }
    public string? TipoDieta { get; set; }
    public string? Consistencia { get; set; }
    public string? EstadoCocina { get; set; }
    public string? Seguimiento { get; set; }
    public bool? SoloAislados { get; set; }
    public string? Busqueda { get; set; }
}
