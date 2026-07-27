using Bital.Application.DTOs.DietasCocina;
using Bital.Application.Interfaces;
using Bital.Domain.Entities.DietasCocina;
using Bital.Domain.Enums;
using Bital.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Bital.Infrastructure.DietasCocina;
using Bital.Shared.Contracts.Services;

namespace Bital.Infrastructure.Services;

/// <summary>
/// Implementación del servicio de Dietas y Cocina
/// </summary>
public class DietasService : IDietasService
{
    private readonly BitalNegocioDbContext _context;
    private readonly IAtencionesQueryService _atencionesQueryService;
    private readonly IOrdenesCocinaService _ordenesCocinaService;
    private readonly ILogger<DietasService> _logger;

    public DietasService(
        BitalNegocioDbContext context,
        IAtencionesQueryService atencionesQueryService,
        IOrdenesCocinaService ordenesCocinaService,
        ILogger<DietasService> logger)
    {
        _context = context;
        _atencionesQueryService = atencionesQueryService;
        _ordenesCocinaService = ordenesCocinaService;
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

        AplicarSolicitudClinica(fila, solicitud);
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

        AplicarSolicitudClinica(fila, confirmacion, parcial: true);

        fila.Estado = EstadoDieta.Confirmada;
        fila.ModificadoPor = usuario;
        fila.ModificadoEn = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        if (fila.OrdenCocinaId == null)
        {
            await _ordenesCocinaService.CrearOrdenAsync(
                new CrearOrdenCocinaDto
                {
                    FechaOperativa = fila.FechaOperativa,
                    Comida = fila.Comida.ToString(),
                    DietasIds = [fila.Id],
                },
                usuario,
                cancellationToken);
        }

        await _context.Entry(fila).ReloadAsync(cancellationToken);
        await _context.Entry(fila).Reference(f => f.TipoDieta).LoadAsync(cancellationToken);

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
            if (fila.Estado != EstadoDieta.Solicitada)
            {
                _logger.LogWarning(
                    "Dieta {DietaId} no está en estado Solicitada (estado actual: {Estado}), no se puede confirmar",
                    fila.Id,
                    fila.Estado);
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

        foreach (var fila in filas.Where(f => f.Estado == EstadoDieta.Confirmada && f.OrdenCocinaId == null))
        {
            try
            {
                await _ordenesCocinaService.CrearOrdenAsync(
                    new CrearOrdenCocinaDto
                    {
                        FechaOperativa = fila.FechaOperativa,
                        Comida = fila.Comida.ToString(),
                        DietasIds = [fila.Id],
                    },
                    confirmacion.Usuario,
                    cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "No se pudo crear orden de cocina para dieta {DietaId}", fila.Id);
            }
        }

        _logger.LogInformation("Confirmadas {Confirmadas} de {Total} dietas por {Usuario}",
            confirmadas, confirmacion.DietasIds.Count, confirmacion.Usuario);

        return confirmadas;
    }

    public async Task<bool> CancelarDietaAsync(
        Guid filaDietaId,
        CancelarDietaDto cancelacion,
        string usuario,
        CancellationToken cancellationToken = default)
    {
        var fila = await _context.FilasDietas
            .FirstOrDefaultAsync(f => f.Id == filaDietaId, cancellationToken);

        if (fila == null) return false;

        var esNormal = DietasReglasNegocio.EsCancelacionNormal(fila.Estado);
        var esTardia = DietasReglasNegocio.EsCancelacionTardia(fila.Estado, cancelacion.RolUsuario);

        if (!esNormal && !esTardia)
        {
            throw new InvalidOperationException(
                $"No se puede cancelar la dieta en estado {fila.Estado}.");
        }

        if (esTardia && !cancelacion.AceptaFacturacion)
        {
            throw new InvalidOperationException(
                "Debe aceptar la responsabilidad de facturación para cancelar una dieta confirmada o en preparación.");
        }

        var motivoCompleto = $"[{cancelacion.Motivo}] {cancelacion.Justificacion}".Trim();

        fila.Estado = EstadoDieta.Cancelada;
        fila.CancelacionTardia = esTardia;
        fila.Observaciones = $"{fila.Observaciones}\nCancelada: {motivoCompleto}".Trim();
        fila.ModificadoPor = usuario;
        fila.ModificadoEn = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<List<DietaCatalogoDto>> ObtenerCatalogoDietasAsync(CancellationToken cancellationToken = default)
    {
        var hoy = DateTime.UtcNow.Date;

        var catalogo = await _context.DietasCatalogo
            .Include(d => d.HistoricoTarifas)
            .Where(d => d.Activa)
            .OrderBy(d => d.Codigo)
            .ToListAsync(cancellationToken);

        return catalogo.Select(d => MapDietaCatalogoDto(d, hoy)).ToList();
    }

    private static DietaCatalogoDto MapDietaCatalogoDto(DietaCatalogo dieta, DateTime hoy)
    {
        var tarifasActivas = dieta.HistoricoTarifas
            .Where(t => t.Activa)
            .OrderByDescending(t => t.Anio)
            .ThenByDescending(t => t.VigenciaDesde)
            .ToList();

        var tarifaVigente = ResolverTarifaVigente(tarifasActivas, hoy);

        var historico = tarifasActivas
            .Select(t => new TarifaHistoricoDto
            {
                Id = t.Id,
                Anio = t.Anio,
                Monto = t.Monto,
                VigenciaDesde = t.VigenciaDesde,
                VigenciaHasta = t.VigenciaHasta,
                Vigente = EsTarifaVigente(t, hoy),
                RegistradoPor = string.IsNullOrWhiteSpace(t.CreadoPor) ? dieta.Usuario : t.CreadoPor,
                MotivoCambio = t.Observaciones,
                CreadoEn = t.CreadoEn
            })
            .ToList();

        return new DietaCatalogoDto
        {
            Id = dieta.Id,
            Codigo = dieta.Codigo,
            Nombre = dieta.Nombre,
            Descripcion = dieta.Descripcion,
            TarifaActual = tarifaVigente?.Monto,
            Activa = dieta.Activa,
            FechaInicio = dieta.FechaInicio,
            FechaFin = dieta.FechaFin,
            Usuario = dieta.Usuario,
            ModificadoEn = dieta.ModificadoEn ?? dieta.CreadoEn,
            Estado = ResolverEstadoCatalogo(dieta, tarifasActivas, hoy),
            HistoricoTarifas = historico
        };
    }

    private static TarifaHistorico? ResolverTarifaVigente(IEnumerable<TarifaHistorico> tarifas, DateTime hoy)
    {
        return tarifas
            .Where(t => EsTarifaVigente(t, hoy))
            .OrderByDescending(t => t.Anio)
            .FirstOrDefault()
            ?? tarifas.OrderByDescending(t => t.Anio).FirstOrDefault();
    }

    private static bool EsTarifaVigente(TarifaHistorico tarifa, DateTime hoy) =>
        tarifa.Activa
        && tarifa.VigenciaDesde.Date <= hoy
        && tarifa.VigenciaHasta.Date >= hoy;

    private static string ResolverEstadoCatalogo(
        DietaCatalogo dieta,
        IReadOnlyCollection<TarifaHistorico> tarifasActivas,
        DateTime hoy)
    {
        if (!dieta.Activa)
        {
            return "vencida";
        }

        if (dieta.FechaInicio.Date > hoy)
        {
            return "programada";
        }

        if (dieta.FechaFin.HasValue && dieta.FechaFin.Value.Date < hoy)
        {
            return "vencida";
        }

        if (tarifasActivas.Any(t => EsTarifaVigente(t, hoy)))
        {
            return "vigente";
        }

        if (tarifasActivas.Any(t => t.VigenciaDesde.Date > hoy))
        {
            return "programada";
        }

        return tarifasActivas.Count > 0 ? "vencida" : "vigente";
    }

    public async Task<DietaCatalogoDto> ObtenerCatalogoDietaPorIdAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var dieta = await _context.DietasCatalogo
            .Include(d => d.HistoricoTarifas)
            .FirstOrDefaultAsync(d => d.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Dieta de catálogo {id} no encontrada");

        return MapDietaCatalogoDto(dieta, DateTime.UtcNow.Date);
    }

    public async Task<DietaCatalogoDto> CrearDietaCatalogoAsync(
        CrearDietaCatalogoDto dto,
        string usuario,
        CancellationToken cancellationToken = default)
    {
        var codigo = dto.Codigo.Trim();
        if (await _context.DietasCatalogo.AnyAsync(d => d.Codigo == codigo, cancellationToken))
        {
            throw new InvalidOperationException($"Ya existe una dieta con código {codigo}");
        }

        var hoy = DateTime.UtcNow.Date;
        var dieta = new DietaCatalogo
        {
            Id = Guid.NewGuid(),
            Codigo = codigo,
            Nombre = dto.Nombre.Trim(),
            Descripcion = dto.Descripcion?.Trim() ?? string.Empty,
            FechaInicio = (dto.FechaInicio ?? hoy).Date,
            FechaFin = dto.FechaFin?.Date,
            Usuario = usuario,
            Activa = dto.Activa,
            CreadoPor = usuario,
        };

        _context.DietasCatalogo.Add(dieta);

        if (dto.TarifaInicial.HasValue && dto.TarifaInicial.Value > 0)
        {
            var vigenciaDesde = (dto.VigenciaDesde ?? dto.FechaInicio ?? hoy).Date;
            var vigenciaHasta = (dto.VigenciaHasta ?? new DateTime(vigenciaDesde.Year, 12, 31)).Date;
            _context.TarifasHistorico.Add(new TarifaHistorico
            {
                Id = Guid.NewGuid(),
                DietaCatalogoId = dieta.Id,
                Anio = vigenciaDesde.Year,
                Monto = dto.TarifaInicial.Value,
                VigenciaDesde = vigenciaDesde,
                VigenciaHasta = vigenciaHasta,
                Activa = true,
                Observaciones = dto.MotivoTarifa,
                CreadoPor = usuario,
            });
        }

        await _context.SaveChangesAsync(cancellationToken);
        return await ObtenerCatalogoDietaPorIdAsync(dieta.Id, cancellationToken);
    }

    public async Task<DietaCatalogoDto> ActualizarDietaCatalogoAsync(
        Guid id,
        ActualizarDietaCatalogoDto dto,
        string usuario,
        CancellationToken cancellationToken = default)
    {
        var dieta = await _context.DietasCatalogo
            .FirstOrDefaultAsync(d => d.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Dieta de catálogo {id} no encontrada");

        if (!string.IsNullOrWhiteSpace(dto.Nombre))
        {
            dieta.Nombre = dto.Nombre.Trim();
        }

        if (dto.Descripcion != null)
        {
            dieta.Descripcion = dto.Descripcion.Trim();
        }

        if (dto.FechaInicio.HasValue)
        {
            dieta.FechaInicio = dto.FechaInicio.Value.Date;
        }

        if (dto.FechaFin.HasValue)
        {
            dieta.FechaFin = dto.FechaFin.Value.Date;
        }

        dieta.Usuario = usuario;
        dieta.ModificadoPor = usuario;
        dieta.ModificadoEn = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return await ObtenerCatalogoDietaPorIdAsync(id, cancellationToken);
    }

    public async Task<DietaCatalogoDto> DesactivarDietaCatalogoAsync(
        Guid id,
        string usuario,
        CancellationToken cancellationToken = default)
    {
        var dieta = await _context.DietasCatalogo
            .FirstOrDefaultAsync(d => d.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Dieta de catálogo {id} no encontrada");

        dieta.Activa = false;
        dieta.Usuario = usuario;
        dieta.ModificadoPor = usuario;
        dieta.ModificadoEn = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return await ObtenerCatalogoDietaPorIdAsync(id, cancellationToken);
    }

    public async Task<List<TarifaHistoricoDto>> ObtenerTarifasDietaAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var dieta = await ObtenerCatalogoDietaPorIdAsync(id, cancellationToken);
        return dieta.HistoricoTarifas;
    }

    public async Task<TarifaHistoricoDto> RegistrarTarifaDietaAsync(
        Guid id,
        NuevaTarifaDto dto,
        string usuario,
        CancellationToken cancellationToken = default)
    {
        var dieta = await _context.DietasCatalogo
            .Include(d => d.HistoricoTarifas)
            .FirstOrDefaultAsync(d => d.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Dieta de catálogo {id} no encontrada");

        var vigenciaDesde = dto.VigenciaDesde.Date;
        var vigenciaHasta = dto.VigenciaHasta.Date;
        if (vigenciaHasta < vigenciaDesde)
        {
            throw new InvalidOperationException("La vigencia hasta debe ser posterior a la vigencia desde");
        }

        var solapa = dieta.HistoricoTarifas.Any(t =>
            t.Activa
            && vigenciaDesde <= t.VigenciaHasta.Date
            && vigenciaHasta >= t.VigenciaDesde.Date);
        if (solapa)
        {
            throw new InvalidOperationException("La vigencia de la tarifa se solapa con una tarifa existente");
        }

        foreach (var tarifa in dieta.HistoricoTarifas.Where(t =>
                     t.Activa
                     && t.VigenciaDesde.Date <= DateTime.UtcNow.Date
                     && t.VigenciaHasta.Date >= DateTime.UtcNow.Date))
        {
            tarifa.Activa = false;
        }

        var nueva = new TarifaHistorico
        {
            Id = Guid.NewGuid(),
            DietaCatalogoId = id,
            Anio = vigenciaDesde.Year,
            Monto = dto.Monto,
            VigenciaDesde = vigenciaDesde,
            VigenciaHasta = vigenciaHasta,
            Activa = true,
            Observaciones = dto.MotivoCambio,
            CreadoPor = usuario,
        };

        _context.TarifasHistorico.Add(nueva);
        dieta.ModificadoPor = usuario;
        dieta.ModificadoEn = DateTime.UtcNow;
        dieta.Usuario = usuario;

        await _context.SaveChangesAsync(cancellationToken);

        var hoy = DateTime.UtcNow.Date;
        return new TarifaHistoricoDto
        {
            Id = nueva.Id,
            Anio = nueva.Anio,
            Monto = nueva.Monto,
            VigenciaDesde = nueva.VigenciaDesde,
            VigenciaHasta = nueva.VigenciaHasta,
            Vigente = EsTarifaVigente(nueva, hoy),
            RegistradoPor = usuario,
            MotivoCambio = nueva.Observaciones,
            CreadoEn = nueva.CreadoEn,
        };
    }

    private static void AplicarSolicitudClinica(
        FilaDieta fila,
        SolicitudDietaDto solicitud,
        bool parcial = false)
    {
        if (!parcial || solicitud.TipoDietaId.HasValue)
        {
            fila.TipoDietaId = solicitud.TipoDietaId;
        }

        if (!parcial || solicitud.Consistencia != null)
        {
            fila.Consistencia = solicitud.Consistencia;
        }

        if (!parcial || solicitud.DescripcionDieta != null)
        {
            fila.DescripcionDieta = solicitud.DescripcionDieta;
        }

        if (!parcial || solicitud.Observaciones != null)
        {
            fila.Observaciones = solicitud.Observaciones;
        }

        if (!parcial || solicitud.Aislado.HasValue)
        {
            fila.Aislado = solicitud.Aislado ?? false;
            if (fila.Aislado)
            {
                fila.Aislamiento = solicitud.Aislamiento ?? fila.Aislamiento;
                fila.ObservacionAislamiento = solicitud.ObservacionAislamiento ?? fila.ObservacionAislamiento;
            }
            else
            {
                fila.Aislamiento = "Ninguno";
                fila.ObservacionAislamiento = null;
            }
        }

        if (!parcial || solicitud.Alergico.HasValue)
        {
            fila.Alergico = solicitud.Alergico ?? false;
            fila.Alergias = fila.Alergico ? (solicitud.Alergias ?? fila.Alergias ?? string.Empty) : string.Empty;
        }
    }

    public async Task<FilaDietaDto> RegistrarNovedadAsync(Guid filaDietaId, NovedadDietaDto novedad, string usuario, CancellationToken cancellationToken = default)
    {
        var fila = await _context.FilasDietas
            .FirstOrDefaultAsync(f => f.Id == filaDietaId, cancellationToken)
            ?? throw new KeyNotFoundException($"Dieta {filaDietaId} no encontrada");

        if (!DietasReglasNegocio.PermiteRegistrarNovedad(fila.Estado))
        {
            throw new InvalidOperationException(
                $"No se puede registrar novedad en estado {fila.Estado}.");
        }

        var configTiempo = await _context.TiemposComida
            .FirstOrDefaultAsync(t => t.Comida == fila.Comida, cancellationToken);

        if (!DietasReglasNegocio.VentanaNovedadesAbierta(configTiempo, DateTime.Now))
        {
            throw new InvalidOperationException(
                "La ventana de novedades está cerrada según los parámetros operativos.");
        }

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
            .Include(f => f.TipoDieta)
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
        {
            var busqueda = filtros.Busqueda;
            query = query.Where(f =>
                f.Paciente.Contains(busqueda) ||
                (f.Cedula != null && f.Cedula.Contains(busqueda)));
        }

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
            DescripcionDieta = fila.DescripcionDieta ?? fila.TipoDieta?.Nombre,
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
            OrdenCocinaId = fila.OrdenCocinaId,
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
