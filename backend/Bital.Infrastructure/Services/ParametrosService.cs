using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Bital.Application.DTOs.DietasCocina;
using Bital.Application.Interfaces;
using Bital.Domain.Entities.DietasCocina;
using Bital.Domain.Enums;
using Bital.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Bital.Infrastructure.Services;

public class ParametrosService : IParametrosService
{
    private readonly BitalNegocioDbContext _context;

    public ParametrosService(BitalNegocioDbContext context)
    {
        _context = context;
    }

    public async Task<List<TiempoComidaDto>> ObtenerTiemposComidaAsync()
    {
        var tiempos = await _context.TiemposComida
            .OrderBy(t => t.Comida)
            .ToListAsync();

        return tiempos.Select(t => new TiempoComidaDto
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
            ModificadoEn = t.ModificadoEn
        }).ToList();
    }

    public async Task<List<TiempoComidaDto>> ActualizarTiemposComidaAsync(ActualizarTiemposComidaDto dto)
    {
        // Obtener configuración existente
        var existentes = await _context.TiemposComida.ToListAsync();

        foreach (var item in dto.Tiempos)
        {
            if (!Enum.TryParse<TiempoComida>(item.Comida, out var comida))
                throw new ArgumentException($"Tiempo de comida inválido: {item.Comida}");

            var existente = existentes.FirstOrDefault(t => t.Comida == comida);

            if (existente != null)
            {
                // Actualizar existente
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
                // Crear nuevo
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
                    CreadoEn = DateTime.UtcNow
                };
                _context.TiemposComida.Add(nuevo);
            }
        }

        await _context.SaveChangesAsync();
        return await ObtenerTiemposComidaAsync();
    }

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
        // Eliminar categorías existentes (soft delete marcando como inactivas)
        var existentes = await _context.CategoriasEdad.ToListAsync();
        foreach (var existente in existentes)
        {
            existente.Activa = false;
        }

        // Crear nuevas categorías
        foreach (var item in dto.Categorias)
        {
            // Buscar si ya existe una categoría con el mismo nombre
            var categoria = existentes.FirstOrDefault(c => c.Nombre == item.Nombre);

            if (categoria != null)
            {
                // Reactivar y actualizar
                categoria.EdadMinima = item.EdadMinima;
                categoria.EdadMaxima = item.EdadMaxima;
                categoria.FactorPorcion = item.FactorPorcion;
                categoria.Descripcion = item.Descripcion;
                categoria.Activa = item.Activa;
                categoria.Orden = item.Orden;
                categoria.ModificadoPor = dto.Usuario;
                categoria.ModificadoEn = DateTime.UtcNow;
            }
            else
            {
                // Crear nueva
                var nueva = new CategoriaEdad
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
                _context.CategoriasEdad.Add(nueva);
            }
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
            throw new InvalidOperationException($"No se encontró categoría para la edad {edad}");

        return new ClasificarEdadResponseDto
        {
            Categoria = categoria.Nombre,
            EdadMinima = categoria.EdadMinima,
            EdadMaxima = categoria.EdadMaxima,
            FactorPorcion = categoria.FactorPorcion
        };
    }
}
