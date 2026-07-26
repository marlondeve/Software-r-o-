using Bital.Domain.Enums;
using Bital.Application.DTOs.DietasCocina;

namespace Bital.Application.DTOs.Encuestas;

public class FiltrosCapturaPresencialDto
{
    public string? Servicio { get; set; }
    public string? Pabellon { get; set; }
    public string? Estado { get; set; }
    public string? Busqueda { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class FiltrosCapturaTelefonicaDto
{
    public string? Busqueda { get; set; }
    public string? TipoHospitalizacion { get; set; }
    public string? Servicio { get; set; }
    public string? Estado { get; set; }
    public DateTime? FechaCitaDesde { get; set; }
    public DateTime? FechaCitaHasta { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class PacienteCapturaPresencialDto
{
    public string NumeroDocumento { get; set; } = string.Empty;
    public string TipoDocumento { get; set; } = string.Empty;
    public string NombreCompleto { get; set; } = string.Empty;
    public string Servicio { get; set; } = string.Empty;
    public string Pabellon { get; set; } = string.Empty;
    public string Cama { get; set; } = string.Empty;
    public string EstadoEncuesta { get; set; } = string.Empty;
    public DateTime? FechaIngreso { get; set; }
    public int? IdIngreso { get; set; }
}

public class PacienteCapturaTelefonicaDto
{
    public string NumeroDocumento { get; set; } = string.Empty;
    public string TipoDocumento { get; set; } = string.Empty;
    public string NombreCompleto { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public string EstadoEncuesta { get; set; } = string.Empty;
    public string Servicio { get; set; } = string.Empty;
    public string TipoHospitalizacion { get; set; } = string.Empty;
    public DateTime? FechaCita { get; set; }
    public int IntentosLlamada { get; set; }
}

public class KpiCapturaPresencialDto
{
    public int PacientesActivos { get; set; }
    public int EncuestasCompletadas { get; set; }
    public int Pendientes { get; set; }
    public int NoDisponibles { get; set; }
    public int Rechazadas { get; set; }
}

public class KpiCapturaTelefonicaDto
{
    public int PacientesPorContactar { get; set; }
    public int Contactados { get; set; }
    public int ReintentosPendientes { get; set; }
    public int SinRespuesta { get; set; }
    public int Rechazos { get; set; }
    public int Completadas { get; set; }
}

public class RespuestaCapturaPresencialDto
{
    public List<PacienteCapturaPresencialDto> Data { get; set; } = new();
    public MetaPaginacionDto Meta { get; set; } = new();
    public KpiCapturaPresencialDto Kpis { get; set; } = new();
}

public class RespuestaCapturaTelefonicaDto
{
    public List<FilaCapturaTelefonicaDto> Data { get; set; } = new();
    public MetaPaginacionDto Meta { get; set; } = new();
    public KpiCapturaTelefonicaDto Kpis { get; set; } = new();
}

// DTOs base para consumo de consultas hospitalarias
public class BusquedaPacienteDto
{
    public string NumeroDocumento { get; set; } = string.Empty;
    public string TipoDocumento { get; set; } = string.Empty;
    public string PrimerNombre { get; set; } = string.Empty;
    public string SegundoNombre { get; set; } = string.Empty;
    public string PrimerApellido { get; set; } = string.Empty;
    public string SegundoApellido { get; set; } = string.Empty;
    public string NombreCompleto { get; set; } = string.Empty;
    public DateTime? FechaNacimiento { get; set; }
    public string? Sexo { get; set; }
    public string? Telefono { get; set; }
    public string? Estado { get; set; }
}

public class AtencionPacienteDto
{
    public int NumeroAtencion { get; set; }
    public DateTime FechaIngreso { get; set; }
    public DateTime? FechaEgreso { get; set; }
    public string ServicioDescripcion { get; set; } = string.Empty;
    public string? Pabellon { get; set; }
    public string? MedicoTratante { get; set; }
    public string? EstadoAtencion { get; set; }
    public string? Diagnostico { get; set; }
    public string? TipoHospitalizacion { get; set; }
}

public class IdentificarPacienteRequestDto
{
    public string NumeroDocumento { get; set; } = string.Empty;
    public string TipoDocumento { get; set; } = string.Empty;
    public CanalEncuesta Canal { get; set; }
    public int? NumeroAtencion { get; set; }
}

public class PacienteContextoDto
{
    public string NumeroDocumento { get; set; } = string.Empty;
    public string TipoDocumento { get; set; } = string.Empty;
    public string NombreCompleto { get; set; } = string.Empty;
    public CanalEncuesta Canal { get; set; }
    public string CanalNombre { get; set; } = string.Empty;
    public int? NumeroAtencion { get; set; }
    public string? ServicioAtencion { get; set; }
    public DateTime FechaIdentificacion { get; set; }
    public Guid IdentificacionId { get; set; }
}

public class EnvelopePacientesDto
{
    public List<BusquedaPacienteDto> Data { get; set; } = new();
    public int Total { get; set; }
}

public class EnvelopeAtencionesDto
{
    public List<AtencionPacienteDto> Data { get; set; } = new();
    public int Total { get; set; }
}
