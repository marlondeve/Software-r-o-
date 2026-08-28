using Bital.Application.DTOs.DietasCocina;
using Bital.Application.Interfaces;
using Bital.Domain.Entities.DietasCocina;
using Bital.Domain.Enums;
using Bital.Infrastructure.Data;
using Bital.Infrastructure.DietasCocina;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Bital.Infrastructure.Services;

public class ParametrosService : IParametrosService
{
    private readonly BitalNegocioDbContext _context;
    private readonly IAuditoriaService _auditoria;
    private readonly IAuditoriaContextoRequest _contextoAuditoria;
    private readonly ILogger<ParametrosService> _logger;
    private readonly IDietasCocinaRealtime _realtime;

    public ParametrosService(
        BitalNegocioDbContext context,
        IAuditoriaService auditoria,
        IAuditoriaContextoRequest contextoAuditoria,
        ILogger<ParametrosService> logger,
        IDietasCocinaRealtime? realtime = null)
    {
        _context = context;
        _auditoria = auditoria;
        _contextoAuditoria = contextoAuditoria;
        _logger = logger;
        _realtime = realtime ?? NullDietasCocinaRealtime.Instance;
    }

    public async Task<TiemposComidaConfiguracionDto> ObtenerTiemposComidaAsync()
    {
        var config = await ParametrosOperativosHelper.ObtenerOSemillarAsync(_context);
        var tiempos = await _context.TiemposComida
            .OrderBy(t => t.Comida)
            .ToListAsync();

        return new TiemposComidaConfiguracionDto
        {
            Tiempos = tiempos.Select(MapTiempoComida).ToList(),
            ModoCarga = config.ModoCarga,
        };
    }

    public async Task<TiemposComidaConfiguracionDto> ActualizarTiemposComidaAsync(ActualizarTiemposComidaDto dto)
    {
        var config = await ParametrosOperativosHelper.ObtenerOSemillarAsync(_context);
        var modoCargaAnterior = config.ModoCarga;
        if (!string.IsNullOrWhiteSpace(dto.ModoCarga))
        {
            config.ModoCarga = ParametrosOperativosHelper.NormalizarModoCarga(dto.ModoCarga);
            config.ModificadoEn = DateTime.UtcNow;
            config.ModificadoPor = dto.Usuario;
        }

        var existentes = await _context.TiemposComida.ToListAsync();

        foreach (var item in dto.Tiempos)
        {
            if (!Enum.TryParse<TiempoComida>(item.Comida, out var comida))
            {
                throw new ArgumentException($"Tiempo de comida inválido: {item.Comida}");
            }

            var existente = existentes.FirstOrDefault(t => t.Comida == comida);

            if (existente != null)
            {
                existente.HoraPreparacion = TimeSpan.Parse(item.HoraPreparacion);
                existente.HoraCierre = TimeSpan.Parse(item.HoraCierre);
                existente.HoraEntrega = TimeSpan.Parse(item.HoraEntrega);
                existente.Activo = item.Activo;
                existente.MinutosAlertaCierre = item.MinutosAlertaCierre;
                existente.Observaciones = item.Observaciones;
                existente.ModificadoPor = dto.Usuario;
                existente.ModificadoEn = DateTime.UtcNow;
            }
            else
            {
                var nuevo = new TiempoComidaConfig
                {
                    Id = Guid.NewGuid(),
                    Comida = comida,
                    HoraPreparacion = TimeSpan.Parse(item.HoraPreparacion),
                    HoraCierre = TimeSpan.Parse(item.HoraCierre),
                    HoraEntrega = TimeSpan.Parse(item.HoraEntrega),
                    Activo = item.Activo,
                    MinutosAlertaCierre = item.MinutosAlertaCierre,
                    Observaciones = item.Observaciones,
                    ModificadoPor = dto.Usuario,
                    ModificadoEn = DateTime.UtcNow,
                    CreadoPor = dto.Usuario,
                    CreadoEn = DateTime.UtcNow,
                };
                _context.TiemposComida.Add(nuevo);
            }
        }

        await _context.SaveChangesAsync();

        Auditar(AuditoriaCatalogo.Modulos.Parametros, AuditoriaCatalogo.Acciones.ActualizarTiempos, dto.Usuario,
            AuditoriaCatalogo.Entidades.ParametroOperativo, config.Id,
            new { modoCarga = modoCargaAnterior },
            new { modoCarga = config.ModoCarga, tiempos = dto.Tiempos.Count });

        await _realtime.NotificarParametrosAsync();
        return await ObtenerTiemposComidaAsync();
    }

