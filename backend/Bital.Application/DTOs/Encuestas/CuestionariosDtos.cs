using Bital.Application.DTOs.DietasCocina;
using Bital.Domain.Enums;

namespace Bital.Application.DTOs.Encuestas;

public class FiltrosCuestionariosDto
{
    public EstadoCuestionario? Estado { get; set; }
    public CanalEncuesta? Canal { get; set; }
    public string? Busqueda { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class CuestionarioResumenDto
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public CanalEncuesta Canal { get; set; }
    public EstadoCuestionario Estado { get; set; }
    public int TotalSecciones { get; set; }
    public int TotalPreguntas { get; set; }
    public DateTime FechaCreacion { get; set; }
    public DateTime? UltimaActualizacion { get; set; }
}

public class CuestionarioDetalleDto : CuestionarioResumenDto
{
    public List<SeccionCuestionarioDto> Secciones { get; set; } = new();
}

public class ListaCuestionariosDto
{
    public List<CuestionarioResumenDto> Data { get; set; } = new();
    public MetaPaginacionDto Meta { get; set; } = new();
}

public class CuestionarioCreacionDto
{
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public CanalEncuesta Canal { get; set; }
}

public class CuestionarioActualizacionDto
{
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public CanalEncuesta Canal { get; set; }
}

public class CuestionarioEstadoDto
{
    public EstadoCuestionario Estado { get; set; }
}

public class CuestionarioDuplicadoDto
{
    public string? Nombre { get; set; }
}

public class SeccionCuestionarioDto
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public int Orden { get; set; }
    public List<PreguntaCuestionarioDto> Preguntas { get; set; } = new();
}

public class PreguntaCuestionarioDto
{
    public Guid Id { get; set; }
    public Guid SeccionId { get; set; }
    public string Texto { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty;
    public bool EsRequerida { get; set; }
    public int Orden { get; set; }
    public bool Activa { get; set; }
    public List<string> Opciones { get; set; } = new();
    public LogicaCondicionalDto? Logica { get; set; }
}

public class LogicaCondicionalDto
{
    public Guid? PreguntaOrigenId { get; set; }
    public string? Operador { get; set; }
    public string? Valor { get; set; }
    public string? Accion { get; set; }
}

public class EstructuraCuestionarioDto
{
    public List<SeccionCuestionarioDto> Secciones { get; set; } = new();
}

public class SeccionCuestionarioCreacionDto
{
    public string Nombre { get; set; } = string.Empty;
    public int Orden { get; set; }
    public List<PreguntaCuestionarioCreacionDto> Preguntas { get; set; } = new();
}

public class PreguntaCuestionarioCreacionDto
{
    public string Texto { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty;
    public bool EsRequerida { get; set; }
    public int Orden { get; set; }
    public bool Activa { get; set; } = true;
    public List<string> Opciones { get; set; } = new();
    public LogicaCondicionalDto? Logica { get; set; }
}

public class PreguntaCuestionarioActualizacionDto : PreguntaCuestionarioCreacionDto
{
}

public class LogicaPreguntaCuestionarioDto
{
    public LogicaCondicionalDto? Logica { get; set; }
}
