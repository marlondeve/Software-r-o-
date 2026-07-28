using Bital.Application.DTOs.Encuestas;
using Bital.Application.Interfaces;
using Bital.Infrastructure.Data;
using Bital.Infrastructure.DietasCocina;
using Microsoft.EntityFrameworkCore;

namespace Bital.Infrastructure.Services;

public class AdministracionEncuestasService : IAdministracionEncuestasService
{
    private readonly IAuditoriaService _auditoriaService;
    private readonly IUsuariosPermisosService _usuariosPermisosService;
    private readonly IDashboardService _dashboardService;
    private readonly BitalNegocioDbContext _context;

    public AdministracionEncuestasService(
        IAuditoriaService auditoriaService,
        IUsuariosPermisosService usuariosPermisosService,
        IDashboardService dashboardService,
        BitalNegocioDbContext context)
    {
        _auditoriaService = auditoriaService;
        _usuariosPermisosService = usuariosPermisosService;
        _dashboardService = dashboardService;
        _context = context;
    }

    public async Task<ListaAuditoriaEncuestasDto> ObtenerAuditoriaAsync(FiltrosAuditoriaEncuestasDto filtros)
    {
        var eventos = await _auditoriaService.ObtenerEventosAsync(new Bital.Application.DTOs.DietasCocina.FiltrosAuditoriaDto
        {
            Modulo = filtros.Modulo,
            Resultado = filtros.Resultado,
            Desde = filtros.Desde,
            Hasta = filtros.Hasta,
            Usuario = filtros.Usuario,
            Page = filtros.Page,
            PageSize = filtros.PageSize
        });

        return new ListaAuditoriaEncuestasDto
        {
            Data = eventos.Data.Select(MapEvento).ToList(),
            Meta = eventos.Meta
        };
    }

    public async Task<DetalleAuditoriaEncuestaDto?> ObtenerDetalleAuditoriaAsync(Guid id)
    {
        var detalle = await _auditoriaService.ObtenerDetalleEventoAsync(id);
        if (detalle == null) return null;
        return MapDetalle(detalle);
    }

    public async Task<ListaUsuariosEncuestasDto> ObtenerUsuariosAsync(FiltrosUsuariosEncuestasDto filtros)
    {
        var usuarios = await _usuariosPermisosService.ObtenerUsuariosAsync(new Bital.Application.DTOs.DietasCocina.FiltrosUsuariosDto
        {
            Page = filtros.Page,
            PageSize = filtros.PageSize,
            Activo = filtros.Activo
        });

        return new ListaUsuariosEncuestasDto
        {
            Data = usuarios.Data.Select(u => new UsuarioEncuestasModuloDto
            {
                Id = u.Id.ToString(),
                Nombre = u.NombreCompleto,
                Usuario = u.Email.Split('@', 2)[0],
                Correo = u.Email,
                Rol = u.RolNombre,
                ServicioArea = u.Identificacion ?? string.Empty,
                OrgProveedora = null,
                Estado = u.Activo ? "activo" : "inactivo",
                UltimoAcceso = u.UltimoAcceso?.ToString("g") ?? "Sin acceso",
                Origen = "Bital"
            }).ToList(),
            Meta = usuarios.Meta
        };
    }

    public async Task<UsuarioEncuestasModuloDto> CrearUsuarioAsync(CrearUsuarioEncuestasDto dto)
    {
        var rolModuloId = await _usuariosPermisosService.ResolverRolModuloIdPorNombreAsync(dto.Rol)
            ?? RolModuloSeed.Enfermera;
        var creado = await _usuariosPermisosService.CrearUsuarioAsync(new Bital.Application.DTOs.DietasCocina.CrearUsuarioDto
        {
            NombreCompleto = dto.Nombre,
            Email = dto.Correo,
            Identificacion = dto.Usuario,
            RolModuloId = rolModuloId,
            Observaciones = dto.ServicioArea
        }, "sistema");

        return new UsuarioEncuestasModuloDto
        {
            Id = creado.Id.ToString(),
            Nombre = creado.NombreCompleto,
            Usuario = creado.Identificacion ?? string.Empty,
            Correo = creado.Email,
            Rol = creado.RolNombre,
            ServicioArea = dto.ServicioArea ?? string.Empty,
            OrgProveedora = null,
            Estado = creado.Activo ? "activo" : "inactivo",
            UltimoAcceso = creado.UltimoAcceso?.ToString("g") ?? "Sin acceso",
            Origen = dto.Origen ?? "Bital"
        };
    }

    public async Task<UsuarioEncuestasModuloDto> CambiarRolAsync(Guid id, CambiarRolEncuestasDto dto)
    {
        var rolModuloId = await _usuariosPermisosService.ResolverRolModuloIdPorNombreAsync(dto.Rol)
            ?? RolModuloSeed.Enfermera;
        var actualizado = await _usuariosPermisosService.CambiarRolAsync(id, new Bital.Application.DTOs.DietasCocina.CambiarRolDto { RolModuloId = rolModuloId });

        return new UsuarioEncuestasModuloDto
        {
            Id = actualizado.Id.ToString(),
            Nombre = actualizado.NombreCompleto,
            Usuario = actualizado.Identificacion ?? string.Empty,
            Correo = actualizado.Email,
            Rol = actualizado.RolNombre,
            ServicioArea = actualizado.Identificacion ?? string.Empty,
            OrgProveedora = null,
            Estado = actualizado.Activo ? "activo" : "inactivo",
            UltimoAcceso = actualizado.UltimoAcceso?.ToString("g") ?? "Sin acceso",
            Origen = "Bital"
        };
    }

