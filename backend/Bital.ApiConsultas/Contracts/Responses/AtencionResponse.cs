namespace Bital.ApiConsultas.Contracts.Responses;

/// <summary>
/// Respuesta con información de un ingreso/atención desde Vital HIS
/// </summary>
public class AtencionResponse
{
    public string Cedula { get; set; } = string.Empty;
    public string TipoDocumento { get; set; } = string.Empty;
    public int Consecutivo { get; set; }
    public PacienteBasicoResponse Paciente { get; set; } = null!;
    public string? ClaseProcedimiento { get; set; }
    public DateTime? FechaAdmision { get; set; }
    public DateTime? FechaEgreso { get; set; }
    public string EstadoActual { get; set; } = string.Empty;
    public bool EstaActivo { get; set; }
    public string? DiagnosticoEntrada { get; set; }
    public string? DiagnosticoSalida { get; set; }
    public string? TipoHospitalizacion { get; set; }
    public string? NumeroFactura { get; set; }
}

/// <summary>
/// Información básica de paciente dentro de una atención
/// </summary>
public class PacienteBasicoResponse
{
    public string Cedula { get; set; } = string.Empty;
    public string TipoDocumento { get; set; } = string.Empty;
    public string NombreCompleto { get; set; } = string.Empty;
    public string? PrimerNombre { get; set; }
    public string? SegundoNombre { get; set; }
    public string? PrimerApellido { get; set; }
    public string? SegundoApellido { get; set; }
    public DateTime? FechaNacimiento { get; set; }
    public int? Edad { get; set; }
    public string? Sexo { get; set; }
}
