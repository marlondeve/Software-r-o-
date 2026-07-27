using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Bital.Application.DTOs.DietasCocina;
using Bital.Application.Interfaces;
using Bital.Domain.Entities.DietasCocina;
using Bital.Infrastructure.Data;
using Bital.Infrastructure.DietasCocina;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Bital.Infrastructure.Services;

public class ConciliacionService : IConciliacionService
{
    private readonly BitalNegocioDbContext _context;
    private readonly ILogger<ConciliacionService> _logger;

    public ConciliacionService(
        BitalNegocioDbContext context,
        ILogger<ConciliacionService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<FilaConciliacionDto>> ObtenerConciliacionAsync(
        string? busqueda = null,
        string? numeroFactura = null,
        string? periodo = null,
        string? proveedor = null,
        string? estado = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.FilasConciliacion
            .Include(f => f.FilaDieta)
            .Include(f => f.Etiqueta)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(busqueda))
        {
            var busquedaLower = busqueda.ToLower();
            query = query.Where(f =>
                f.Paciente.ToLower().Contains(busquedaLower) ||
                f.Cedula.Contains(busquedaLower) ||
                f.NumeroFactura.ToLower().Contains(busquedaLower));
        }

        if (!string.IsNullOrWhiteSpace(numeroFactura))
        {
            query = query.Where(f => f.NumeroFactura == numeroFactura);
        }

        if (!string.IsNullOrWhiteSpace(periodo))
        {
            query = query.Where(f => f.Periodo == periodo);
        }

        if (!string.IsNullOrWhiteSpace(proveedor))
        {
            query = query.Where(f => f.Proveedor == proveedor);
        }

        if (!string.IsNullOrWhiteSpace(estado))
        {
            query = query.Where(f => f.Estado == estado);
        }

        var filas = await query
            .OrderByDescending(f => f.FechaOperativa)
            .ThenBy(f => f.Paciente)
            .ToListAsync(cancellationToken);

        _logger.LogInformation(
            "Obtenidas {Count} líneas de conciliación con filtros: busqueda={Busqueda}, factura={Factura}, periodo={Periodo}, proveedor={Proveedor}, estado={Estado}",
            filas.Count, busqueda, numeroFactura, periodo, proveedor, estado);

        return filas.Select(MapearADto).ToList();
    }

    public async Task<DetalleConciliacionDto> ObtenerDetalleConciliacionAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var fila = await _context.FilasConciliacion
            .Include(f => f.FilaDieta)
            .Include(f => f.Etiqueta)
                .ThenInclude(e => e!.FilaDieta)
            .Include(f => f.Etiqueta)
                .ThenInclude(e => e!.OrdenCocina)
            .FirstOrDefaultAsync(f => f.Id == id, cancellationToken);

        if (fila == null)
            throw new KeyNotFoundException($"Línea de conciliación con ID {id} no encontrada");

        // Obtener eventos de trazabilidad de la dieta
        var eventos = Array.Empty<EventoTrazabilidadDto>();
        if (fila.FilaDietaId.HasValue)
        {
            var eventosEntidad = await _context.EventosTrazabilidad
                .Where(e => e.FilaDietaId == fila.FilaDietaId.Value)
                .OrderBy(e => e.FechaEvento)
                .ToListAsync(cancellationToken);

            eventos = eventosEntidad.Select(e => new EventoTrazabilidadDto
            {
                Id = e.Id,
                TipoEvento = e.TipoEvento,
                Descripcion = e.Descripcion,
                EstadoAnterior = e.EstadoAnterior?.ToString(),
                EstadoNuevo = e.EstadoNuevo.ToString(),
                Usuario = e.Usuario,
                FechaEvento = e.FechaEvento,
                DatosAdicionales = e.DatosAdicionales
            }).ToArray();
        }

        // Generar alertas
        var alertas = new List<string>();
        var recomendaciones = new List<string>();

        if (fila.Diferencia > 0)
        {
            alertas.Add($"Se facturaron {fila.Diferencia} unidades más de las entregadas");
            recomendaciones.Add("Verificar con el proveedor la causa de la diferencia");
        }
        else if (fila.Diferencia < 0)
        {
            alertas.Add($"Se entregaron {Math.Abs(fila.Diferencia)} unidades más de las facturadas");
            recomendaciones.Add("Confirmar que todas las entregas fueron registradas correctamente");
        }

        if (fila.CantidadSolicitada != fila.CantidadEntregada)
        {
            alertas.Add("La cantidad entregada no coincide con la solicitada");
            recomendaciones.Add("Revisar el motivo de la diferencia entre solicitud y entrega");
        }