    public async Task<DashboardInicioEncuestasDto> ObtenerDashboardInicioAsync()
    {
        var dashboard = await _dashboardService.ObtenerDashboardNutricionistaAsync(DateTime.Today, null);
        var capturas = await _context.CapturasEncuesta.AsNoTracking()
            .OrderByDescending(x => x.FechaFinalizacion ?? x.FechaInicio)
            .Take(2)
            .ToListAsync();

        return new DashboardInicioEncuestasDto
        {
            Fecha = DateTime.Today.ToString("dd 'de' MMMM 'de' yyyy"),
            Periodo = DateTime.Today.ToString("MMMM yyyy"),
            SincronizadoHaceMin = 5,
            Kpis = dashboard.Kpis.Select(k => new KpiInicioEncuestasDto
            {
                Label = k.Etiqueta,
                Value = Convert.ToString(k.Valor) ?? string.Empty,
                Trend = k.Tendencia,
                Footnote = null,
                Progreso = null,
                IconTone = null
            }).ToList(),
            CapturasRecientes = capturas.Select(x => new CapturaRecienteEncuestaDto
            {
                Id = x.Id.ToString(),
                Paciente = x.NombreCompleto,
                Tipo = x.Canal.ToString().ToLowerInvariant(),
                Fecha = (x.FechaFinalizacion ?? x.FechaInicio).ToString("g"),
                Puntuacion = x.Sat ?? 0,
                PuntuacionMax = 10,
                Estado = x.Estado.ToString().ToLowerInvariant()
            }).ToList(),
            AccionesRapidas = new List<AccionRapidaEncuestaDto>
            {
                new() { Title = "Iniciar Captura Telefónica", Description = "Llamadas programadas", To = "/encuestas/captura-telefonica" },
                new() { Title = "Registro Presencial", Description = "Habitación o Área", To = "/encuestas/captura-presencial" }
            },
            UltimaSincronizacion = new SincronizacionEncuestaDto { Fuente = "SISMA", HaceMin = 5 },
            IndicadoresClave = new List<IndicadorClaveEncuestaDto>
            {
                new() { Label = "Trato del personal", Value = 78, Color = "#006671" },
                new() { Label = "Infraestructura", Value = 88, Color = "#94a3b8" },
                new() { Label = "Comunicación", Value = 52, Color = "#00818f" },
                new() { Label = "Alimentación", Value = 91, Color = "#bbf244" },
                new() { Label = "Admisión", Value = 24, Color = "#f4c7cc" }
            },
            RequierenAtencion = new List<RequiereAtencionEncuestaDto>
            {
                new() { Title = "Calificaciones negativas", Description = "Sin gestión asignada" },
                new() { Title = "Fallas de sincronización", Description = "Error al conectar" },
                new() { Title = "Atendidos sin encuesta", Description = "Pacientes dados de alta" }
            }
        };
    }

    private static FilaAuditoriaEncuestaDto MapEvento(Bital.Application.DTOs.DietasCocina.EventoAuditoriaDto e)
    {
        return new FilaAuditoriaEncuestaDto
        {
            Id = e.Id.ToString(),
            IdEvento = e.Id.ToString(),
            Fecha = e.FechaEvento.ToString("g"),
            Relativo = "hace poco",
            UsuarioNombre = e.Usuario,
            UsuarioRol = string.Empty,
            Modulo = e.Modulo,
            Accion = e.Accion,
            AccionAlerta = e.Resultado != "Exitoso",
            IdRegistro = e.EntidadId?.ToString() ?? string.Empty,
            IdSecundario = string.Empty,
            DetalleTipo = e.DuracionMs.HasValue ? "texto" : "texto",
            DetalleTexto = null,
            Resultado = e.Resultado.ToLowerInvariant() == "fallido" ? "denegado" : "exito",
            OrigenIp = e.DireccionIp ?? string.Empty,
            OrigenDispositivo = string.Empty
        };
    }

    private static DetalleAuditoriaEncuestaDto MapDetalle(Bital.Application.DTOs.DietasCocina.DetalleAuditoriaDto e)
    {
        return new DetalleAuditoriaEncuestaDto
        {
            Id = e.Id.ToString(),
            IdEvento = e.Id.ToString(),
            Fecha = e.FechaEvento.ToString("g"),
            Relativo = "hace poco",
            UsuarioNombre = e.Usuario,
            UsuarioRol = string.Empty,
            Modulo = e.Modulo,
            Accion = e.Accion,
            AccionAlerta = e.Resultado != "Exitoso",
            IdRegistro = e.EntidadId?.ToString() ?? string.Empty,
            IdSecundario = string.Empty,
            DetalleTipo = "texto",
            Resultado = e.Resultado.ToLowerInvariant() == "fallido" ? "denegado" : "exito",
            OrigenIp = e.DireccionIp ?? string.Empty,
            OrigenDispositivo = string.Empty,
            Contexto = new List<DetalleAuditoriaEncuestaCampoDto>(),
            DatosAntes = e.DatosAntes,
            DatosDespues = e.DatosDespues,
            Metadata = e.Metadata,
            MensajeError = e.MensajeError,
            DuracionMs = e.DuracionMs
        };
    }
}
