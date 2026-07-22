namespace Bital.ApiConsultas.Contracts.Responses;

/// <summary>
/// Respuesta completa con información de paciente
/// </summary>
public class PacienteResponse
{
    public string PacienteId { get; set; } = string.Empty;
    public string NumeroDocumento { get; set; } = string.Empty;
    public string TipoDocumento { get; set; } = string.Empty;
    public string NombreCompleto { get; set; } = string.Empty;
    public string PrimerNombre { get; set; } = string.Empty;
    public string? SegundoNombre { get; set; }
    public string PrimerApellido { get; set; } = string.Empty;
    public string? SegundoApellido { get; set; }
    public DateTime FechaNacimiento { get; set; }
    public int Edad { get; set; }
    public string Genero { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public string? Email { get; set; }
    public string? Direccion { get; set; }
    public string? Ciudad { get; set; }
    public string? EPS { get; set; }
    public string? TipoAfiliacion { get; set; }
}