        EtiquetaEnfermeraDto? etiquetaDto = null;
        if (fila.Etiqueta != null)
        {
            etiquetaDto = new EtiquetaEnfermeraDto
            {
                Id = fila.Etiqueta.Id,
                Codigo = fila.Etiqueta.Codigo,
                OrdenCocinaId = fila.Etiqueta.OrdenCocinaId,
                NumeroOrden = fila.Etiqueta.OrdenCocina?.NumeroOrden ?? 0,
                FilaDietaId = fila.Etiqueta.FilaDietaId,
                PacienteId = fila.Etiqueta.FilaDieta?.PacienteId ?? string.Empty,
                Paciente = fila.Etiqueta.FilaDieta?.Paciente ?? string.Empty,
                Cedula = fila.Etiqueta.FilaDieta?.Cedula ?? string.Empty,
                Pabellon = fila.Etiqueta.FilaDieta?.Pabellon ?? string.Empty,
                Habitacion = fila.Etiqueta.FilaDieta?.Habitacion ?? string.Empty,
                Comida = fila.Etiqueta.Comida.ToString(),
                TipoDieta = string.Empty,
                Consistencia = fila.Etiqueta.FilaDieta?.Consistencia ?? string.Empty,
                EstadoLogistica = fila.Etiqueta.EstadoLogistica,
                FechaOperativa = fila.Etiqueta.FechaOperativa,
                GeneradaPor = fila.Etiqueta.GeneradaPor,
                GeneradaEn = fila.Etiqueta.GeneradaEn,
                ImpresaEn = fila.Etiqueta.ImpresaEn,
                RecibidoPor = fila.Etiqueta.RecibidoPor,
                PreEntregadaEn = fila.Etiqueta.PreEntregadaEn,
                EntregadoPor = fila.Etiqueta.EntregadoPor,
                EntregadaEn = fila.Etiqueta.EntregadaEn,
                MotivoDevolucion = fila.Etiqueta.MotivoDevolucion,
                EstadoDietaDevolucion = fila.Etiqueta.EstadoDietaDevolucion,
                ObservacionesDevolucion = fila.Etiqueta.ObservacionesDevolucion,
                FotoDevolucionUrl = fila.Etiqueta.FotoDevolucionUrl,
                DevueltaEn = fila.Etiqueta.DevueltaEn,
                Observaciones = fila.Etiqueta.Observaciones
            };
        }

