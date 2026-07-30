using System;
using System.Linq;
using System.Threading.Tasks;
using Bital.Application.DTOs.DietasCocina;
using Bital.Application.Interfaces;
using Bital.Domain.Entities.DietasCocina;
using Bital.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Bital.Infrastructure.Services;

public class AuditoriaService : IAuditoriaService
{
    private readonly BitalNegocioDbContext _context;

    public AuditoriaService(BitalNegocioDbContext context)
    {
        _context = context;
    }

    public async Task<ListaEventosAuditoriaDto> ObtenerEventosAsync(FiltrosAuditoriaDto filtros)
    {
        var query = _context.EventosAuditoria.AsQueryable();

        // Aplicar filtros
        if (!string.IsNullOrWhiteSpace(filtros.Modulo))
            query = query.Where(e => e.Modulo == filtros.Modulo);

        if (!string.IsNullOrWhiteSpace(filtros.Resultado))
            query = query.Where(e => e.Resultado == filtros.Resultado);

        if (filtros.Desde.HasValue)
            query = query.Where(e => e.CreadoEn >= filtros.Desde.Value);

        if (filtros.Hasta.HasValue)
            query = query.Where(e => e.CreadoEn <= filtros.Hasta.Value);

        if (!string.IsNullOrWhiteSpace(filtros.Usuario))
            query = query.Where(e => e.Usuario.Contains(filtros.Usuario));

        // Contar total antes de paginar
        var total = await query.CountAsync();

        // Paginar
        var eventosRaw = await query
            .OrderByDescending(e => e.CreadoEn)
            .Skip((filtros.Page - 1) * filtros.PageSize)
            .Take(filtros.PageSize)
            .Select(e => new EventoAuditoriaDto
            {
                Id = e.Id,
                Modulo = e.Modulo,
                Accion = e.Accion,
                Resultado = e.Resultado,
                Usuario = e.Usuario,
                FechaEvento = e.CreadoEn,
                TipoEntidad = e.TipoEntidad,
                EntidadId = e.EntidadId,
                DireccionIp = e.DireccionIp,
                DuracionMs = e.DuracionMs,
                DatosAntes = e.DatosAntes,
                DatosDespues = e.DatosDespues,
            })
            .ToListAsync();

        var eventos = eventosRaw.Select(e => new EventoAuditoriaDto
        {
            Id = e.Id,
            Modulo = e.Modulo,
            Accion = e.Accion,
            Resultado = e.Resultado,
            Usuario = e.Usuario,
            FechaEvento = e.FechaEvento,
            TipoEntidad = e.TipoEntidad,
            EntidadId = e.EntidadId,
            DireccionIp = e.DireccionIp,
            DuracionMs = e.DuracionMs,
            DatosAntes = TruncarTexto(e.DatosAntes, 500),
            DatosDespues = TruncarTexto(e.DatosDespues, 500),
        }).ToList();

        var totalPages = (int)Math.Ceiling(total / (double)filtros.PageSize);

        return new ListaEventosAuditoriaDto
        {
            Data = eventos,
            Meta = new MetaPaginacionDto
            {
                Total = total,
                Page = filtros.Page,
                PageSize = filtros.PageSize,
                TotalPages = totalPages
            }
        };
    }

    public async Task<DetalleAuditoriaDto?> ObtenerDetalleEventoAsync(Guid id)
    {
        var evento = await _context.EventosAuditoria
            .Where(e => e.Id == id)
            .Select(e => new DetalleAuditoriaDto
            {
                Id = e.Id,
                Modulo = e.Modulo,
                Accion = e.Accion,
                Resultado = e.Resultado,
                Usuario = e.Usuario,
                FechaEvento = e.CreadoEn,
                TipoEntidad = e.TipoEntidad,
                EntidadId = e.EntidadId,
                DireccionIp = e.DireccionIp,
                DatosAntes = e.DatosAntes,
                DatosDespues = e.DatosDespues,
                Metadata = e.Metadata,
                MensajeError = e.MensajeError,
                DuracionMs = e.DuracionMs
            })
            .FirstOrDefaultAsync();

        return evento;
    }

    public async Task RegistrarEventoAsync(
        string modulo,
        string accion,
        string resultado,
        string usuario,
        string? tipoEntidad = null,
        Guid? entidadId = null,
        string? datosAntes = null,
        string? datosDespues = null,
        string? metadata = null,
        string? mensajeError = null,
        int? duracionMs = null,
        string? direccionIp = null)
    {
        var evento = new EventoAuditoria
        {
            Id = Guid.NewGuid(),
            Modulo = modulo,
            Accion = accion,
            Resultado = resultado,
            Usuario = usuario,
            TipoEntidad = tipoEntidad,
            EntidadId = entidadId,
            DatosAntes = datosAntes,
            DatosDespues = datosDespues,
            Metadata = metadata,
            MensajeError = mensajeError,
            DuracionMs = duracionMs,
            DireccionIp = direccionIp,
            CreadoPor = usuario,
            CreadoEn = DateTime.UtcNow
        };

        _context.EventosAuditoria.Add(evento);
        await _context.SaveChangesAsync();
    }

    private static string? TruncarTexto(string? valor, int maxLen)
    {
        if (string.IsNullOrEmpty(valor) || valor.Length <= maxLen) return valor;
        return valor[..maxLen] + "…";
    }
}
