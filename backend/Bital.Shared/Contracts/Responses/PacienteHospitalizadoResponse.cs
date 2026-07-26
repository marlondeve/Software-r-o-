namespace Bital.Shared.Contracts.Responses;

/// <summary>
/// Respuesta con información de paciente hospitalizado incluyendo ubicación
/// </summary>
public class PacienteHospitalizadoResponse
{
    public string PacienteId { get; set; } = string.Empty;
    public int IdIngreso { get; set; }
    public string? Cedula { get; set; }
    public string? TipoDocumento { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public int Edad { get; set; }
    public string? Sexo { get; set; }

    // Ubicación hospitalaria
    public string Servicio { get; set; } = string.Empty;
    public string Pabellon { get; set; } = string.Empty;
    public string Habitacion { get; set; } = string.Empty;
    public string? Cama { get; set; }

    // Información clínica relevante
    public DateTime FechaIngreso { get; set; }
    public string? DiagnosticoPrincipal { get; set; }
    public string? EstadoPaciente { get; set; }
}
