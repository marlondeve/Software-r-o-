using Bital.Application.DTOs.DietasCocina;
using Bital.Application.DTOs.Encuestas;
using Bital.Application.Interfaces;
using Bital.Domain.Entities.Encuestas;
using Bital.Domain.Enums;
using Bital.Infrastructure.Data;
using Bital.Infrastructure.DietasCocina;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Bital.Infrastructure.Services;

public class CuestionariosService : ICuestionariosService
{
    private readonly BitalNegocioDbContext _context;
    private readonly ILogger<CuestionariosService> _logger;

    public CuestionariosService(BitalNegocioDbContext context, ILogger<CuestionariosService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<ListaCuestionariosDto> ObtenerCuestionariosAsync(FiltrosCuestionariosDto filtros, CancellationToken cancellationToken = default)
    {
        var (page, pageSize) = PaginacionHelper.Normalizar(filtros.Page, filtros.PageSize);
        filtros.Page = page;
        filtros.PageSize = pageSize;

        var query = BuildQuery();
        query = ApplyFilters(query, filtros);

        var total = await query.CountAsync(cancellationToken);
        var totalPages = filtros.PageSize <= 0 ? 0 : (int)Math.Ceiling(total / (double)filtros.PageSize);

        var cuestionarios = await query
            .OrderBy(x => x.Nombre)
            .Skip(Math.Max(0, filtros.Page - 1) * filtros.PageSize)
            .Take(filtros.PageSize)
            .ToListAsync(cancellationToken);

        return new ListaCuestionariosDto
        {
            Data = cuestionarios.Select(MapResumen).ToList(),
            Meta = new MetaPaginacionDto
            {
                Total = total,
                Page = filtros.Page,
                PageSize = filtros.PageSize,
                TotalPages = totalPages
            }
        };
    }

    public async Task<CuestionarioDetalleDto> ObtenerCuestionarioAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var cuestionario = await LoadCuestionarioAsync(id, cancellationToken);
        return MapDetalle(cuestionario);
    }

    public async Task<CuestionarioDetalleDto> CrearCuestionarioAsync(CuestionarioCreacionDto dto, CancellationToken cancellationToken = default)
    {
        var cuestionario = new CuestionarioEncuesta
        {
            Id = Guid.NewGuid(),
            Nombre = dto.Nombre.Trim(),
            Descripcion = dto.Descripcion?.Trim(),
            Canal = dto.Canal,
            Estado = EstadoCuestionario.Borrador,
            CreadoPor = "system"
        };

        _context.CuestionariosEncuesta.Add(cuestionario);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Cuestionario creado {CuestionarioId}", cuestionario.Id);

        return MapDetalle(cuestionario);
    }

    public async Task<CuestionarioDetalleDto> ActualizarCuestionarioAsync(Guid id, CuestionarioActualizacionDto dto, CancellationToken cancellationToken = default)
    {
        var cuestionario = await LoadCuestionarioAsync(id, cancellationToken);
        cuestionario.Nombre = dto.Nombre.Trim();
        cuestionario.Descripcion = dto.Descripcion?.Trim();
        cuestionario.Canal = dto.Canal;
        cuestionario.ModificadoEn = DateTime.UtcNow;
        cuestionario.ModificadoPor = "system";

        await _context.SaveChangesAsync(cancellationToken);
        return MapDetalle(cuestionario);
    }

    public async Task<CuestionarioDetalleDto> CambiarEstadoAsync(Guid id, CuestionarioEstadoDto dto, CancellationToken cancellationToken = default)
    {
        var cuestionario = await LoadCuestionarioAsync(id, cancellationToken);
        cuestionario.Estado = dto.Estado;
        cuestionario.ModificadoEn = DateTime.UtcNow;
        cuestionario.ModificadoPor = "system";

        await _context.SaveChangesAsync(cancellationToken);
        return MapDetalle(cuestionario);
    }

