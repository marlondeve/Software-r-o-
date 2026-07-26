using Bital.Domain.Enums;
using Bital.Application.DTOs.DietasCocina;

namespace Bital.Application.DTOs.Encuestas;

public class IniciarCapturaEncuestaRequestDto
{
    public Guid CuestionarioId { get; set; }
}

public class InicioCapturaEncuestaResponseDto
{
    public Guid CapturaId { get; set; }
    public List<SeccionEncuestaDto> Secciones { get; set; } = new();
}

public class SeccionEncuestaDto
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public int Orden { get; set; }
    public List<PreguntaEncuestaDto> Preguntas { get; set; } = new();
}

public class PreguntaEncuestaDto
{
    public Guid Id { get; set; }
    public string Texto { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty;
    public bool EsRequerida { get; set; }
    public int Orden { get; set; }
    public bool Activa { get; set; } = true;
    public List<string> Opciones { get; set; } = new();
    public string? Respuesta { get; set; }
}

public class RespuestaPreguntaEncuestaDto
{
    public Guid PreguntaId { get; set; }
    public string? Valor { get; set; }
    public List<string> Valores { get; set; } = new();
}

public class RespuestaSeccionEncuestaDto
{
    public Guid SeccionId { get; set; }
    public List<RespuestaPreguntaEncuestaDto> Respuestas { get; set; } = new();
}

public class GuardarRespuestasEncuestaRequestDto
{
    public List<RespuestaSeccionEncuestaDto> Secciones { get; set; } = new();
}

public class FinalizarEncuestaRequestDto
{
    public List<RespuestaSeccionEncuestaDto> Secciones { get; set; } = new();
}

public class FinalizarEncuestaResponseDto
{
    public string Consecutivo { get; set; } = string.Empty;
}

public class IntentoLlamadaRequestDto
{
    public string Resultado { get; set; } = string.Empty;
    public string? Observaciones { get; set; }
    public DateTime FechaIntento { get; set; } = DateTime.UtcNow;
}

public class FilaCapturaTelefonicaDto
{
    public string Id { get; set; } = string.Empty;
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

public class RespuestaCapturaTelefonicaInicioDto
{
    public string Redirect { get; set; } = string.Empty;
}