    private static TiempoComidaDto MapTiempoComida(TiempoComidaConfig t) => new()
    {
        Id = t.Id,
        Comida = t.Comida.ToString(),
        HoraPreparacion = FormatearHora(t.HoraPreparacion),
        HoraCierre = FormatearHora(t.HoraCierre),
        HoraEntrega = FormatearHora(t.HoraEntrega),
        Activo = t.Activo,
        MinutosAlertaCierre = t.MinutosAlertaCierre,
        Observaciones = t.Observaciones,
        ModificadoPor = t.ModificadoPor,
        ModificadoEn = t.ModificadoEn,
    };

    /// <summary>
    /// HH:mm en ciclo 0–23. Evita ambigüedad de formatos custom de TimeSpan.
    /// </summary>
    private static string FormatearHora(TimeSpan t) =>
        $"{t.Hours:D2}:{t.Minutes:D2}";

    public async Task<List<CategoriaEdadDto>> ObtenerCategoriasEdadAsync()
    {
        var categorias = await _context.CategoriasEdad
            .Where(c => c.Activa)
            .OrderBy(c => c.Orden)
            .ToListAsync();

        return categorias.Select(c => new CategoriaEdadDto
        {
            Id = c.Id,
            Nombre = c.Nombre,
            EdadMinima = c.EdadMinima,
            EdadMaxima = c.EdadMaxima,
            FactorPorcion = c.FactorPorcion,
            Descripcion = c.Descripcion,
            Activa = c.Activa,
            Orden = c.Orden,
            ModificadoPor = c.ModificadoPor,
            ModificadoEn = c.ModificadoEn
        }).ToList();
    }

    public async Task<List<CategoriaEdadDto>> ActualizarCategoriasEdadAsync(ActualizarCategoriasEdadDto dto)
    {
        var existentes = await _context.CategoriasEdad.ToListAsync();
        var categoriasAnteriores = existentes
            .Where(c => c.Activa)
            .Select(c => new { c.Nombre, c.EdadMinima, c.EdadMaxima })
            .ToList();

        foreach (var existente in existentes)
        {
            existente.Activa = false;
            existente.ModificadoPor = dto.Usuario;
            existente.ModificadoEn = DateTime.UtcNow;
        }

        foreach (var item in dto.Categorias)
        {
            var categoria = new CategoriaEdad
            {
                Id = Guid.NewGuid(),
                Nombre = item.Nombre,
                EdadMinima = item.EdadMinima,
                EdadMaxima = item.EdadMaxima,
                FactorPorcion = item.FactorPorcion,
                Descripcion = item.Descripcion,
                Activa = item.Activa,
                Orden = item.Orden,
                ModificadoPor = dto.Usuario,
                ModificadoEn = DateTime.UtcNow,
                CreadoPor = dto.Usuario,
                CreadoEn = DateTime.UtcNow
            };
            _context.CategoriasEdad.Add(categoria);
        }

        await _context.SaveChangesAsync();

        Auditar(AuditoriaCatalogo.Modulos.Parametros, AuditoriaCatalogo.Acciones.ActualizarCategoriasEdad, dto.Usuario,
            AuditoriaCatalogo.Entidades.ParametroOperativo, null,
            new { categorias = categoriasAnteriores },
            new { categorias = dto.Categorias.Select(c => new { c.Nombre, c.EdadMinima, c.EdadMaxima }) });

        await _realtime.NotificarParametrosAsync();
        return await ObtenerCategoriasEdadAsync();
    }

    public async Task<ClasificarEdadResponseDto> ClasificarEdadAsync(int edad)
    {
        var categoria = await _context.CategoriasEdad
            .Where(c => c.Activa && edad >= c.EdadMinima && edad <= c.EdadMaxima)
            .OrderBy(c => c.Orden)
            .FirstOrDefaultAsync();

        if (categoria == null)
        {
            return new ClasificarEdadResponseDto
            {
                Categoria = "Sin categoría",
                EdadMinima = 0,
                EdadMaxima = 0,
                FactorPorcion = 1.0m
            };
        }

        return new ClasificarEdadResponseDto
        {
            Categoria = categoria.Nombre,
            EdadMinima = categoria.EdadMinima,
            EdadMaxima = categoria.EdadMaxima,
            FactorPorcion = categoria.FactorPorcion
        };
    }

    private void Auditar(
        string modulo,
        string accion,
        string usuario,
        string entidad,
        Guid? entidadId,
        object? antes = null,
        object? despues = null)
    {
        AuditoriaOperativaHelper.RegistrarSilencioso(
            _auditoria,
            _logger,
            modulo,
            accion,
            usuario,
            entidad,
            entidadId,
            AuditoriaSnapshot.Json(antes),
            AuditoriaSnapshot.Json(despues),
            contexto: _contextoAuditoria);
    }
}
