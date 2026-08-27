using Bital.Application.DTOs.DietasCocina;
using Bital.Application.Interfaces;
using Bital.Domain.Entities.DietasCocina;
using Bital.Domain.Enums;
using Bital.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Bital.Infrastructure.DietasCocina;
using Microsoft.Extensions.Logging;

namespace Bital.Infrastructure;

/// <summary>
/// Servicio de lógica de negocio para Órdenes de Cocina
/// </summary>
public class OrdenesCocinaService : IOrdenesCocinaService
{
    private readonly BitalNegocioDbContext _context;
    private readonly ILogger<OrdenesCocinaService> _logger;
    private readonly IAuditoriaService _auditoria;
    private readonly IAuditoriaContextoRequest _contextoAuditoria;

    public OrdenesCocinaService(
        BitalNegocioDbContext context,
        ILogger<OrdenesCocinaService> logger,
        IAuditoriaService auditoria,
        IAuditoriaContextoRequest contextoAuditoria)
    {
        _context = context;
        _logger = logger;
        _auditoria = auditoria;
        _contextoAuditoria = contextoAuditoria;
    }

    private static bool TryParseTiempoComida(string? comida, out TiempoComida tiempoComida)
    {
        tiempoComida = default;
        return !string.IsNullOrWhiteSpace(comida)
            && Enum.TryParse<TiempoComida>(comida, ignoreCase: true, out tiempoComida);
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

        if (TryParseTiempoComida(comida, out var tiempoComida))
            query = query.Where(o => o.Comida == tiempoComida);

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
        // Validar que las dietas existan
        var dietas = await _context.FilasDietas
            .Where(d => datos.DietasIds.Contains(d.Id))
            .ToListAsync(cancellationToken);

        if (dietas.Count != datos.DietasIds.Count)
            throw new InvalidOperationException("Algunas dietas no fueron encontradas");

        // Reutilizar orden ya asociada (evita fallos al regenerar/vincular en lote)
        var ordenesExistentes = dietas
            .Where(d => d.OrdenCocinaId.HasValue)
            .Select(d => d.OrdenCocinaId!.Value)
            .Distinct()
            .ToList();

        if (ordenesExistentes.Count == 1 && dietas.All(d => d.OrdenCocinaId == ordenesExistentes[0]))
        {
            var ordenExistente = await _context.OrdenesCocina
                .Include(o => o.Dietas)
                .FirstOrDefaultAsync(o => o.Id == ordenesExistentes[0], cancellationToken)
                ?? throw new KeyNotFoundException($"Orden {ordenesExistentes[0]} no encontrada");

            if (!string.Equals(ordenExistente.Estado, "Cancelada", StringComparison.OrdinalIgnoreCase))
            {
                return MapearADtoConDietas(ordenExistente);
            }
        }

        // Una dieta cancelada (p. ej. salida clínica IngInSlC='S') no vuelve a cocina
        // aunque conserve el vínculo con su orden anterior.
        var dietasCanceladas = dietas.Count(d => d.Estado == EstadoDieta.Cancelada);
        if (dietasCanceladas > 0)
            throw new InvalidOperationException($"{dietasCanceladas} dietas están canceladas");

        var dietasNoConfirmadas = dietas
            .Where(d => d.Estado != EstadoDieta.Confirmada && !d.OrdenCocinaId.HasValue)
            .ToList();
        if (dietasNoConfirmadas.Any())
            throw new InvalidOperationException($"{dietasNoConfirmadas.Count} dietas no están confirmadas");

        // El índice IX_OrdenCocina_Numero es único globalmente (no por día).
        var maxNumero = await _context.OrdenesCocina
            .MaxAsync(o => (int?)o.NumeroOrden, cancellationToken) ?? 0;
        var numeroOrden = maxNumero + 1;

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
            Estado = "EnPreparacion",
            Observaciones = datos.Observaciones,
            CreadoPor = usuario,
            ChecklistJson = ChecklistOperativoHelper.Serializar(ChecklistOperativoHelper.PlantillaInicial()),
        };

        _context.OrdenesCocina.Add(orden);

