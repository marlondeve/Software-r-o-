using Bital.Application.DTOs.DietasCocina;
using Bital.Application.Interfaces;
using Bital.Domain.Entities.DietasCocina;
using Bital.Domain.Enums;
using Bital.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Bital.Infrastructure;

/// <summary>
/// Servicio de lógica de negocio para Órdenes de Cocina
/// </summary>
public class OrdenesCocinaService : IOrdenesCocinaService
{
    private readonly BitalNegocioDbContext _context;
    private readonly ILogger<OrdenesCocinaService> _logger;

    public OrdenesCocinaService(
        BitalNegocioDbContext context,
        ILogger<OrdenesCocinaService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<OrdenCocinaDto>> ObtenerOrdenesAsync(
        DateTime? fecha,
        string? comida,
        string? estado,
        CancellationToken cancellationToken = default)
    {
        var query = _context.OrdenesCocina
            .Include(o => o.Dietas)
            .AsQueryable();

        if (fecha.HasValue)
            query = query.Where(o => o.FechaOperativa.Date == fecha.Value.Date);

        if (!string.IsNullOrEmpty(comida))
            query = query.Where(o => o.Comida.ToString() == comida);

        if (!string.IsNullOrEmpty(estado))
            query = query.Where(o => o.Estado == estado);

        var ordenes = await query
            .OrderByDescending(o => o.GeneradoEn)
            .ToListAsync(cancellationToken);

        return ordenes.Select(MapearADto).ToList();
    }

    public async Task<OrdenCocinaDto> ObtenerDetalleOrdenAsync(Guid ordenId, CancellationToken cancellationToken = default)
    {
        var orden = await _context.OrdenesCocina
            .Include(o => o.Dietas)
            .FirstOrDefaultAsync(o => o.Id == ordenId, cancellationToken)
            ?? throw new KeyNotFoundException($"Orden {ordenId} no encontrada");

        return MapearADtoConDietas(orden);
    }

    public async Task<OrdenCocinaDto> CrearOrdenAsync(
        CrearOrdenCocinaDto datos,
        string usuario,
        CancellationToken cancellationToken = default)
    {
        // Validar que las dietas existan y estén confirmadas
        var dietas = await _context.FilasDietas
            .Where(d => datos.DietasIds.Contains(d.Id))
            .ToListAsync(cancellationToken);

        if (dietas.Count != datos.DietasIds.Count)
            throw new InvalidOperationException("Algunas dietas no fueron encontradas");

        var dietasNoConfirmadas = dietas.Where(d => d.Estado != EstadoDieta.Confirmada).ToList();
        if (dietasNoConfirmadas.Any())
            throw new InvalidOperationException($"{dietasNoConfirmadas.Count} dietas no están confirmadas");

        // Obtener el siguiente número de orden del día
        var ultimaOrden = await _context.OrdenesCocina
            .Where(o => o.FechaOperativa.Date == datos.FechaOperativa.Date)
            .OrderByDescending(o => o.NumeroOrden)
            .FirstOrDefaultAsync(cancellationToken);

        var numeroOrden = (ultimaOrden?.NumeroOrden ?? 0) + 1;

        // Parsear comida
        if (!Enum.TryParse<TiempoComida>(datos.Comida, out var comida))
            throw new InvalidOperationException($"Comida '{datos.Comida}' no válida");

        // Crear la orden
        var orden = new OrdenCocina
        {
            Id = Guid.NewGuid(),
            NumeroOrden = numeroOrden,
            Comida = comida,
            FechaOperativa = datos.FechaOperativa.Date,
            TotalDietas = dietas.Count,
            GeneradoPor = usuario,
            GeneradoEn = DateTime.UtcNow,
            Estado = "Pendiente",
            Observaciones = datos.Observaciones
        };

        _context.OrdenesCocina.Add(orden);

        // Cambiar estado de las dietas a EnPreparacion y asociarlas a la orden
        foreach (var dieta in dietas)
        {
            var estadoAnterior = dieta.Estado;
            dieta.Estado = EstadoDieta.EnPreparacion;
            dieta.OrdenCocinaId = orden.Id;

            // Registrar evento de trazabilidad
            var evento = new EventoTrazabilidad
            {
                Id = Guid.NewGuid(),
                FilaDietaId = dieta.Id,
                TipoEvento = "orden_cocina_creada",
                Descripcion = $"Dieta incluida en orden de cocina #{numeroOrden}",
                EstadoAnterior = estadoAnterior,
                EstadoNuevo = EstadoDieta.EnPreparacion,
                Usuario = usuario,
                FechaEvento = DateTime.UtcNow,
                DatosAdicionales = orden.Id.ToString()
            };

            _context.EventosTrazabilidad.Add(evento);
        }

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Orden de cocina #{NumeroOrden} creada para {Fecha} {Comida} con {Total} dietas por {Usuario}",
            numeroOrden, datos.FechaOperativa.Date, datos.Comida, dietas.Count, usuario);

        return MapearADtoConDietas(orden);
    }

