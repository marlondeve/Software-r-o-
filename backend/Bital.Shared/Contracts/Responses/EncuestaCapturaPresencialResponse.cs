namespace Bital.Shared.Contracts.Responses;

public class EncuestaCapturaPresencialResponse
{
    public int IdIngreso { get; set; }
    public string TipoDocumento { get; set; } = string.Empty;
    public string Cedula { get; set; } = string.Empty;
    public string NombreCompleto { get; set; } = string.Empty;
    public string EstadoPaciente { get; set; } = string.Empty;
    public string? Empresa { get; set; }
    public string Servicio { get; set; } = string.Empty;
    public string? CodigoPabellon { get; set; }
    public string Pabellon { get; set; } = string.Empty;
    public string Cama { get; set; } = string.Empty;
    public DateTime? FechaIngreso { get; set; }
    public string? Telefono { get; set; }
    public string? TipoHospitalizacion { get; set; }
}