        // Cambiar estado de las dietas a EnPreparacion y asociarlas a la orden
        foreach (var dieta in dietas)
        {
            var estadoAnterior = dieta.Estado;
            // No retroceder dietas que ya avanzaron (ListaEnvio, EnRuta, ...).
            if (dieta.Estado == EstadoDieta.Confirmada)
            {
                dieta.Estado = EstadoDieta.EnPreparacion;
            }
            dieta.OrdenCocinaId = orden.Id;

            // Registrar evento de trazabilidad
            var evento = new EventoTrazabilidad
            {
                Id = Guid.NewGuid(),
                FilaDietaId = dieta.Id,
                TipoEvento = "orden_cocina_creada",
                Descripcion = $"Dieta incluida en orden de cocina #{numeroOrden}",
                EstadoAnterior = estadoAnterior,
                EstadoNuevo = dieta.Estado,
                Usuario = usuario,
                FechaEvento = DateTime.UtcNow,
                DatosAdicionales = orden.Id.ToString(),
                CreadoPor = usuario,
            };

            _context.EventosTrazabilidad.Add(evento);
        }

        await _context.SaveChangesAsync(cancellationToken);

        await _context.Entry(orden).Collection(o => o.Dietas).LoadAsync(cancellationToken);

        _logger.LogInformation(
            "Orden de cocina #{NumeroOrden} creada para {Fecha} {Comida} con {Total} dietas por {Usuario}",
            numeroOrden, datos.FechaOperativa.Date, datos.Comida, dietas.Count, usuario);

        AuditoriaOperativaHelper.RegistrarSilencioso(
            _auditoria,
            _logger,
            AuditoriaCatalogo.Modulos.Ordenes,
            AuditoriaCatalogo.Acciones.Crear,
            usuario,
            AuditoriaCatalogo.Entidades.OrdenCocina,
            orden.Id,
            null,
            AuditoriaSnapshot.Json(new { orden.NumeroOrden, datos.Comida, datos.FechaOperativa, totalDietas = dietas.Count }),
            contexto: _contextoAuditoria);

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

        if (datos.Estado == "Completada")
        {
            var checklist = ChecklistOperativoHelper.DesdeJson(orden.ChecklistJson);
            if (!ChecklistOperativoHelper.ObligatoriosCompletos(checklist))
            {
                throw new InvalidOperationException(
                    "Complete los ítems obligatorios del checklist antes de marcar la orden como completada");
            }
        }

        orden.Estado = datos.Estado;