    public async Task<OrdenCocinaDto> ActualizarEstadoOrdenAsync(
        Guid ordenId,
        ActualizarEstadoOrdenDto datos,
        string usuario,
        CancellationToken cancellationToken = default)
    {
        var orden = await _context.OrdenesCocina
            .Include(o => o.Dietas)
            .FirstOrDefaultAsync(o => o.Id == ordenId, cancellationToken)
            ?? throw new KeyNotFoundException($"Orden {ordenId} no encontrada");

        var estadoAnterior = orden.Estado;
        orden.Estado = datos.Estado;

        if (!string.IsNullOrEmpty(datos.Observaciones))
        {
            orden.Observaciones = string.IsNullOrEmpty(orden.Observaciones)
                ? datos.Observaciones
                : $"{orden.Observaciones}\n[{DateTime.UtcNow:yyyy-MM-dd HH:mm}] {datos.Observaciones}";
        }

        // Si la orden pasa a "Completada", actualizar las dietas a "ListaEnvio"
        if (datos.Estado == "Completada")
        {
            foreach (var dieta in orden.Dietas)
            {
                var estadoDietaAnterior = dieta.Estado;
                dieta.Estado = EstadoDieta.ListaEnvio;

                var evento = new EventoTrazabilidad
                {
                    Id = Guid.NewGuid(),
                    FilaDietaId = dieta.Id,
                    TipoEvento = "orden_completada",
                    Descripcion = $"Orden #{orden.NumeroOrden} completada - Dieta lista para envío",
                    EstadoAnterior = estadoDietaAnterior,
                    EstadoNuevo = EstadoDieta.ListaEnvio,
                    Usuario = usuario,
                    FechaEvento = DateTime.UtcNow,
                    DatosAdicionales = orden.Id.ToString()
                };

                _context.EventosTrazabilidad.Add(evento);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Orden #{NumeroOrden} actualizada de {EstadoAnterior} a {EstadoNuevo} por {Usuario}",
            orden.NumeroOrden, estadoAnterior, datos.Estado, usuario);

        return MapearADto(orden);
    }

    public async Task<bool> CancelarOrdenAsync(
        Guid ordenId,
        string motivo,
        string usuario,
        CancellationToken cancellationToken = default)
    {
        var orden = await _context.OrdenesCocina
            .Include(o => o.Dietas)
            .FirstOrDefaultAsync(o => o.Id == ordenId, cancellationToken)
            ?? throw new KeyNotFoundException($"Orden {ordenId} no encontrada");

        if (orden.Estado == "Completada")
            throw new InvalidOperationException("No se puede cancelar una orden completada");

        orden.Estado = "Cancelada";
        orden.Observaciones = string.IsNullOrEmpty(orden.Observaciones)
            ? $"Cancelada: {motivo}"
            : $"{orden.Observaciones}\n[{DateTime.UtcNow:yyyy-MM-dd HH:mm}] Cancelada: {motivo}";

        // Revertir estado de las dietas a Confirmada y desasociar de la orden
        foreach (var dieta in orden.Dietas)
        {
            var estadoAnterior = dieta.Estado;
            dieta.Estado = EstadoDieta.Confirmada;
            dieta.OrdenCocinaId = null;

            var evento = new EventoTrazabilidad
            {
                Id = Guid.NewGuid(),
                FilaDietaId = dieta.Id,
                TipoEvento = "orden_cancelada",
                Descripcion = $"Orden #{orden.NumeroOrden} cancelada - Dieta revertida a confirmada",
                EstadoAnterior = estadoAnterior,
                EstadoNuevo = EstadoDieta.Confirmada,
                Usuario = usuario,
                FechaEvento = DateTime.UtcNow,
                DatosAdicionales = motivo
            };

            _context.EventosTrazabilidad.Add(evento);
        }

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Orden #{NumeroOrden} cancelada por {Usuario}. Motivo: {Motivo}",
            orden.NumeroOrden, usuario, motivo);

        return true;
    }

    private static OrdenCocinaDto MapearADto(OrdenCocina orden)
    {
        return new OrdenCocinaDto
        {
            Id = orden.Id,
            NumeroOrden = orden.NumeroOrden,
            Comida = orden.Comida.ToString(),
            FechaOperativa = orden.FechaOperativa,
            TotalDietas = orden.TotalDietas,
            Estado = orden.Estado,
            GeneradoPor = orden.GeneradoPor,
            GeneradoEn = orden.GeneradoEn,
            Observaciones = orden.Observaciones
        };
    }

    private static OrdenCocinaDto MapearADtoConDietas(OrdenCocina orden)
    {
        var dto = MapearADto(orden);
        dto.Dietas = orden.Dietas.Select(d => new FilaDietaDto
        {
            Id = d.Id,
            PacienteId = d.PacienteId,
            IdIngreso = d.IdIngreso,
            Cedula = d.Cedula,
            TipoDocumento = d.TipoDocumento,
            Paciente = d.Paciente,
            Edad = d.Edad,
            Servicio = d.Servicio,
            Pabellon = d.Pabellon,
            Habitacion = d.Habitacion,
            Comida = d.Comida.ToString(),
            Consistencia = d.Consistencia,
            TipoDietaId = d.TipoDietaId,
            DescripcionDieta = d.DescripcionDieta,
            Aislado = d.Aislado,
            Aislamiento = d.Aislamiento,
            ObservacionAislamiento = d.ObservacionAislamiento,
            Alergico = d.Alergico,
            Alergias = d.Alergias,
            Estado = d.Estado.ToString(),
            Observaciones = d.Observaciones,
            SolicitadoPor = d.SolicitadoPor,
            SolicitadoEn = d.SolicitadoEn,
            CancelacionTardia = d.CancelacionTardia,
            FechaOperativa = d.FechaOperativa
        }).ToList();

        return dto;
    }
}
