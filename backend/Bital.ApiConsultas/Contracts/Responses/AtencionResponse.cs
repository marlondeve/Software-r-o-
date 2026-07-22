namespace Bital.ApiConsultas.Contracts.Responses;

/// <summary>
/// Respuesta con información de una atención hospitalaria activa
/// </summary>
public class AtencionResponse
{
    public string AtencionId { get; set; } = string.Empty;
    public string NumeroAtencion { get; set; } = string.Empty;
    public PacienteBasicoResponse Paciente { get; set; } = null!;
    public string ServicioId { get; set; } = string.Empty;
    public string ServicioNombre { get; set; } = string.Empty;
    public string? HabitacionNumero { get; set; }
    public string? CamaNumero { get; set; }
    public DateTime FechaIngreso { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string? TipoAtencion { get; set; }
    public string? Diagnostico { get; set; }
}

/// <summary>
/// Información básica de paciente dentro de una atención
/// </summary>
public class PacienteBasicoResponse
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
}
