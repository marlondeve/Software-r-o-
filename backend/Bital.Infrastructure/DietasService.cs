using Bital.Application.DTOs.DietasCocina;
using Bital.Application.Interfaces;
using Bital.Domain.Entities.DietasCocina;
using Bital.Domain.Enums;
using Bital.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Bital.Shared.Contracts.Responses;
using Bital.Shared.Contracts.Services;

namespace Bital.Infrastructure.Services;

/// <summary>
/// Implementación del servicio de Dietas y Cocina
/// </summary>
public class DietasService : IDietasService
{
    private readonly BitalNegocioDbContext _context;
    private readonly IAtencionesQueryService _atencionesQueryService;
    private readonly ILogger<DietasService> _logger;

    public DietasService(
        BitalNegocioDbContext context,
        IAtencionesQueryService atencionesQueryService,
        ILogger<DietasService> logger)
    {
        _context = context;
        _atencionesQueryService = atencionesQueryService;
        _logger = logger;
    }

    public async Task<CensoDietasDto> ObtenerCensoAsync(DateTime fecha, string comida, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Obteniendo censo de dietas para {Fecha} - {Comida}", fecha, comida);

        // Parsear la comida
        if (!Enum.TryParse<TiempoComida>(comida, true, out var tiempoComida))
        {
            throw new ArgumentException($"Tiempo de comida inválido: {comida}");
        }

        // 1. Obtener censo de pacientes hospitalizados dentro del host único
        var censoPacientes = (await _atencionesQueryService.GetAtencionesHospitalariasAsync(cancellationToken))
            .Select(p => new PacienteHospitalizadoDto
            {
                IdIngreso = p.IdIngreso,
                Cedula = p.Cedula,
                TipoDocumento = p.TipoDocumento,
                NombreCompleto = p.NombreCompleto,
                Pabellon = p.Pabellon,
                Cama = p.Cama
            })
            .ToList();

        if (!censoPacientes.Any())
        {
            return new CensoDietasDto
            {
                FechaOperativa = fecha,
                Comida = comida
            };
        }

        // 2. Obtener filas de dietas existentes en Bital para esa fecha y comida
        var filasExistentes = await _context.FilasDietas
            .Include(f => f.TipoDieta)
            .Where(f => f.FechaOperativa.Date == fecha.Date && f.Comida == tiempoComida)
            .ToListAsync(cancellationToken);

        var resultado = new CensoDietasDto
        {
            FechaOperativa = fecha,
            Comida = comida,
            TotalPacientes = censoPacientes.Count
        };

        // 3. Fusionar datos: crear fila si no existe
        foreach (var paciente in censoPacientes)
        {
            // Usar la cédula como identificador único del paciente
            var pacienteId = $"{paciente.TipoDocumento}-{paciente.Cedula}";
            var filaExistente = filasExistentes.FirstOrDefault(f => f.PacienteId == pacienteId);

            if (filaExistente == null)
            {
                // Crear nueva fila en estado Pendiente
                filaExistente = new FilaDieta
                {
                    PacienteId = pacienteId,
                    IdIngreso = paciente.IdIngreso,
                    Cedula = paciente.Cedula,
                    TipoDocumento = paciente.TipoDocumento,
                    Paciente = paciente.NombreCompleto,
                    Edad = 0,
                    Servicio = "Sin información",
                    Pabellon = paciente.Pabellon,
                    Habitacion = paciente.Cama,
                    Comida = tiempoComida,
                    FechaOperativa = fecha.Date,
                    Estado = EstadoDieta.Pendiente,
                    Aislamiento = string.Empty,
                    Alergias = string.Empty,
                    CreadoPor = "Sistema"
                };

                _context.FilasDietas.Add(filaExistente);
                filasExistentes.Add(filaExistente);
            }

            resultado.Filas.Add(MapearADto(filaExistente));
        }

        // 4. Guardar nuevas filas
        await _context.SaveChangesAsync(cancellationToken);

        // 5. Calcular estadísticas
        resultado.DietasSolicitadas = resultado.Filas.Count(f => f.Estado != "Pendiente");
        resultado.DietasPendientes = resultado.Filas.Count(f => f.Estado == "Pendiente");
        resultado.DietasConfirmadas = resultado.Filas.Count(f => f.Estado == "Confirmada");

        return resultado;
    }

    public async Task<List<FilaDietaDto>> ObtenerDietasPacienteAsync(string pacienteId, DateTime fecha, CancellationToken cancellationToken = default)
    {
        var filas = await _context.FilasDietas
            .Include(f => f.TipoDieta)
            .Where(f => f.PacienteId == pacienteId && f.FechaOperativa.Date == fecha.Date)
            .OrderBy(f => f.Comida)
            .ToListAsync(cancellationToken);

        return filas.Select(MapearADto).ToList();
    }