        return new DetalleConciliacionDto
        {
            Linea = MapearADto(fila),
            EventosDieta = eventos,
            Etiqueta = etiquetaDto,
            Alertas = alertas.ToArray(),
            Recomendaciones = recomendaciones.ToArray()
        };
    }

    public async Task<FilaConciliacionDto> MarcarConciliadoAsync(
        Guid id,
        MarcarConciliadoDto datos,
        string usuario,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(datos.Motivo))
            throw new ArgumentException("El motivo es requerido");

        if (datos.Observaciones.Length < 10)
            throw new ArgumentException("Las observaciones deben tener al menos 10 caracteres");

        var fila = await _context.FilasConciliacion
            .FirstOrDefaultAsync(f => f.Id == id, cancellationToken);

        if (fila == null)
            throw new KeyNotFoundException($"Línea de conciliación con ID {id} no encontrada");

        fila.Estado = "conciliado";
        fila.Motivo = datos.Motivo;
        fila.Observaciones = datos.Observaciones;
        fila.ResueltoPor = usuario;
        fila.ResueltaEn = DateTime.UtcNow;
        fila.ModificadoPor = usuario;
        fila.ModificadoEn = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Línea de conciliación {Id} marcada como conciliada por {Usuario}: {Motivo}",
            id, usuario, datos.Motivo);

        return MapearADto(fila);
    }

    public async Task<FilaConciliacionDto> MarcarPendienteRevisionAsync(
        Guid id,
        MarcarPendienteRevisionDto datos,
        string usuario,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(datos.Motivo))
            throw new ArgumentException("El motivo es requerido");

        var fila = await _context.FilasConciliacion
            .FirstOrDefaultAsync(f => f.Id == id, cancellationToken);

        if (fila == null)
            throw new KeyNotFoundException($"Línea de conciliación con ID {id} no encontrada");

        fila.Estado = "en_revision";
        fila.Motivo = datos.Motivo;
        fila.Observaciones = datos.Observaciones;
        fila.ResueltoPor = usuario;
        fila.ResueltaEn = DateTime.UtcNow;
        fila.ModificadoPor = usuario;
        fila.ModificadoEn = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Línea de conciliación {Id} marcada como pendiente revisión por {Usuario}: {Motivo}",
            id, usuario, datos.Motivo);

        return MapearADto(fila);
    }

    public async Task<List<KpiConciliacionDto>> ObtenerKpisConciliacionAsync(
        string? periodo = null,
        string? proveedor = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.FilasConciliacion.AsQueryable();

        if (!string.IsNullOrWhiteSpace(periodo))
        {
            query = query.Where(f => f.Periodo == periodo);
        }

        if (!string.IsNullOrWhiteSpace(proveedor))
        {
            query = query.Where(f => f.Proveedor == proveedor);
        }

        var filas = await query.ToListAsync(cancellationToken);

        var totalLineas = filas.Count;
        var conciliadas = filas.Count(f => f.Estado == "conciliado");
        var pendientes = filas.Count(f => f.Estado == "pendiente");
        var enRevision = filas.Count(f => f.Estado == "en_revision");
        var totalDiferencias = filas.Sum(f => Math.Abs(f.Diferencia));
        var valorTotalFacturado = filas.Sum(f => f.ValorTotal);
        var valorDiferencias = filas.Where(f => f.Diferencia != 0).Sum(f => Math.Abs(f.Diferencia) * f.ValorUnitario);

        var kpis = new List<KpiConciliacionDto>
        {
            new()
            {
                Clave = "total_lineas",
                Etiqueta = "Total líneas",
                Valor = totalLineas,
                Formato = "numero"
            },
            new()
            {
                Clave = "conciliadas",
                Etiqueta = "Conciliadas",
                Valor = conciliadas,
                Formato = "numero"
            },
            new()
            {
                Clave = "pendientes",
                Etiqueta = "Pendientes",
                Valor = pendientes,
                Formato = "numero"
            },
            new()
            {
                Clave = "en_revision",
                Etiqueta = "En revisión",
                Valor = enRevision,
                Formato = "numero"
            },
            new()
            {
                Clave = "porcentaje_conciliado",
                Etiqueta = "% Conciliado",
                Valor = totalLineas > 0 ? Math.Round((decimal)conciliadas / totalLineas * 100, 2) : 0,
                Formato = "porcentaje"
            },
            new()
            {
                Clave = "total_diferencias",
                Etiqueta = "Total diferencias",
                Valor = totalDiferencias,
                Formato = "numero"
            },
            new()
            {
                Clave = "valor_total_facturado",
                Etiqueta = "Valor total facturado",
                Valor = valorTotalFacturado,
                Formato = "moneda"
            },
            new()
            {
                Clave = "valor_diferencias",
                Etiqueta = "Valor diferencias",
                Valor = valorDiferencias,
                Formato = "moneda"
            }
        };

        _logger.LogInformation(
            "Calculados {Count} KPIs de conciliación para periodo={Periodo}, proveedor={Proveedor}",
            kpis.Count, periodo, proveedor);

        return kpis;
    }

    public async Task<FilaConciliacionDto> SubirFacturaAsync(
        Guid id,
        Stream archivo,
        string nombreArchivo,
        string usuario,
        CancellationToken cancellationToken = default)
    {
        var fila = await _context.FilasConciliacion
            .FirstOrDefaultAsync(f => f.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Línea de conciliación {id} no encontrada");

        var url = await ArchivosUploadHelper.GuardarAsync(
            archivo,
            "conciliacion",
            nombreArchivo,
            cancellationToken);

        fila.FacturaDocumentoUrl = url;
        fila.ModificadoEn = DateTime.UtcNow;
        fila.ModificadoPor = usuario;
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Factura cargada para conciliación {Id}: {Url}", id, url);
        return MapearADto(fila);
    }

    private static FilaConciliacionDto MapearADto(FilaConciliacion fila)
    {
        return new FilaConciliacionDto
        {
            Id = fila.Id,
            NumeroFactura = fila.NumeroFactura,
            Proveedor = fila.Proveedor,
            Periodo = fila.Periodo,
            FechaOperativa = fila.FechaOperativa,
            Comida = fila.Comida,
            PacienteId = fila.PacienteId,
            Paciente = fila.Paciente,
            Cedula = fila.Cedula,
            Pabellon = fila.Pabellon,
            Habitacion = fila.Habitacion,
            TipoDieta = fila.TipoDieta,
            Consistencia = fila.Consistencia,
            CantidadSolicitada = fila.CantidadSolicitada,
            CantidadEntregada = fila.CantidadEntregada,
            CantidadFacturada = fila.CantidadFacturada,
            Diferencia = fila.Diferencia,
            ValorUnitario = fila.ValorUnitario,
            ValorTotal = fila.ValorTotal,
            Estado = fila.Estado,
            Motivo = fila.Motivo,
            Observaciones = fila.Observaciones,
            ResueltoPor = fila.ResueltoPor,
            ResueltaEn = fila.ResueltaEn,
            FilaDietaId = fila.FilaDietaId,
            EtiquetaId = fila.EtiquetaId
        };
    }
}
