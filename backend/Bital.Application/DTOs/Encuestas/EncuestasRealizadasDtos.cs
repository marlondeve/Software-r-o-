using Bital.Application.DTOs.DietasCocina;

namespace Bital.Application.DTOs.Encuestas;

public class FiltrosEncuestasRealizadasDto
{
    public DateTime? FechaDesde { get; set; }
    public DateTime? FechaHasta { get; set; }
    public string? Servicio { get; set; }
    public string? Canal { get; set; }
    public string? Estado { get; set; }
    public string? Sat { get; set; }
    public string? Nps { get; set; }
    public string? Busqueda { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 24;
}

public class FilaEncuestaRealizadaDto
{
    public string Id { get; set; } = string.Empty;
    public string Consecutivo { get; set; } = string.Empty;
    public string NumeroDocumento { get; set; } = string.Empty;
    public string TipoDocumento { get; set; } = string.Empty;
    public string NombreCompleto { get; set; } = string.Empty;
    public string Servicio { get; set; } = string.Empty;
    public string Canal { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
    public DateTime FechaRealizacion { get; set; }
    public int? Sat { get; set; }
    public int? Nps { get; set; }
    public bool RequiereSeguimiento { get; set; }
}

public class DetalleEncuestaRealizadaDto : FilaEncuestaRealizadaDto
{
    public List<RespuestaEncuestaDetalleDto> Respuestas { get; set; } = new();
    public string? MotivoAnulacion { get; set; }
    public DateTime? FechaAnulacion { get; set; }
    public string? UsuarioAnulacion { get; set; }
}

public class RespuestaEncuestaDetalleDto
{
    public string Seccion { get; set; } = string.Empty;
    public string Pregunta { get; set; } = string.Empty;
    public string? Valor { get; set; }
}

public class ListaEncuestasRealizadasDto
{
    public List<FilaEncuestaRealizadaDto> Data { get; set; } = new();
    public MetaPaginacionDto Meta { get; set; } = new();
}

public class AnularEncuestaRequestDto
{
    public string Motivo { get; set; } = string.Empty;
    public bool Confirmada { get; set; }
}