    public async Task<FilaDietaDto> SolicitarDietaAsync(Guid filaDietaId, SolicitudDietaDto solicitud, string usuario, CancellationToken cancellationToken = default)
    {
        var fila = await _context.FilasDietas
            .Include(f => f.TipoDieta)
            .FirstOrDefaultAsync(f => f.Id == filaDietaId, cancellationToken);

        if (fila == null)
        {
            throw new KeyNotFoundException($"FilaDieta con ID {filaDietaId} no encontrada");
        }

        // Actualizar datos de la dieta
        fila.TipoDietaId = solicitud.TipoDietaId;
        fila.Consistencia = solicitud.Consistencia;
        fila.DescripcionDieta = solicitud.DescripcionDieta;
        fila.Observaciones = solicitud.Observaciones;
        fila.SolicitadoPor = usuario;
        fila.SolicitadoEn = DateTime.UtcNow;
        fila.ModificadoPor = usuario;
        fila.ModificadoEn = DateTime.UtcNow;

        // Cambiar estado a Solicitada (no Confirmada directamente)
        fila.Estado = EstadoDieta.Solicitada;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Dieta {DietaId} solicitada por {Usuario}",
            filaDietaId,
            usuario);

        return MapearADto(fila);
    }

    public async Task<FilaDietaDto> ConfirmarDietaAsync(Guid filaDietaId, SolicitudDietaDto confirmacion, string usuario, CancellationToken cancellationToken = default)
    {
        var fila = await _context.FilasDietas
            .Include(f => f.TipoDieta)
            .FirstOrDefaultAsync(f => f.Id == filaDietaId, cancellationToken);

        if (fila == null)
        {
            throw new KeyNotFoundException($"FilaDieta con ID {filaDietaId} no encontrada");
        }

        // Validar que esté en estado Solicitada
        if (fila.Estado != EstadoDieta.Solicitada)
        {
            throw new InvalidOperationException($"La dieta debe estar en estado Solicitada para ser confirmada. Estado actual: {fila.Estado}");
        }

        // Actualizar datos si vienen en la confirmación
        if (confirmacion.TipoDietaId.HasValue)
        {
            fila.TipoDietaId = confirmacion.TipoDietaId;
        }
        if (!string.IsNullOrEmpty(confirmacion.Consistencia))
        {
            fila.Consistencia = confirmacion.Consistencia;
        }
        if (!string.IsNullOrEmpty(confirmacion.Observaciones))
        {
            fila.Observaciones = confirmacion.Observaciones;
        }

        // Cambiar estado a Confirmada
        fila.Estado = EstadoDieta.Confirmada;
        fila.ModificadoPor = usuario;
        fila.ModificadoEn = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Dieta {DietaId} confirmada por {Usuario}", filaDietaId, usuario);

        return MapearADto(fila);
    }

    public async Task<bool> ConfirmarDietaDeprecatedAsync(Guid filaDietaId, string usuario, CancellationToken cancellationToken = default)
    {
        var fila = await _context.FilasDietas.FindAsync(new object[] { filaDietaId }, cancellationToken);

        if (fila == null) return false;

        if (string.IsNullOrEmpty(fila.Consistencia))
        {
            throw new InvalidOperationException("La consistencia es obligatoria para confirmar una dieta");
        }

        fila.Estado = EstadoDieta.Confirmada;
        fila.SolicitadoPor = usuario;
        fila.SolicitadoEn = DateTime.UtcNow;
        fila.ModificadoPor = usuario;
        fila.ModificadoEn = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<int> ConfirmarDietasMasivasAsync(ConfirmacionMasivaDto confirmacion, CancellationToken cancellationToken = default)
    {
        var filas = await _context.FilasDietas
            .Where(f => confirmacion.DietasIds.Contains(f.Id))
            .ToListAsync(cancellationToken);

        int confirmadas = 0;

        foreach (var fila in filas)
        {
            // Validar que esté en estado Solicitada
            if (fila.Estado != EstadoDieta.Solicitada)
            {
                _logger.LogWarning("Dieta {DietaId} no está en estado Solicitada (estado actual: {Estado}), no se puede confirmar", 
                    fila.Id, fila.Estado);
                continue;
            }

            if (string.IsNullOrEmpty(fila.Consistencia))
            {
                _logger.LogWarning("Dieta {DietaId} sin consistencia, no se puede confirmar", fila.Id);
                continue;
            }

            fila.Estado = EstadoDieta.Confirmada;
            fila.ModificadoPor = confirmacion.Usuario;
            fila.ModificadoEn = DateTime.UtcNow;

            confirmadas++;
        }

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Confirmadas {Confirmadas} de {Total} dietas por {Usuario}",
            confirmadas, confirmacion.DietasIds.Count, confirmacion.Usuario);

        return confirmadas;
    }

    public async Task<bool> CancelarDietaAsync(Guid filaDietaId, string usuario, string motivo, CancellationToken cancellationToken = default)
    {
        var fila = await _context.FilasDietas.FindAsync(new object[] { filaDietaId }, cancellationToken);

        if (fila == null) return false;

        // Validar que esté en estado Solicitada o Confirmada
        if (fila.Estado != EstadoDieta.Solicitada && fila.Estado != EstadoDieta.Confirmada)
        {
            throw new InvalidOperationException($"La dieta debe estar en estado Solicitada o Confirmada para ser cancelada. Estado actual: {fila.Estado}");
        }

        // TODO: Validar ventana de cancelación (tardia vs normal)

        fila.Estado = EstadoDieta.Cancelada;
        fila.Observaciones = $"{fila.Observaciones}\nCancelada: {motivo}".Trim();
        fila.ModificadoPor = usuario;
        fila.ModificadoEn = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<List<DietaCatalogoDto>> ObtenerCatalogoDietasAsync(CancellationToken cancellationToken = default)
    {
        var hoy = DateTime.UtcNow.Date;

        var catalogo = await _context.DietasCatalogo
            .Include(d => d.HistoricoTarifas.Where(t => t.Activa && t.VigenciaDesde <= hoy && t.VigenciaHasta >= hoy))
            .Where(d => d.Activa && d.FechaInicio <= hoy && (d.FechaFin == null || d.FechaFin >= hoy))
            .ToListAsync(cancellationToken);

        return catalogo.Select(d => new DietaCatalogoDto
        {
            Id = d.Id,
            Codigo = d.Codigo,
            Nombre = d.Nombre,
            Descripcion = d.Descripcion,
            TarifaActual = d.HistoricoTarifas.FirstOrDefault()?.Monto,
            Activa = d.Activa
        }).ToList();
    }

    public async Task<FilaDietaDto> RegistrarNovedadAsync(Guid filaDietaId, NovedadDietaDto novedad, string usuario, CancellationToken cancellationToken = default)
    {
        var fila = await _context.FilasDietas
            .FirstOrDefaultAsync(f => f.Id == filaDietaId, cancellationToken)
            ?? throw new KeyNotFoundException($"Dieta {filaDietaId} no encontrada");

        // Registrar evento de trazabilidad
        var evento = new EventoTrazabilidad
        {
            Id = Guid.NewGuid(),
            FilaDietaId = filaDietaId,
            TipoEvento = novedad.TipoNovedad,
            Descripcion = novedad.Descripcion,
            EstadoAnterior = fila.Estado,
            EstadoNuevo = fila.Estado,
            DatosAdicionales = novedad.Observaciones,
            Usuario = usuario,
            FechaEvento = DateTime.UtcNow
        };

        _context.EventosTrazabilidad.Add(evento);

        // Actualizar observaciones si hay contenido adicional
        if (!string.IsNullOrEmpty(novedad.Observaciones))
        {
            fila.Observaciones = string.IsNullOrEmpty(fila.Observaciones)
                ? novedad.Observaciones
                : $"{fila.Observaciones}\n[{DateTime.UtcNow:yyyy-MM-dd HH:mm}] {novedad.Observaciones}";
        }

        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Novedad registrada en dieta {DietaId} por {Usuario}: {Tipo}", filaDietaId, usuario, novedad.TipoNovedad);

        return MapearADto(fila);
    }

    public async Task<FilaDietaDto> ObtenerDetalleDietaAsync(Guid filaDietaId, CancellationToken cancellationToken = default)
    {
        var fila = await _context.FilasDietas
            .FirstOrDefaultAsync(f => f.Id == filaDietaId, cancellationToken)
            ?? throw new KeyNotFoundException($"Dieta {filaDietaId} no encontrada");

        return MapearADto(fila);
    }

    public async Task<List<EventoTrazabilidadDto>> ObtenerHistorialDietaAsync(Guid filaDietaId, CancellationToken cancellationToken = default)
    {
        var eventos = await _context.EventosTrazabilidad
            .Where(e => e.FilaDietaId == filaDietaId)
            .OrderByDescending(e => e.FechaEvento)
            .ToListAsync(cancellationToken);

        return eventos.Select(e => new EventoTrazabilidadDto
        {
            Id = e.Id,
            TipoEvento = e.TipoEvento,
            Descripcion = e.Descripcion,
            EstadoAnterior = e.EstadoAnterior?.ToString(),
            EstadoNuevo = e.EstadoNuevo.ToString(),
            Usuario = e.Usuario,
            FechaEvento = e.FechaEvento,
            DatosAdicionales = e.DatosAdicionales
        }).ToList();
    }

    public async Task<CensoDietasDto> BuscarDietasAsync(FiltrosDietasDto filtros, CancellationToken cancellationToken = default)
    {
        var query = _context.FilasDietas.AsQueryable();

        // Aplicar filtros
        if (filtros.Fecha.HasValue)
            query = query.Where(f => f.FechaOperativa.Date == filtros.Fecha.Value.Date);

        if (!string.IsNullOrEmpty(filtros.Comida) && Enum.TryParse<TiempoComida>(filtros.Comida, out var comidaEnum))
            query = query.Where(f => f.Comida == comidaEnum);

        if (!string.IsNullOrEmpty(filtros.Servicio))
            query = query.Where(f => f.Servicio == filtros.Servicio);

        if (!string.IsNullOrEmpty(filtros.Pabellon))
            query = query.Where(f => f.Pabellon == filtros.Pabellon);

        if (!string.IsNullOrEmpty(filtros.Estado) && Enum.TryParse<EstadoDieta>(filtros.Estado, out var estadoEnum))
            query = query.Where(f => f.Estado == estadoEnum);

        if (!string.IsNullOrEmpty(filtros.Busqueda))
            query = query.Where(f => f.Paciente.Contains(filtros.Busqueda) || f.Cedula.Contains(filtros.Busqueda));

        if (filtros.SoloPendientes)
            query = query.Where(f => f.Estado == EstadoDieta.Solicitada);

        var filas = await query.ToListAsync(cancellationToken);

        // Aplicar filtro de novedades en memoria después de la consulta
        if (filtros.SoloConNovedades)
        {
            var dietasIds = filas.Select(f => f.Id).ToList();
            var dietasConNovedades = await _context.EventosTrazabilidad
                .Where(e => dietasIds.Contains(e.FilaDietaId))
                .Select(e => e.FilaDietaId)
                .Distinct()
                .ToListAsync(cancellationToken);

            filas = filas.Where(f => dietasConNovedades.Contains(f.Id)).ToList();
        }

        return new CensoDietasDto
        {
            FechaOperativa = filtros.Fecha ?? DateTime.UtcNow.Date,
            Comida = filtros.Comida ?? "Todos",
            TotalPacientes = filas.Count,
            DietasConfirmadas = filas.Count(f => f.Estado == EstadoDieta.Confirmada),
            DietasSolicitadas = filas.Count(f => f.Estado == EstadoDieta.Solicitada),
            DietasPendientes = filas.Count(f => f.Estado == EstadoDieta.Pendiente),
            Filas = filas.Select(MapearADto).ToList()
        };
    }

    private static FilaDietaDto MapearADto(FilaDieta fila)
    {
        return new FilaDietaDto
        {
            Id = fila.Id,
            PacienteId = fila.PacienteId,
            IdIngreso = fila.IdIngreso,
            Cedula = fila.Cedula,
            TipoDocumento = fila.TipoDocumento,
            Paciente = fila.Paciente,
            Edad = fila.Edad,
            Servicio = fila.Servicio,
            Pabellon = fila.Pabellon,
            Habitacion = fila.Habitacion,
            Comida = fila.Comida.ToString(),
            Consistencia = fila.Consistencia,
            TipoDietaId = fila.TipoDietaId,
            DescripcionDieta = fila.DescripcionDieta,
            Aislado = fila.Aislado,
            Aislamiento = fila.Aislamiento,
            ObservacionAislamiento = fila.ObservacionAislamiento,
            Alergico = fila.Alergico,
            Alergias = fila.Alergias,
            Estado = fila.Estado.ToString(),
            Observaciones = fila.Observaciones,
            SolicitadoPor = fila.SolicitadoPor,
            SolicitadoEn = fila.SolicitadoEn,
            CancelacionTardia = fila.CancelacionTardia,
            FechaOperativa = fila.FechaOperativa
        };
    }
}

internal class PacienteHospitalizadoDto
{
    public int IdIngreso { get; set; }
    public string TipoDocumento { get; set; } = string.Empty;
    public string Cedula { get; set; } = string.Empty;
    public string NombreCompleto { get; set; } = string.Empty;
    public string Pabellon { get; set; } = string.Empty;
    public string Cama { get; set; } = string.Empty;
}