    public async Task<CuestionarioDetalleDto> DuplicarCuestionarioAsync(Guid id, CuestionarioDuplicadoDto? dto = null, CancellationToken cancellationToken = default)
    {
        var original = await LoadCuestionarioAsync(id, cancellationToken);
        var duplicado = new CuestionarioEncuesta
        {
            Id = Guid.NewGuid(),
            Nombre = string.IsNullOrWhiteSpace(dto?.Nombre) ? $"{original.Nombre} - copia" : dto!.Nombre!.Trim(),
            Descripcion = original.Descripcion,
            Canal = original.Canal,
            Estado = EstadoCuestionario.Borrador,
            CreadoPor = "system",
            Secciones = original.Secciones.Select(CloneSeccion).ToList()
        };

        NormalizeGraph(duplicado);
        _context.CuestionariosEncuesta.Add(duplicado);
        await _context.SaveChangesAsync(cancellationToken);
        return MapDetalle(duplicado);
    }

    public async Task EliminarCuestionarioAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var cuestionario = await LoadCuestionarioAsync(id, cancellationToken);

        if (cuestionario.Estado != EstadoCuestionario.Borrador)
        {
            throw new InvalidOperationException("Solo se pueden eliminar cuestionarios en estado borrador");
        }

        _context.CuestionariosEncuesta.Remove(cuestionario);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<EstructuraCuestionarioDto> ObtenerEstructuraAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var cuestionario = await LoadCuestionarioAsync(id, cancellationToken);
        return new EstructuraCuestionarioDto
        {
            Secciones = cuestionario.Secciones.Select(MapSection).ToList()
        };
    }

    public async Task<EstructuraCuestionarioDto> GuardarEstructuraAsync(Guid id, EstructuraCuestionarioDto dto, CancellationToken cancellationToken = default)
    {
        var cuestionario = await LoadCuestionarioAsync(id, cancellationToken);
        _context.RemoveRange(cuestionario.Secciones);
        cuestionario.Secciones.Clear();

        cuestionario.Secciones = dto.Secciones.Select(seccion => CloneSectionEntity(seccion)).ToList();
        NormalizeGraph(cuestionario);
        cuestionario.ModificadoEn = DateTime.UtcNow;
        cuestionario.ModificadoPor = "system";

        await _context.SaveChangesAsync(cancellationToken);
        return new EstructuraCuestionarioDto
        {
            Secciones = cuestionario.Secciones.Select(MapSection).ToList()
        };
    }

    public async Task<PreguntaCuestionarioDto> AgregarPreguntaAsync(Guid id, PreguntaCuestionarioCreacionDto dto, CancellationToken cancellationToken = default)
    {
        var cuestionario = await LoadCuestionarioAsync(id, cancellationToken);
        var seccion = cuestionario.Secciones.OrderBy(x => x.Orden).FirstOrDefault();
        if (seccion == null)
        {
            seccion = new SeccionCuestionario
            {
                Id = Guid.NewGuid(),
                CuestionarioEncuestaId = cuestionario.Id,
                Nombre = "General",
                Orden = 1,
                CreadoPor = "system"
            };
            cuestionario.Secciones.Add(seccion);
        }

        var pregunta = new PreguntaCuestionario
        {
            Id = Guid.NewGuid(),
            SeccionCuestionarioId = seccion.Id,
            Texto = dto.Texto.Trim(),
            Tipo = dto.Tipo.Trim(),
            EsRequerida = dto.EsRequerida,
            Orden = dto.Orden,
            Activa = dto.Activa,
            CreadoPor = "system"
        };

        pregunta.Opciones = dto.Opciones.Select((texto, index) => new OpcionPreguntaCuestionario
        {
            Id = Guid.NewGuid(),
            PreguntaCuestionarioId = pregunta.Id,
            Texto = texto,
            Valor = texto,
            Orden = index + 1,
            CreadoPor = "system"
        }).ToList();

        if (dto.Logica != null)
        {
            pregunta.Logica = MapLogica(dto.Logica, pregunta.Id);
        }

        seccion.Preguntas.Add(pregunta);
        NormalizeGraph(cuestionario);
        cuestionario.ModificadoEn = DateTime.UtcNow;
        cuestionario.ModificadoPor = "system";

        await _context.SaveChangesAsync(cancellationToken);
        return MapQuestion(pregunta);
    }

    public async Task<PreguntaCuestionarioDto> EditarPreguntaAsync(Guid id, Guid preguntaId, PreguntaCuestionarioActualizacionDto dto, CancellationToken cancellationToken = default)
    {
        var pregunta = await LoadPreguntaAsync(id, preguntaId, cancellationToken);
        pregunta.Texto = dto.Texto.Trim();
        pregunta.Tipo = dto.Tipo.Trim();
        pregunta.EsRequerida = dto.EsRequerida;
        pregunta.Orden = dto.Orden;
        pregunta.Activa = dto.Activa;
        pregunta.ModificadoEn = DateTime.UtcNow;
        pregunta.ModificadoPor = "system";

        _context.RemoveRange(pregunta.Opciones);
        pregunta.Opciones.Clear();
        pregunta.Opciones = dto.Opciones.Select((texto, index) => new OpcionPreguntaCuestionario
        {
            Id = Guid.NewGuid(),
            PreguntaCuestionarioId = pregunta.Id,
            Texto = texto,
            Valor = texto,
            Orden = index + 1,
            CreadoPor = "system"
        }).ToList();

        if (dto.Logica != null)
        {
            if (pregunta.Logica == null)
            {
                pregunta.Logica = MapLogica(dto.Logica, pregunta.Id);
            }
            else
            {
                pregunta.Logica.PreguntaOrigenId = dto.Logica.PreguntaOrigenId;
                pregunta.Logica.Operador = dto.Logica.Operador;
                pregunta.Logica.Valor = dto.Logica.Valor;
                pregunta.Logica.Accion = dto.Logica.Accion;
                pregunta.Logica.ModificadoEn = DateTime.UtcNow;
                pregunta.Logica.ModificadoPor = "system";
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        return MapQuestion(pregunta);
    }

    public async Task<PreguntaCuestionarioDto> ActualizarLogicaAsync(Guid id, Guid preguntaId, LogicaPreguntaCuestionarioDto dto, CancellationToken cancellationToken = default)
    {
        var pregunta = await LoadPreguntaAsync(id, preguntaId, cancellationToken);

        if (dto.Logica == null)
        {
            if (pregunta.Logica != null)
            {
                _context.Remove(pregunta.Logica);
                pregunta.Logica = null;
                await _context.SaveChangesAsync(cancellationToken);
            }

            return MapQuestion(pregunta);
        }

        if (pregunta.Logica == null)
        {
            pregunta.Logica = MapLogica(dto.Logica, pregunta.Id);
        }
        else
        {
            pregunta.Logica.PreguntaOrigenId = dto.Logica.PreguntaOrigenId;
            pregunta.Logica.Operador = dto.Logica.Operador;
            pregunta.Logica.Valor = dto.Logica.Valor;
            pregunta.Logica.Accion = dto.Logica.Accion;
            pregunta.Logica.ModificadoEn = DateTime.UtcNow;
            pregunta.Logica.ModificadoPor = "system";
        }

        await _context.SaveChangesAsync(cancellationToken);
        return MapQuestion(pregunta);
    }

    private IQueryable<CuestionarioEncuesta> BuildQuery()
    {
        return _context.CuestionariosEncuesta
            .AsNoTracking()
            .Include(x => x.Secciones)
                .ThenInclude(x => x.Preguntas)
                    .ThenInclude(x => x.Opciones)
            .Include(x => x.Secciones)
                .ThenInclude(x => x.Preguntas)
                    .ThenInclude(x => x.Logica)
            .AsSplitQuery();
    }

    private static IQueryable<CuestionarioEncuesta> ApplyFilters(IQueryable<CuestionarioEncuesta> query, FiltrosCuestionariosDto filtros)
    {
        if (filtros.Estado.HasValue)
        {
            query = query.Where(x => x.Estado == filtros.Estado.Value);
        }

        if (filtros.Canal.HasValue)
        {
            query = query.Where(x => x.Canal == filtros.Canal.Value);
        }

        if (!string.IsNullOrWhiteSpace(filtros.Busqueda))
        {
            var busqueda = filtros.Busqueda.Trim();
            query = query.Where(x => x.Nombre.Contains(busqueda) || (x.Descripcion != null && x.Descripcion.Contains(busqueda)));
        }

        return query;
    }

    private async Task<CuestionarioEncuesta> LoadCuestionarioAsync(Guid id, CancellationToken cancellationToken)
    {
        var cuestionario = await _context.CuestionariosEncuesta
            .Include(x => x.Secciones)
                .ThenInclude(x => x.Preguntas)
                    .ThenInclude(x => x.Opciones)
            .Include(x => x.Secciones)
                .ThenInclude(x => x.Preguntas)
                    .ThenInclude(x => x.Logica)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (cuestionario == null)
        {
            throw new KeyNotFoundException($"No se encontró el cuestionario {id}");
        }

        return cuestionario;
    }

    private async Task<PreguntaCuestionario> LoadPreguntaAsync(Guid cuestionarioId, Guid preguntaId, CancellationToken cancellationToken)
    {
        var cuestionario = await LoadCuestionarioAsync(cuestionarioId, cancellationToken);
        var pregunta = cuestionario.Secciones.SelectMany(x => x.Preguntas).FirstOrDefault(x => x.Id == preguntaId);

        if (pregunta == null)
        {
            throw new KeyNotFoundException($"No se encontró la pregunta {preguntaId} en el cuestionario {cuestionarioId}");
        }

        return pregunta;
    }

    private static CuestionarioDetalleDto MapDetalle(CuestionarioEncuesta cuestionario)
    {
        var secciones = cuestionario.Secciones
            .OrderBy(x => x.Orden)
            .Select(MapSection)
            .ToList();

        return new CuestionarioDetalleDto
        {
            Id = cuestionario.Id,
            Nombre = cuestionario.Nombre,
            Descripcion = cuestionario.Descripcion,
            Canal = cuestionario.Canal,
            Estado = cuestionario.Estado,
            TotalSecciones = secciones.Count,
            TotalPreguntas = secciones.Sum(x => x.Preguntas.Count),
            FechaCreacion = cuestionario.CreadoEn,
            UltimaActualizacion = cuestionario.ModificadoEn,
            Secciones = secciones
        };
    }

    private static CuestionarioResumenDto MapResumen(CuestionarioEncuesta cuestionario)
    {
        var totalPreguntas = cuestionario.Secciones.Sum(s => s.Preguntas.Count);
        return new CuestionarioResumenDto
        {
            Id = cuestionario.Id,
            Nombre = cuestionario.Nombre,
            Descripcion = cuestionario.Descripcion,
            Canal = cuestionario.Canal,
            Estado = cuestionario.Estado,
            TotalSecciones = cuestionario.Secciones.Count,
            TotalPreguntas = totalPreguntas,
            FechaCreacion = cuestionario.CreadoEn,
            UltimaActualizacion = cuestionario.ModificadoEn
        };
    }

    private static SeccionCuestionarioDto MapSection(SeccionCuestionario seccion)
    {
        return new SeccionCuestionarioDto
        {
            Id = seccion.Id,
            Nombre = seccion.Nombre,
            Orden = seccion.Orden,
            Preguntas = seccion.Preguntas
                .OrderBy(x => x.Orden)
                .Select(MapQuestion)
                .ToList()
        };
    }

    private static PreguntaCuestionarioDto MapQuestion(PreguntaCuestionario pregunta)
    {
        return new PreguntaCuestionarioDto
        {
            Id = pregunta.Id,
            SeccionId = pregunta.SeccionCuestionarioId,
            Texto = pregunta.Texto,
            Tipo = pregunta.Tipo,
            EsRequerida = pregunta.EsRequerida,
            Orden = pregunta.Orden,
            Activa = pregunta.Activa,
            Opciones = pregunta.Opciones.OrderBy(x => x.Orden).Select(x => x.Texto).ToList(),
            Logica = pregunta.Logica == null ? null : new LogicaCondicionalDto
            {
                PreguntaOrigenId = pregunta.Logica.PreguntaOrigenId,
                Operador = pregunta.Logica.Operador,
                Valor = pregunta.Logica.Valor,
                Accion = pregunta.Logica.Accion
            }
        };
    }

    private static SeccionCuestionario CloneSeccion(SeccionCuestionario seccion)
    {
        return new SeccionCuestionario
        {
            Id = Guid.NewGuid(),
            Nombre = seccion.Nombre,
            Orden = seccion.Orden,
            CreadoPor = "system",
            Preguntas = seccion.Preguntas.OrderBy(x => x.Orden).Select(CloneQuestion).ToList()
        };
    }

    private static PreguntaCuestionario CloneQuestion(PreguntaCuestionario pregunta)
    {
        var cloned = new PreguntaCuestionario
        {
            Id = Guid.NewGuid(),
            Texto = pregunta.Texto,
            Tipo = pregunta.Tipo,
            EsRequerida = pregunta.EsRequerida,
            Orden = pregunta.Orden,
            Activa = pregunta.Activa,
            CreadoPor = "system",
            Opciones = pregunta.Opciones.OrderBy(x => x.Orden).Select(x => new OpcionPreguntaCuestionario
            {
                Id = Guid.NewGuid(),
                Texto = x.Texto,
                Valor = x.Valor,
                Orden = x.Orden,
                CreadoPor = "system"
            }).ToList()
        };

        if (pregunta.Logica != null)
        {
            cloned.Logica = new LogicaPreguntaCuestionario
            {
                Id = Guid.NewGuid(),
                PreguntaOrigenId = pregunta.Logica.PreguntaOrigenId,
                Operador = pregunta.Logica.Operador,
                Valor = pregunta.Logica.Valor,
                Accion = pregunta.Logica.Accion,
                CreadoPor = "system"
            };
        }

        return cloned;
    }

    private static SeccionCuestionario CloneSectionEntity(SeccionCuestionarioDto dto)
    {
        return new SeccionCuestionario
        {
            Id = dto.Id == Guid.Empty ? Guid.NewGuid() : dto.Id,
            Nombre = dto.Nombre,
            Orden = dto.Orden,
            CreadoPor = "system",
            Preguntas = dto.Preguntas.Select(CloneQuestionEntity).ToList()
        };
    }

    private static PreguntaCuestionario CloneQuestionEntity(PreguntaCuestionarioDto dto)
    {
        var questionId = dto.Id == Guid.Empty ? Guid.NewGuid() : dto.Id;
        var pregunta = new PreguntaCuestionario
        {
            Id = questionId,
            Texto = dto.Texto,
            Tipo = dto.Tipo,
            EsRequerida = dto.EsRequerida,
            Orden = dto.Orden,
            Activa = dto.Activa,
            CreadoPor = "system",
            Opciones = dto.Opciones.Select((texto, index) => new OpcionPreguntaCuestionario
            {
                Id = Guid.NewGuid(),
                PreguntaCuestionarioId = questionId,
                Texto = texto,
                Valor = texto,
                Orden = index + 1,
                CreadoPor = "system"
            }).ToList()
        };

        if (dto.Logica != null)
        {
            pregunta.Logica = MapLogica(dto.Logica, questionId);
        }

        return pregunta;
    }

    private static LogicaPreguntaCuestionario MapLogica(LogicaCondicionalDto dto, Guid preguntaId)
    {
        return new LogicaPreguntaCuestionario
        {
            Id = Guid.NewGuid(),
            PreguntaCuestionarioId = preguntaId,
            PreguntaOrigenId = dto.PreguntaOrigenId,
            Operador = dto.Operador,
            Valor = dto.Valor,
            Accion = dto.Accion,
            CreadoPor = "system"
        };
    }

    private static void NormalizeGraph(CuestionarioEncuesta cuestionario)
    {
        foreach (var seccion in cuestionario.Secciones)
        {
            seccion.CuestionarioEncuestaId = cuestionario.Id;
            if (seccion.Id == Guid.Empty)
            {
                seccion.Id = Guid.NewGuid();
            }

            foreach (var pregunta in seccion.Preguntas)
            {
                pregunta.SeccionCuestionarioId = seccion.Id;
                if (pregunta.Id == Guid.Empty)
                {
                    pregunta.Id = Guid.NewGuid();
                }

                foreach (var opcion in pregunta.Opciones)
                {
                    opcion.PreguntaCuestionarioId = pregunta.Id;
                    if (opcion.Id == Guid.Empty)
                    {
                        opcion.Id = Guid.NewGuid();
                    }
                }

                if (pregunta.Logica != null)
                {
                    pregunta.Logica.PreguntaCuestionarioId = pregunta.Id;
                    if (pregunta.Logica.Id == Guid.Empty)
                    {
                        pregunta.Logica.Id = Guid.NewGuid();
                    }
                }
            }
        }
    }
}