        if (!string.IsNullOrEmpty(datos.Observaciones))
        {
            orden.Observaciones = string.IsNullOrEmpty(orden.Observaciones)
                ? datos.Observaciones
                : $"{orden.Observaciones}\n[{DateTime.UtcNow:yyyy-MM-dd HH:mm}] {datos.Observaciones}";
        }

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
        else if (datos.Estado == "Despachada")
        {
            foreach (var dieta in orden.Dietas)
            {
                var estadoDietaAnterior = dieta.Estado;
                dieta.Estado = EstadoDieta.EnRuta;

                var evento = new EventoTrazabilidad
                {
                    Id = Guid.NewGuid(),
                    FilaDietaId = dieta.Id,
                    TipoEvento = "orden_despachada",
                    Descripcion = $"Orden #{orden.NumeroOrden} despachada - Dieta en ruta",
                    EstadoAnterior = estadoDietaAnterior,
                    EstadoNuevo = EstadoDieta.EnRuta,
                    Usuario = usuario,
                    FechaEvento = DateTime.UtcNow,
                    DatosAdicionales = orden.Id.ToString()
                };

                _context.EventosTrazabilidad.Add(evento);
            }
        }
        else if (datos.Estado == "EnPreparacion")
        {
            foreach (var dieta in orden.Dietas.Where(d => d.Estado == EstadoDieta.Confirmada))
            {
                var estadoDietaAnterior = dieta.Estado;
                dieta.Estado = EstadoDieta.EnPreparacion;

                _context.EventosTrazabilidad.Add(new EventoTrazabilidad
                {
                    Id = Guid.NewGuid(),
                    FilaDietaId = dieta.Id,
                    TipoEvento = "orden_en_preparacion",
                    Descripcion = $"Orden #{orden.NumeroOrden} en preparación",
                    EstadoAnterior = estadoDietaAnterior,
                    EstadoNuevo = EstadoDieta.EnPreparacion,
                    Usuario = usuario,
                    FechaEvento = DateTime.UtcNow,
                    DatosAdicionales = orden.Id.ToString(),
                });
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Orden #{NumeroOrden} actualizada de {EstadoAnterior} a {EstadoNuevo} por {Usuario}",
            orden.NumeroOrden, estadoAnterior, datos.Estado, usuario);

        AuditoriaOperativaHelper.RegistrarSilencioso(
            _auditoria,
            _logger,
            AuditoriaCatalogo.Modulos.Ordenes,
            AuditoriaCatalogo.Acciones.ActualizarEstado,
            usuario,
            AuditoriaCatalogo.Entidades.OrdenCocina,
            orden.Id,
            AuditoriaSnapshot.Json(new { estado = estadoAnterior }),
            AuditoriaSnapshot.Json(new { estado = datos.Estado }),
            contexto: _contextoAuditoria);

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

        // Revertir estado de las dietas a Confirmada y desasociar de la orden.
        // Las canceladas (salida clínica) no se reactivan al cancelar la orden.
        foreach (var dieta in orden.Dietas.Where(d => d.Estado != EstadoDieta.Cancelada))
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

        AuditoriaOperativaHelper.RegistrarSilencioso(
            _auditoria,
            _logger,
            AuditoriaCatalogo.Modulos.Ordenes,
            AuditoriaCatalogo.Acciones.Cancelar,
            usuario,
            AuditoriaCatalogo.Entidades.OrdenCocina,
            orden.Id,
            null,
            AuditoriaSnapshot.Json(new { orden.NumeroOrden, motivo }),
            contexto: _contextoAuditoria);

        return true;
    }

    public async Task<OrdenCocinaDto> ActualizarChecklistOrdenAsync(
        Guid ordenId,
        ActualizarChecklistOrdenDto datos,
        string usuario,
        CancellationToken cancellationToken = default)
    {
        var orden = await _context.OrdenesCocina
            .Include(o => o.Dietas)
            .FirstOrDefaultAsync(o => o.Id == ordenId, cancellationToken)
            ?? throw new KeyNotFoundException($"Orden {ordenId} no encontrada");

        var actual = ChecklistOperativoHelper.DesdeJson(orden.ChecklistJson);
        var actualizado = ChecklistOperativoHelper.AplicarActualizacion(actual, datos.Items);
        orden.ChecklistJson = ChecklistOperativoHelper.Serializar(actualizado);
        orden.ModificadoPor = usuario;
        orden.ModificadoEn = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Checklist de orden #{NumeroOrden} actualizado por {Usuario}",
            orden.NumeroOrden,
            usuario);

        AuditoriaOperativaHelper.RegistrarSilencioso(
            _auditoria,
            _logger,
            AuditoriaCatalogo.Modulos.Ordenes,
            AuditoriaCatalogo.Acciones.ActualizarChecklist,
            usuario,
            AuditoriaCatalogo.Entidades.OrdenCocina,
            orden.Id,
            AuditoriaSnapshot.Json(actual),
            AuditoriaSnapshot.Json(actualizado),
            contexto: _contextoAuditoria);

        return MapearADtoConDietas(orden);
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
            Observaciones = orden.Observaciones,
            DietasIds = orden.Dietas?.Select(d => d.Id).ToList(),
            Checklist = ChecklistOperativoHelper.DesdeJson(orden.ChecklistJson),
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
            CancelacionPorSalidaClinica =
                d.Estado == EstadoDieta.Cancelada
                && DietasReglasNegocio.EsObservacionSalidaClinica(d.Observaciones, d.Estado),
            SalidaClinicaSostenida = DietasReglasNegocio.EsSalidaClinicaSostenida(d),
            OrdenCocinaId = d.OrdenCocinaId,
            FechaOperativa = d.FechaOperativa
        }).ToList();

        return dto;
    }
}
