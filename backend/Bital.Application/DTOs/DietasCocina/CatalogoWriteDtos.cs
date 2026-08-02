namespace Bital.Application.DTOs.DietasCocina;

public class CrearDietaCatalogoDto
{
    public required string Codigo { get; set; }
    public required string Nombre { get; set; }
    public string Descripcion { get; set; } = string.Empty;
    public DateTime? FechaInicio { get; set; }
    public DateTime? FechaFin { get; set; }
    public bool Activa { get; set; } = true;
    public decimal? TarifaInicial { get; set; }
    public List<TarifaComidaDto>? TarifasIniciales { get; set; }
    public DateTime? VigenciaDesde { get; set; }
    public DateTime? VigenciaHasta { get; set; }
    public string? MotivoTarifa { get; set; }
}

public class ActualizarDietaCatalogoDto
{
    public string? Nombre { get; set; }
    public string? Descripcion { get; set; }
    public DateTime? FechaInicio { get; set; }
    public DateTime? FechaFin { get; set; }
    public bool? Activa { get; set; }
}

public class NuevaTarifaDto
{
    public decimal Monto { get; set; }
    public List<TarifaComidaDto>? Tarifas { get; set; }
    public required DateTime VigenciaDesde { get; set; }
    public required DateTime VigenciaHasta { get; set; }
    public string? MotivoCambio { get; set; }
}
