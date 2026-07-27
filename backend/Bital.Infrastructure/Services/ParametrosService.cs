using Bital.Application.DTOs.DietasCocina;
using Bital.Application.Interfaces;
using Bital.Domain.Entities.DietasCocina;
using Bital.Domain.Enums;
using Bital.Infrastructure.Data;
using Bital.Infrastructure.DietasCocina;
using Microsoft.EntityFrameworkCore;

namespace Bital.Infrastructure.Services;

public class ParametrosService : IParametrosService
{
    private readonly BitalNegocioDbContext _context;

    public ParametrosService(BitalNegocioDbContext context)
    {
        _context = context;
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
        return await ObtenerTiemposComidaAsync();
    }

    private static TiempoComidaDto MapTiempoComida(TiempoComidaConfig t) => new()
    {
        Id = t.Id,
        Comida = t.Comida.ToString(),
        HoraPreparacion = t.HoraPreparacion.ToString(@"hh\:mm"),
        HoraCierre = t.HoraCierre.ToString(@"hh\:mm"),
        HoraEntrega = t.HoraEntrega.ToString(@"hh\:mm"),
        Activo = t.Activo,
        MinutosAlertaCierre = t.MinutosAlertaCierre,
        Observaciones = t.Observaciones,
        ModificadoPor = t.ModificadoPor,
        ModificadoEn = t.ModificadoEn,
    };

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
}
