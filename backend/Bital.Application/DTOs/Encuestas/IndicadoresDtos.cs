using Bital.Application.DTOs.DietasCocina;

namespace Bital.Application.DTOs.Encuestas;

public class FiltrosIndicadoresExperienciaDto
{
    public string? Rango { get; set; }
    public string? Servicio { get; set; }
    public string? PuntoAtencion { get; set; }
    public string? Eps { get; set; }
    public string? Contrato { get; set; }
    public string? Canal { get; set; }
}

public class KpiExperienciaDto
{
    public string Label { get; set; } = string.Empty;
    public string Valor { get; set; } = string.Empty;
    public string? Sufijo { get; set; }
    public TendenciaKpiDto? Trend { get; set; }
    public string? Nota { get; set; }
}

public class TendenciaKpiDto
{
    public string Direction { get; set; } = string.Empty;
    public string Texto { get; set; } = string.Empty;
}

public class SegmentoBarraDto
{
    public string Label { get; set; } = string.Empty;
    public int Value { get; set; }
    public string Color { get; set; } = string.Empty;
}

public class RespuestaIndicadoresExperienciaDto
{
    public List<KpiExperienciaDto> Kpis { get; set; } = new();
    public List<SegmentoBarraDto> Segmentos { get; set; } = new();
}

public class FiltrosAnalisisBrechasDto
{
    public string? Servicio { get; set; }
    public string? Estado { get; set; }
    public DateTime? Desde { get; set; }
    public DateTime? Hasta { get; set; }
    public string? Busqueda { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class FilaBrechaDto
{
    public string Id { get; set; } = string.Empty;
    public string Iniciales { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Documento { get; set; } = string.Empty;
    public string Fecha { get; set; } = string.Empty;
    public string Servicio { get; set; } = string.Empty;
    public string Convenio { get; set; } = string.Empty;
    public string Contacto { get; set; } = string.Empty;
    public string? GestionNombre { get; set; }
    public int Intentos { get; set; }
    public string Motivo { get; set; } = string.Empty;
    public string MotivoTono { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
}

public class KpisBrechasDto
{
    public int TotalBrechas { get; set; }
    public int EnGestion { get; set; }
    public int Pendientes { get; set; }
    public int Justificadas { get; set; }
    public int ContactoInvalido { get; set; }
}

public class RespuestaAnalisisBrechasDto
{
    public List<FilaBrechaDto> Data { get; set; } = new();
    public MetaPaginacionDto Meta { get; set; } = new();
    public KpisBrechasDto Kpis { get; set; } = new();
}
