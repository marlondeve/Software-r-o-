using Bital.Application.DTOs.DietasCocina;

namespace Bital.Application.DTOs.Encuestas;

public class FiltrosAuditoriaEncuestasDto
{
    public string? Modulo { get; set; }
    public string? Resultado { get; set; }
    public DateTime? Desde { get; set; }
    public DateTime? Hasta { get; set; }
    public string? Usuario { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class DetalleAuditoriaEncuestaCampoDto
{
    public string Tipo { get; set; } = string.Empty;
    public string Titulo { get; set; } = string.Empty;
    public string Subtitulo { get; set; } = string.Empty;
}

public class DetalleAuditoriaEncuestaCambioDto
{
    public string? ValorAnterior { get; set; }
    public string? ValorNuevo { get; set; }
}

public class FilaAuditoriaEncuestaDto
{
    public string Id { get; set; } = string.Empty;
    public string IdEvento { get; set; } = string.Empty;
    public string Fecha { get; set; } = string.Empty;
    public string Relativo { get; set; } = string.Empty;
    public string UsuarioNombre { get; set; } = string.Empty;
    public string UsuarioRol { get; set; } = string.Empty;
    public string Modulo { get; set; } = string.Empty;
    public string Accion { get; set; } = string.Empty;
    public bool? AccionAlerta { get; set; }
    public string IdRegistro { get; set; } = string.Empty;
    public string IdSecundario { get; set; } = string.Empty;
    public string DetalleTipo { get; set; } = string.Empty;
    public string? DetalleTexto { get; set; }
    public string? DetalleAntes { get; set; }
    public string? DetalleDespues { get; set; }
    public string Resultado { get; set; } = string.Empty;
    public string OrigenIp { get; set; } = string.Empty;
    public string OrigenDispositivo { get; set; } = string.Empty;
}

public class DetalleAuditoriaEncuestaDto : FilaAuditoriaEncuestaDto
{
    public List<DetalleAuditoriaEncuestaCampoDto> Contexto { get; set; } = new();
    public DetalleAuditoriaEncuestaCambioDto? Modificacion { get; set; }
    public string? Motivo { get; set; }
    public string? DatosAntes { get; set; }
    public string? DatosDespues { get; set; }
    public string? Metadata { get; set; }
    public string? MensajeError { get; set; }
    public int? DuracionMs { get; set; }
}

public class ListaAuditoriaEncuestasDto
{
    public List<FilaAuditoriaEncuestaDto> Data { get; set; } = new();
    public MetaPaginacionDto Meta { get; set; } = new();
}

public class FiltrosUsuariosEncuestasDto
{
    public string? Rol { get; set; }
    public bool? Activo { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class CrearUsuarioEncuestasDto
{
    public string Nombre { get; set; } = string.Empty;
    public string Usuario { get; set; } = string.Empty;
    public string Correo { get; set; } = string.Empty;
    public string Rol { get; set; } = "Encuestador";
    public string? ServicioArea { get; set; }
    public string? Origen { get; set; }
}

public class CambiarRolEncuestasDto
{
    public string Rol { get; set; } = "Encuestador";
}

public class UsuarioEncuestasModuloDto
{
    public string Id { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Usuario { get; set; } = string.Empty;
    public string Correo { get; set; } = string.Empty;
    public string Rol { get; set; } = string.Empty;
    public string ServicioArea { get; set; } = string.Empty;
    public string? OrgProveedora { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string UltimoAcceso { get; set; } = string.Empty;
    public string Origen { get; set; } = string.Empty;
}

public class ListaUsuariosEncuestasDto
{
    public List<UsuarioEncuestasModuloDto> Data { get; set; } = new();
    public MetaPaginacionDto Meta { get; set; } = new();
}

public class KpiInicioEncuestasDto
{
    public string Label { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public object? Trend { get; set; }
    public string? Footnote { get; set; }
    public int? Progreso { get; set; }
    public string? IconTone { get; set; }
}

public class CapturaRecienteEncuestaDto
{
    public string Id { get; set; } = string.Empty;
    public string Paciente { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty;
    public string Fecha { get; set; } = string.Empty;
    public int Puntuacion { get; set; }
    public int PuntuacionMax { get; set; }
    public string Estado { get; set; } = string.Empty;
}

public class AccionRapidaEncuestaDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string To { get; set; } = string.Empty;
}

public class SincronizacionEncuestaDto
{
    public string Fuente { get; set; } = string.Empty;
    public int HaceMin { get; set; }
}

public class IndicadorClaveEncuestaDto
{
    public string Label { get; set; } = string.Empty;
    public int Value { get; set; }
    public string Color { get; set; } = string.Empty;
}

public class RequiereAtencionEncuestaDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class DashboardInicioEncuestasDto
{
    public string Fecha { get; set; } = string.Empty;
    public string Periodo { get; set; } = string.Empty;
    public int SincronizadoHaceMin { get; set; }
    public List<KpiInicioEncuestasDto> Kpis { get; set; } = new();
    public List<CapturaRecienteEncuestaDto> CapturasRecientes { get; set; } = new();
    public List<AccionRapidaEncuestaDto> AccionesRapidas { get; set; } = new();
    public SincronizacionEncuestaDto UltimaSincronizacion { get; set; } = new();
    public List<IndicadorClaveEncuestaDto> IndicadoresClave { get; set; } = new();
    public List<RequiereAtencionEncuestaDto> RequierenAtencion { get; set; } = new();
}
