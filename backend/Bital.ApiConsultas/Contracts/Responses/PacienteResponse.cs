namespace Bital.ApiConsultas.Contracts.Responses;

/// <summary>
/// Respuesta completa con información de paciente desde Vital HIS
/// </summary>
public class PacienteResponse
{
    public string Cedula { get; set; } = string.Empty;
    public string TipoDocumento { get; set; } = string.Empty;
    public string NombreCompleto { get; set; } = string.Empty;
    public string? PrimerNombre { get; set; }
    public string? SegundoNombre { get; set; }
    public string? PrimerApellido { get; set; }
    public string? SegundoApellido { get ; set; }
    public DateTime? FechaNacimiento { get; set; }
    public int? Edad { get; set; }
    public string? Sexo { get; set; }
    public string? Telefono { get; set; }
    public string? Email { get; set; }
    public string? Direccion { get; set; }
    public string? Municipio { get; set; }
    public string? Estado { get; set; }
    public string? NitEntidad { get; set; }
    public DateTime? FechaAfiliacion { get; set; }
}
