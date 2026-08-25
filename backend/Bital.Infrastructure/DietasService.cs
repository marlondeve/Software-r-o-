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
    private readonly IAuditoriaService _auditoria;
    private readonly IAuditoriaContextoRequest _contextoAuditoria;
    private readonly ILogger<DietasService> _logger;

    public DietasService(
        BitalNegocioDbContext context,
        IAtencionesQueryService atencionesQueryService,
        IOrdenesCocinaService ordenesCocinaService,
        IAuditoriaService auditoria,
        IAuditoriaContextoRequest contextoAuditoria,
        ILogger<DietasService> logger)
    {
        _context = context;
        _atencionesQueryService = atencionesQueryService;
        _ordenesCocinaService = ordenesCocinaService;
        _auditoria = auditoria;
        _contextoAuditoria = contextoAuditoria;
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
                Servicio = DietasReglasNegocio.ResolverServicioClinico(null, p.Pabellon),
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
            var servicio = DietasReglasNegocio.ResolverServicioClinico(paciente.Servicio, paciente.Pabellon);

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
                    Servicio = servicio,
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
            else
            {
                filaExistente.IdIngreso = paciente.IdIngreso;
                filaExistente.Paciente = paciente.NombreCompleto;
                filaExistente.Pabellon = paciente.Pabellon;
                filaExistente.Habitacion = paciente.Cama;
                filaExistente.Servicio = servicio;
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

        var estadoAnterior = fila.Estado;
        AplicarSolicitudClinica(fila, solicitud);
        DietasReglasNegocio.ValidarCamposClinicosPorComida(fila);
        await ValidarTarifaTipoDietaAsync(fila, cancellationToken);
        fila.SolicitadoPor = usuario;
        fila.SolicitadoEn = DateTime.UtcNow;
        fila.ModificadoPor = usuario;
        fila.ModificadoEn = DateTime.UtcNow;

        // Cambiar estado a Solicitada (no Confirmada directamente)
        fila.Estado = EstadoDieta.Solicitada;

        await _context.SaveChangesAsync(cancellationToken);

        Auditar(AuditoriaCatalogo.Modulos.Dietas, AuditoriaCatalogo.Acciones.Solicitar, usuario,
            AuditoriaCatalogo.Entidades.FilaDieta, filaDietaId,
            new { estado = estadoAnterior.ToString() },
            new { estado = fila.Estado.ToString(), fila.Consistencia, fila.TipoDietaId });

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
        DietasReglasNegocio.ValidarCamposClinicosPorComida(fila);
        await ValidarTarifaTipoDietaAsync(fila, cancellationToken);

        fila.Estado = EstadoDieta.Confirmada;
        fila.ModificadoPor = usuario;
        fila.ModificadoEn = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        Auditar(AuditoriaCatalogo.Modulos.Dietas, AuditoriaCatalogo.Acciones.Confirmar, usuario,
            AuditoriaCatalogo.Entidades.FilaDieta, filaDietaId,
            new { estado = EstadoDieta.Solicitada.ToString() },
            new { estado = fila.Estado.ToString(), fila.Consistencia, fila.TipoDietaId });

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

        if (DietasReglasNegocio.RequiereConsistencia(fila.Comida)
            && string.IsNullOrEmpty(fila.Consistencia))
        {
            throw new InvalidOperationException("La consistencia es obligatoria para confirmar una dieta");
        }

        if (!fila.TipoDietaId.HasValue && string.IsNullOrWhiteSpace(fila.DescripcionDieta))
        {
            throw new InvalidOperationException("El tipo de dieta es obligatorio para confirmar una dieta");
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

            if (DietasReglasNegocio.RequiereConsistencia(fila.Comida)
                && string.IsNullOrEmpty(fila.Consistencia))
            {
                _logger.LogWarning("Dieta {DietaId} sin consistencia, no se puede confirmar", fila.Id);
                continue;
            }

            if (!fila.TipoDietaId.HasValue && string.IsNullOrWhiteSpace(fila.DescripcionDieta))
            {
                _logger.LogWarning("Dieta {DietaId} sin tipo de dieta, no se puede confirmar", fila.Id);
                continue;
            }

            fila.Estado = EstadoDieta.Confirmada;
            fila.ModificadoPor = confirmacion.Usuario;
            fila.ModificadoEn = DateTime.UtcNow;
            confirmadas++;
        }

        await _context.SaveChangesAsync(cancellationToken);

        Auditar(AuditoriaCatalogo.Modulos.Dietas, AuditoriaCatalogo.Acciones.ConfirmarMasivo, confirmacion.Usuario,
            AuditoriaCatalogo.Entidades.FilaDieta, null,
            new { total = confirmacion.DietasIds.Count },
            new { confirmadas, ids = confirmacion.DietasIds });

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

        if (!MotivosEtiquetasCatalogo.CancelacionIds.Contains(cancelacion.Motivo.Trim()))
        {
            throw new InvalidOperationException(
                $"Motivo de cancelación no válido: {cancelacion.Motivo}");
        }

        var motivoCompleto = $"[{cancelacion.Motivo}] {cancelacion.Justificacion}".Trim();
        var estadoAnterior = fila.Estado;

        fila.Estado = EstadoDieta.Cancelada;
        fila.CancelacionTardia = esTardia;
        fila.Observaciones = $"{fila.Observaciones}\nCancelada: {motivoCompleto}".Trim();
        fila.ModificadoPor = usuario;
        fila.ModificadoEn = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        Auditar(AuditoriaCatalogo.Modulos.Dietas, AuditoriaCatalogo.Acciones.Cancelar, usuario,
            AuditoriaCatalogo.Entidades.FilaDieta, filaDietaId,
            new { estado = estadoAnterior.ToString() },
            new { estado = fila.Estado.ToString(), cancelacionTardia = esTardia, motivo = cancelacion.Motivo });

        return true;
    }

    public async Task<List<DietaCatalogoDto>> ObtenerCatalogoDietasAsync(CancellationToken cancellationToken = default)
    {
        var hoy = DateTime.UtcNow.Date;

        var catalogo = await _context.DietasCatalogo
            .Include(d => d.HistoricoTarifas)
            .OrderByDescending(d => d.Activa)
            .ThenBy(d => d.Codigo)
            .ToListAsync(cancellationToken);

        return catalogo.Select(d => MapDietaCatalogoDto(d, hoy)).ToList();
    }

    private static DietaCatalogoDto MapDietaCatalogoDto(DietaCatalogo dieta, DateTime hoy)
    {
        var tarifasActivas = dieta.HistoricoTarifas
            .Where(t => t.Activa)
            .OrderByDescending(t => t.Anio)
            .ThenByDescending(t => t.VigenciaDesde)
            .ThenBy(t => t.TiempoComida)
            .ToList();

        var tarifasVigentes = TarifasCatalogoHelper.ConstruirTarifasVigentes(tarifasActivas, hoy);

        var historico = tarifasActivas
            .Select(t => TarifasCatalogoHelper.MapTarifaHistoricoDto(t, hoy, dieta.Usuario))
            .ToList();

        return new DietaCatalogoDto
        {
            Id = dieta.Id,
            Codigo = dieta.Codigo,
            Nombre = dieta.Nombre,
            Descripcion = dieta.Descripcion,
            TarifaActual = tarifasVigentes.Count > 0 ? tarifasVigentes.Values.Min() : null,
            TarifasVigentes = tarifasVigentes,
            Activa = dieta.Activa,
            FechaInicio = dieta.FechaInicio,
            FechaFin = dieta.FechaFin,
            Usuario = dieta.Usuario,
            ModificadoEn = dieta.ModificadoEn ?? dieta.CreadoEn,
            Estado = ResolverEstadoCatalogo(dieta, tarifasActivas, hoy),
            HistoricoTarifas = historico
        };
    }

    private static bool EsTarifaVigente(TarifaHistorico tarifa, DateTime hoy) =>
        TarifasCatalogoHelper.EsTarifaVigente(tarifa, hoy);

    private static string ResolverEstadoCatalogo(
        DietaCatalogo dieta,
        IReadOnlyCollection<TarifaHistorico> tarifasActivas,
        DateTime hoy)
    {
        if (!dieta.Activa)
        {
            return "inactiva";
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

        var montosPorComida = TarifasCatalogoHelper.ResolverMontosPorComida(
            dto.TarifasIniciales,
            dto.TarifaInicial);

        if (montosPorComida.Count > 0)
        {
            var vigenciaDesde = (dto.VigenciaDesde ?? dto.FechaInicio ?? hoy).Date;
            var vigenciaHasta = (dto.VigenciaHasta ?? new DateTime(vigenciaDesde.Year, 12, 31)).Date;

            foreach (var (comida, monto) in montosPorComida)
            {
                _context.TarifasHistorico.Add(new TarifaHistorico
                {
                    Id = Guid.NewGuid(),
                    DietaCatalogoId = dieta.Id,
                    TiempoComida = comida,
                    Anio = vigenciaDesde.Year,
                    Monto = monto,
                    VigenciaDesde = vigenciaDesde,
                    VigenciaHasta = vigenciaHasta,
                    Activa = true,
                    Observaciones = dto.MotivoTarifa,
                    CreadoPor = usuario,
                });
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        Auditar(AuditoriaCatalogo.Modulos.Catalogo, AuditoriaCatalogo.Acciones.Crear, usuario,
            AuditoriaCatalogo.Entidades.DietaCatalogo, dieta.Id, null,
            new { dieta.Codigo, dieta.Nombre, dieta.Activa, tarifasIniciales = montosPorComida.Count });

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

        var antes = new
        {
            dieta.Nombre,
            dieta.Descripcion,
            dieta.FechaInicio,
            dieta.FechaFin,
            dieta.Activa,
        };

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

        if (dto.Activa.HasValue)
        {
            dieta.Activa = dto.Activa.Value;
        }

        dieta.Usuario = usuario;
        dieta.ModificadoPor = usuario;
        dieta.ModificadoEn = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        Auditar(AuditoriaCatalogo.Modulos.Catalogo, AuditoriaCatalogo.Acciones.Actualizar, usuario,
            AuditoriaCatalogo.Entidades.DietaCatalogo, id, antes,
            new
            {
                dieta.Nombre,
                dieta.Descripcion,
                dieta.FechaInicio,
                dieta.FechaFin,
                dieta.Activa,
            });

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

        Auditar(AuditoriaCatalogo.Modulos.Catalogo, AuditoriaCatalogo.Acciones.Desactivar, usuario,
            AuditoriaCatalogo.Entidades.DietaCatalogo, id,
            new { activa = true }, new { activa = false, dieta.Codigo, dieta.Nombre });

        return await ObtenerCatalogoDietaPorIdAsync(id, cancellationToken);
    }

    public async Task<List<TarifaHistoricoDto>> ObtenerTarifasDietaAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var dieta = await ObtenerCatalogoDietaPorIdAsync(id, cancellationToken);
        return dieta.HistoricoTarifas;
    }

    public async Task<List<TarifaHistoricoDto>> RegistrarTarifaDietaAsync(
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

        var montosPorComida = TarifasCatalogoHelper.ResolverMontosPorComida(
            dto.Tarifas,
            dto.Monto > 0 ? dto.Monto : null);

        if (montosPorComida.Count == 0)
        {
            throw new InvalidOperationException("Debe indicar al menos una tarifa por tiempo de comida");
        }

        foreach (var (comida, _) in montosPorComida)
        {
            TarifasCatalogoHelper.CerrarSolapamientos(
                dieta.HistoricoTarifas,
                comida,
                vigenciaDesde,
                vigenciaHasta);

            if (TarifasCatalogoHelper.TieneSolapamiento(
                    dieta.HistoricoTarifas,
                    comida,
                    vigenciaDesde,
                    vigenciaHasta))
            {
                throw new InvalidOperationException(
                    $"La vigencia de la tarifa se solapa con una tarifa existente para {TarifasCatalogoHelper.EtiquetaTiempoComida(comida)}");
            }
        }

        var creadas = new List<TarifaHistorico>();
        foreach (var (comida, monto) in montosPorComida)
        {
            var nueva = new TarifaHistorico
            {
                Id = Guid.NewGuid(),
                DietaCatalogoId = id,
                TiempoComida = comida,
                Anio = vigenciaDesde.Year,
                Monto = monto,
                VigenciaDesde = vigenciaDesde,
                VigenciaHasta = vigenciaHasta,
                Activa = true,
                Observaciones = dto.MotivoCambio,
                CreadoPor = usuario,
            };

            _context.TarifasHistorico.Add(nueva);
            creadas.Add(nueva);
        }

        dieta.ModificadoPor = usuario;
        dieta.ModificadoEn = DateTime.UtcNow;
        dieta.Usuario = usuario;

        await _context.SaveChangesAsync(cancellationToken);

        Auditar(AuditoriaCatalogo.Modulos.Catalogo, AuditoriaCatalogo.Acciones.RegistrarTarifa, usuario,
            AuditoriaCatalogo.Entidades.TarifaDieta, creadas[0].Id, null,
            new
            {
                dietaId = id,
                tarifas = montosPorComida.Select(entry => new
                {
                    comida = TarifasCatalogoHelper.EtiquetaTiempoComida(entry.Comida),
                    entry.Monto,
                }),
                vigenciaDesde,
                vigenciaHasta,
                dto.MotivoCambio,
            });

        var hoy = DateTime.UtcNow.Date;
        return creadas
            .Select(t => TarifasCatalogoHelper.MapTarifaHistoricoDto(t, hoy, usuario))
            .ToList();
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

        if (!DietasReglasNegocio.RequiereConsistencia(fila.Comida))
        {
            fila.Consistencia = null;
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

        DietasReglasNegocio.ValidarCondicionesClinicas(
            fila.Aislado,
            fila.ObservacionAislamiento,
            fila.Alergico,
            fila.Alergias);
    }

    private async Task ValidarTarifaTipoDietaAsync(
        FilaDieta fila,
        CancellationToken cancellationToken)
    {
        if (!fila.TipoDietaId.HasValue)
        {
            return;
        }

        var hoy = DateTime.UtcNow.Date;
        var tarifas = await _context.TarifasHistorico
            .Where(t => t.DietaCatalogoId == fila.TipoDietaId && t.Activa)
            .ToListAsync(cancellationToken);

        DietasReglasNegocio.ValidarTarifaTipoDietaParaComida(fila, tarifas, hoy);
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

        Auditar(AuditoriaCatalogo.Modulos.Dietas, AuditoriaCatalogo.Acciones.Novedad, usuario,
            AuditoriaCatalogo.Entidades.FilaDieta, filaDietaId, null,
            new { novedad.TipoNovedad, novedad.Descripcion, novedad.Observaciones });

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

        if (!string.IsNullOrEmpty(filtros.Pabellon))
            query = query.Where(f => f.Pabellon == filtros.Pabellon);

        if (!string.IsNullOrEmpty(filtros.Estado) && Enum.TryParse<EstadoDieta>(filtros.Estado, out var estadoEnum))
            query = query.Where(f => f.Estado == estadoEnum);

        if (!string.IsNullOrEmpty(filtros.Busqueda))
        {
            var busqueda = filtros.Busqueda;
            query = query.Where(f =>
                f.Paciente.Contains(busqueda) ||
                (f.Cedula != null && f.Cedula.Contains(busqueda)) ||
                f.Habitacion.Contains(busqueda) ||
                f.Pabellon.Contains(busqueda));
        }

        if (filtros.SoloPendientes)
            query = query.Where(f => f.Estado == EstadoDieta.Solicitada);

        var filas = await query.ToListAsync(cancellationToken);

        if (!string.IsNullOrEmpty(filtros.Servicio))
        {
            filas = filas
                .Where(f => ServicioCoincideFiltro(f.Servicio, f.Pabellon, filtros.Servicio))
                .ToList();
        }

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

    private static bool ServicioCoincideFiltro(string? servicio, string pabellon, string filtro)
    {
        if (string.IsNullOrWhiteSpace(filtro))
            return true;

        var resuelto = DietasReglasNegocio.ResolverServicioClinico(servicio, pabellon);
        if (string.Equals(resuelto, filtro, StringComparison.OrdinalIgnoreCase))
            return true;

        var filtroNorm = filtro.Trim().ToUpperInvariant();
        var pabellonNorm = (pabellon ?? string.Empty).ToUpperInvariant();
        var servicioNorm = (servicio ?? string.Empty).ToUpperInvariant();

        if (filtroNorm == "UCI")
            return pabellonNorm.Contains("UCI") || servicioNorm.Contains("UCI") || resuelto == "UCI";

        return pabellonNorm.Contains(filtroNorm)
            || servicioNorm.Contains(filtroNorm)
            || resuelto.ToUpperInvariant().Contains(filtroNorm);
    }

    public async Task<object> SeedListasParaEtiquetasDevAsync(
        DateTime fecha,
        string comida,
        int cantidad,
        string usuario,
        CancellationToken cancellationToken = default)
    {
        if (cantidad < 1 || cantidad > 50)
            throw new ArgumentException("cantidad debe estar entre 1 y 50");

        if (!Enum.TryParse<TiempoComida>(comida, true, out var tiempoComida))
            throw new ArgumentException($"Tiempo de comida inválido: {comida}");

        // Asegura filas Pendiente para hospitalizados reales + seed (vía censo).
        await ObtenerCensoAsync(fecha.Date, tiempoComida.ToString(), cancellationToken);

        var catalogo = await _context.DietasCatalogo
            .Where(d => d.Activa)
            .OrderBy(d => d.Nombre)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new InvalidOperationException("No hay dietas en el catálogo. Siembra FCR primero.");

        var filasSeed = await _context.FilasDietas
            .Where(f =>
                f.FechaOperativa.Date == fecha.Date
                && f.Comida == tiempoComida
                && f.PacienteId.StartsWith(DevHospitalizadosSeed.PrefijoPacienteId))
            .OrderBy(f => f.PacienteId)
            .Take(cantidad)
            .ToListAsync(cancellationToken);

        if (filasSeed.Count < cantidad)
        {
            throw new InvalidOperationException(
                $"Solo hay {filasSeed.Count} pacientes seed en censo. " +
                "Configura DietasCocina:DevSeedHospitalizadosCount >= cantidad y actualiza el censo.");
        }

        var maxNumero = await _context.OrdenesCocina
            .MaxAsync(o => (int?)o.NumeroOrden, cancellationToken) ?? 0;

        var checklistJson = ChecklistOperativoHelper.Serializar(DevHospitalizadosSeed.ChecklistCompleto());
        var ordenIds = new List<Guid>();
        var ahora = DateTime.UtcNow;

        foreach (var fila in filasSeed)
        {
            fila.TipoDietaId = catalogo.Id;
            fila.DescripcionDieta = catalogo.Nombre;
            fila.Consistencia = string.IsNullOrWhiteSpace(fila.Consistencia) ? "Blanda" : fila.Consistencia;
            fila.Observaciones ??= "Seed desarrollo — lista para etiqueta";
            fila.Estado = EstadoDieta.ListaEnvio;
            fila.SolicitadoPor ??= usuario;
            fila.SolicitadoEn ??= ahora;
            fila.ModificadoPor = usuario;
            fila.ModificadoEn = ahora;
            fila.Edad = fila.Edad <= 0 ? 40 + (fila.PacienteId.GetHashCode() & 30) : fila.Edad;

            // Quitar etiquetas previas del seed para poder regenerar desde la UI.
            var etiquetasPrevias = await _context.EtiquetasEnfermeria
                .Where(e => e.FilaDietaId == fila.Id)
                .ToListAsync(cancellationToken);
            if (etiquetasPrevias.Count > 0)
                _context.EtiquetasEnfermeria.RemoveRange(etiquetasPrevias);

            OrdenCocina orden;
            if (fila.OrdenCocinaId is Guid ordenId)
            {
                orden = await _context.OrdenesCocina
                    .Include(o => o.Dietas)
                    .FirstAsync(o => o.Id == ordenId, cancellationToken);
                orden.Estado = "Completada";
                orden.ChecklistJson = checklistJson;
                orden.ModificadoPor = usuario;
                orden.ModificadoEn = ahora;
            }
            else
            {
                maxNumero++;
                orden = new OrdenCocina
                {
                    Id = Guid.NewGuid(),
                    NumeroOrden = maxNumero,
                    Comida = tiempoComida,
                    FechaOperativa = fecha.Date,
                    TotalDietas = 1,
                    GeneradoPor = usuario,
                    GeneradoEn = ahora,
                    Estado = "Completada",
                    CreadoPor = usuario,
                    ChecklistJson = checklistJson,
                    Observaciones = "Seed desarrollo",
                };
                _context.OrdenesCocina.Add(orden);
                fila.OrdenCocinaId = orden.Id;
            }

            ordenIds.Add(orden.Id);
        }

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogWarning(
            "SeedListasParaEtiquetasDev: {Count} dietas en Completada para {Fecha} {Comida}",
            filasSeed.Count, fecha.Date, tiempoComida);

        return new
        {
            fecha = fecha.Date.ToString("yyyy-MM-dd"),
            comida = tiempoComida.ToString(),
            dietasListas = filasSeed.Count,
            ordenIds,
            mensaje = "Órdenes Completada con checklist OK. Ve a Cocina → Generar etiquetas → Impresión.",
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
            Servicio = DietasReglasNegocio.ResolverServicioClinico(fila.Servicio, fila.Pabellon),
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
    public string Servicio { get; set; } = string.Empty;
    public string Pabellon { get; set; } = string.Empty;
    public string Cama { get; set; } = string.Empty;
}
