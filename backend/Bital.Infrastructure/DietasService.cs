using Bital.Application.DTOs.DietasCocina;
using Bital.Application.Interfaces;
using Bital.Domain.Entities.DietasCocina;
using Bital.Domain.Enums;
using Bital.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Bital.Infrastructure.DietasCocina;
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
    private readonly IOrdenesCocinaService _ordenesCocinaService;
    private readonly IAuditoriaService _auditoria;
    private readonly IAuditoriaContextoRequest _contextoAuditoria;
    private readonly ILogger<DietasService> _logger;

    /// <summary>Autor de los cambios automáticos (censo, egreso, reingreso).</summary>
    private const string UsuarioSistema = "Sistema";

    /// <summary>Coincide con nvarchar(100) de FilasDietas.SolicitadoPor.</summary>
    private const int MaxSolicitadoPor = 100;

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
        // TMPFAC u otras uniones pueden repetir el mismo ingreso: una fila por persona.
        var censoPacientes = DeduplicarCensoPacientes(
            (await _atencionesQueryService.GetAtencionesHospitalariasAsync(cancellationToken))
                .Select(p => new PacienteHospitalizadoDto
                {
                    IdIngreso = p.IdIngreso,
                    Cedula = p.Cedula,
                    TipoDocumento = p.TipoDocumento,
                    NombreCompleto = p.NombreCompleto,
                    Servicio = DietasReglasNegocio.ResolverServicioClinico(null, p.Pabellon),
                    Pabellon = p.Pabellon,
                    Cama = p.Cama
                }));

        if (censoPacientes.Count == 0)
        {
            // Censo vacío suele ser indisponibilidad del HIS, no un alta masiva:
            // no se cancelan dietas para no perder el turno completo.
            _logger.LogWarning(
                "Censo HIS vacío para {Fecha} {Comida}: se omite la cancelación por egreso",
                fecha, comida);

            return new CensoDietasDto
            {
                FechaOperativa = fecha,
                Comida = comida
            };
        }

        // 2. Obtener filas de dietas existentes en Bital para esa fecha y comida
        var configTiempo = await _context.TiemposComida
            .FirstOrDefaultAsync(t => t.Comida == tiempoComida, cancellationToken);

        var ventanaAbierta = DietasReglasNegocio.VentanaNovedadesAbiertaParaFecha(
            configTiempo, fecha.Date, HorarioOperativoHelper.AhoraColombia());

        var filasExistentes = await _context.FilasDietas
            .Include(f => f.TipoDieta)
            .Where(f => f.FechaOperativa.Date == fecha.Date && f.Comida == tiempoComida)
            .ToListAsync(cancellationToken);

        await CorregirCancelacionesEgresoIndebidasAsync(
            filasExistentes,
            tiempoComida,
            fecha.Date,
            configTiempo,
            cancellationToken);

        // Flag sostenida sobre Guardado/Solicitada es inválido (nunca hubo cocina).
        LimpiarSostenidasSinCocinaIndevidas(filasExistentes);

        var resultado = new CensoDietasDto
        {
            FechaOperativa = fecha,
            Comida = comida,
            TotalPacientes = censoPacientes.Count
        };

        // 3. Fusionar datos: crear fila si no existe
        var contextoReingreso = await CargarContextoReingresoAsync(filasExistentes, cancellationToken);
        var filasRespuesta = new List<FilaDieta>();
        var filasSuperadas = new HashSet<Guid>();
        // Una fila pertenece a un solo paciente del censo: evita repetirla en la respuesta
        // cuando el empareje flexible por documento alcanza a más de un ingreso.
        var filasAsignadas = new HashSet<Guid>();

        foreach (var paciente in censoPacientes)
        {
            var pacienteId = ClavePacienteHis(paciente.TipoDocumento, paciente.Cedula);
            var candidatas = filasExistentes
                .Where(f => !filasSuperadas.Contains(f.Id)
                            && !filasAsignadas.Contains(f.Id)
                            && MismaIdentidadPaciente(f, pacienteId))
                .ToList();

            var filaExistente = ElegirFilaParaPacienteCenso(candidatas);
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
                    CreadoPor = UsuarioSistema
                };

                _context.FilasDietas.Add(filaExistente);
                filasExistentes.Add(filaExistente);
            }
            else
            {
                filaExistente.PacienteId = pacienteId;
                filaExistente.IdIngreso = paciente.IdIngreso;
                filaExistente.Cedula = paciente.Cedula;
                filaExistente.TipoDocumento = paciente.TipoDocumento;
                filaExistente.Paciente = paciente.NombreCompleto;
                filaExistente.Pabellon = paciente.Pabellon;
                filaExistente.Habitacion = paciente.Cama;
                filaExistente.Servicio = servicio;

                // Cancelada por el sistema (actual o legado) y el paciente sigue / volvió en censo.
                if (EsCandidataReingreso(filaExistente))
                {
                    ReactivarDietaPorReingreso(filaExistente, contextoReingreso, ventanaAbierta);
                }
                else
                {
                    CorregirReingresoFueraDeVentana(filaExistente, ventanaAbierta);
                }

                // Duplicados del mismo paciente/comida: solo una fila operativa en el censo.
                foreach (var otra in candidatas.Where(f => f.Id != filaExistente.Id))
                {
                    filasSuperadas.Add(otra.Id);
                }
            }

            filasAsignadas.Add(filaExistente.Id);
            filasRespuesta.Add(filaExistente);
        }

        // 4. Cancelar solo si INGRESOS.IngInSlC = 'S' (no por ausencia en el snapshot de censo)
        var pacienteIdsEnCenso = censoPacientes
            .Select(p => ClavePacienteHis(p.TipoDocumento, p.Cedula))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        await CancelarDietasPorEgresoAsync(
            fecha.Date,
            tiempoComida,
            pacienteIdsEnCenso,
            filasExistentes,
            cancellationToken);

        // 5. Conservar en el turno las filas que siguen vigentes aunque no vinieran en este snapshot
        var idsEnResultado = filasRespuesta.Select(f => f.Id).ToHashSet();
        foreach (var fila in filasExistentes)
        {
            if (filasSuperadas.Contains(fila.Id)) continue;
            CorregirReingresoFueraDeVentana(fila, ventanaAbierta);
            if (idsEnResultado.Add(fila.Id))
                filasRespuesta.Add(fila);
        }

        // Una fila por paciente y comida: las legadas que no emparejaron con el
        // censo no deben volver a la respuesta como duplicado del mismo paciente.
        foreach (var fila in DeduplicarFilasPorPaciente(filasRespuesta))
        {
            resultado.Filas.Add(MapearADto(fila));
        }

        await ResolverNombresSolicitantesAsync(resultado.Filas, cancellationToken);

        // 6. Guardar nuevas filas y cancelaciones por salida clínica
        await _context.SaveChangesAsync(cancellationToken);

        // 7. Estadísticas del turno: las canceladas viajan como historial y no cuentan
        var cancelada = EstadoDieta.Cancelada.ToString();
        resultado.DietasSolicitadas = resultado.Filas
            .Count(f => f.Estado != "Pendiente" && f.Estado != cancelada);
        resultado.DietasPendientes = resultado.Filas.Count(f => f.Estado == "Pendiente");
        resultado.DietasConfirmadas = resultado.Filas.Count(f => f.Estado == "Confirmada");

        return resultado;
    }

    /// <summary>
    /// Cancela dietas solo si INGRESOS.IngInSlC = 'S' y el estado aún permite
    /// cancelar (desde EnRuta la bandeja se cierra por devolución).
    /// Faltar en el snapshot de censo (pabellón, TMPFAC, etc.) no es egreso.
    /// Dentro del límite se cancelan Pendiente y todo lo solicitado (evitar desperdicio).
    /// Pasado el límite: Guardado/Solicitada se cancelan; Confirmada+ se sostienen.
    /// Lista para despacho se sostiene siempre (ya preparada).
    /// Corrige sostenidas indebidas sobre Guardado/Solicitada.
    /// </summary>
    private async Task CancelarDietasPorEgresoAsync(
        DateTime fechaOperativa,
        TiempoComida tiempoComida,
        HashSet<string> pacienteIdsEnCenso,
        List<FilaDieta> filasExistentes,
        CancellationToken cancellationToken)
    {
        var configTiempo = await _context.TiemposComida
            .FirstOrDefaultAsync(t => t.Comida == tiempoComida, cancellationToken);

        var ventanaAbierta = DietasReglasNegocio.VentanaNovedadesAbiertaParaFecha(
            configTiempo, fechaOperativa, HorarioOperativoHelper.AhoraColombia());

        var candidatos = filasExistentes
            .Where(f =>
            {
                if (EstaEnCensoHis(f, pacienteIdsEnCenso)) return false;

                var cancelarOSostener =
                    DietasReglasNegocio.DebeCancelarPorEgreso(f.Estado, ventanaAbierta)
                    || DietasReglasNegocio.DebeSostenerPorEgreso(f.Estado, ventanaAbierta);

                // Caso Rufiela: sostenida en Guardado/Solicitada sin cocina → reevaluar.
                var sostenidaIndevida = f.SalidaClinicaSostenida
                    && DietasReglasNegocio.SostenidaSinCocinaEsIndevida(f.Estado);

                if (sostenidaIndevida) return cancelarOSostener;
                return !f.SalidaClinicaSostenida && cancelarOSostener;
            })
            .ToList();

        if (candidatos.Count == 0) return;

        SalidaClinicaHisLookup salida;
        try
        {
            salida = await _atencionesQueryService.ObtenerPacientesConSalidaClinicaAsync(
                candidatos.Select(f => new IdentidadIngresoHis
                {
                    TipoDocumento = f.TipoDocumento ?? string.Empty,
                    Cedula = f.Cedula ?? string.Empty,
                    IdIngreso = f.IdIngreso,
                }),
                cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "No se consultó IngInSlC para {Fecha} {Comida}: se omite la cancelación automática",
                fechaOperativa,
                tiempoComida);
            return;
        }

        var egresadas = candidatos
            .Where(f => salida.Coincide(f.IdIngreso, f.TipoDocumento, f.Cedula, f.PacienteId))
            .ToList();

        if (egresadas.Count == 0)
        {
            _logger.LogInformation(
                "Ninguna dieta se cancela por salida clínica (IngInSlC=S) en {Fecha} {Comida}; {Candidatos} ausentes del snapshot se conservan",
                fechaOperativa,
                tiempoComida,
                candidatos.Count);
            return;
        }

        var paraCancelar = egresadas
            .Where(f => DietasReglasNegocio.DebeCancelarPorEgreso(f.Estado, ventanaAbierta))
            .ToList();

        var paraSostener = egresadas
            .Where(f => DietasReglasNegocio.DebeSostenerPorEgreso(f.Estado, ventanaAbierta))
            .ToList();

        _logger.LogInformation(
            "Salida clínica {Fecha:d} {Comida}: ventana={VentanaAbierta}, egresadas={Egresadas}, cancelar={Cancelar}, sostener={Sostener}",
            fechaOperativa,
            tiempoComida,
            ventanaAbierta,
            egresadas.Count,
            paraCancelar.Count,
            paraSostener.Count);

        var ordenIds = paraCancelar
            .Where(f => f.OrdenCocinaId.HasValue)
            .Select(f => f.OrdenCocinaId!.Value)
            .Distinct()
            .ToList();

        var ordenes = ordenIds.Count == 0
            ? new List<OrdenCocina>()
            : await _context.OrdenesCocina
                .Include(o => o.Dietas)
                .Where(o => ordenIds.Contains(o.Id))
                .ToListAsync(cancellationToken);

        var ahora = DateTime.UtcNow;
        const string motivoSalida = DietasReglasNegocio.MotivoCancelacionSalidaClinica;
        const string motivoSostenida = DietasReglasNegocio.MotivoSalidaClinicaSostenida;

        foreach (var fila in paraSostener)
        {
            fila.SalidaClinicaSostenida = true;
            fila.Observaciones = string.IsNullOrWhiteSpace(fila.Observaciones)
                ? motivoSostenida
                : $"{fila.Observaciones}\n{motivoSostenida}";
            fila.ModificadoPor = UsuarioSistema;
            fila.ModificadoEn = ahora;

            _context.EventosTrazabilidad.Add(new EventoTrazabilidad
            {
                Id = Guid.NewGuid(),
                FilaDietaId = fila.Id,
                TipoEvento = DietasReglasNegocio.TipoEventoSalidaClinicaSostenida,
                Descripcion = motivoSostenida,
                EstadoAnterior = fila.Estado,
                EstadoNuevo = fila.Estado,
                Usuario = UsuarioSistema,
                FechaEvento = ahora,
                DatosAdicionales = $"PacienteId: {fila.PacienteId}; IdIngreso: {fila.IdIngreso}"
            });
        }

        foreach (var fila in paraCancelar)
        {
            var estadoAnterior = fila.Estado;
            fila.Estado = EstadoDieta.Cancelada;
            fila.SalidaClinicaSostenida = false;
            fila.CancelacionTardia = false;
            fila.Observaciones = string.IsNullOrWhiteSpace(fila.Observaciones)
                ? motivoSalida
                : $"{fila.Observaciones}\n{motivoSalida}";
            fila.ModificadoPor = UsuarioSistema;
            fila.ModificadoEn = ahora;

            _context.EventosTrazabilidad.Add(new EventoTrazabilidad
            {
                Id = Guid.NewGuid(),
                FilaDietaId = fila.Id,
                TipoEvento = DietasReglasNegocio.TipoEventoCancelacionPorEgreso,
                Descripcion = "Paciente con salida clínica",
                EstadoAnterior = estadoAnterior,
                EstadoNuevo = EstadoDieta.Cancelada,
                Usuario = UsuarioSistema,
                FechaEvento = ahora,
                DatosAdicionales = $"PacienteId: {fila.PacienteId}; IdIngreso: {fila.IdIngreso}"
            });
        }

        // Una orden puede agrupar varios pacientes: solo se cancela si ninguna
        // de sus dietas sigue vigente. Las completadas se conservan para conciliar.
        foreach (var orden in ordenes)
        {
            if (string.Equals(orden.Estado, "Completada", StringComparison.OrdinalIgnoreCase)
                || string.Equals(orden.Estado, "Cancelada", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (orden.Dietas.Any(d => d.Estado != EstadoDieta.Cancelada)) continue;

            orden.Estado = "Cancelada";
            orden.Observaciones = string.IsNullOrWhiteSpace(orden.Observaciones)
                ? motivoSalida
                : $"{orden.Observaciones}\n[{ahora:yyyy-MM-dd HH:mm}] {motivoSalida}";
        }

        _logger.LogInformation(
            "Salida clínica (IngInSlC=S) en censo {Fecha} {Comida}: {Canceladas} canceladas, "
            + "{Sostenidas} sostenidas por límite de novedades cerrado",
            fechaOperativa, tiempoComida, paraCancelar.Count, paraSostener.Count);
    }

    /// <summary>
    /// Datos para revisar cancelaciones automáticas al sincronizar el censo.
    /// </summary>
    private sealed record ContextoReingreso(
        Dictionary<Guid, EstadoDieta> EstadoAlCancelar,
        HashSet<Guid> OrdenesReutilizables);

    /// <summary>
    /// Cancelada por el sistema (salida clínica u otra automática, actual o legada).
    /// Una cancelación manual deja el usuario real en ModificadoPor y nunca se revierte:
    /// el texto solo decide en filas legadas que quedaron sin autor, porque las
    /// observaciones conservan el histórico de la salida clínica anterior.
    /// </summary>
    private static bool EsCandidataReingreso(FilaDieta fila)
    {
        if (fila.Estado != EstadoDieta.Cancelada) return false;

        if (string.Equals(fila.ModificadoPor, UsuarioSistema, StringComparison.OrdinalIgnoreCase))
            return true;

        return string.IsNullOrWhiteSpace(fila.ModificadoPor)
               && DietasReglasNegocio.EsObservacionSalidaClinica(fila.Observaciones, fila.Estado);
    }

    /// <summary>
    /// Prefiere la fila operativa vigente (no cancelada, más avanzada / reciente).
    /// </summary>
    /// <summary>
    /// Una entrada por paciente: evita que un join multiplicador del HIS (por ejemplo
    /// varias camas en TMPFAC) infle TotalPacientes y genere filas duplicadas.
    /// </summary>
    private static List<PacienteHospitalizadoDto> DeduplicarCensoPacientes(
        IEnumerable<PacienteHospitalizadoDto> pacientes)
    {
        var resultado = new List<PacienteHospitalizadoDto>();
        var vistos = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var paciente in pacientes)
        {
            var clave = ClavePacienteHis(paciente.TipoDocumento, paciente.Cedula);
            if (string.IsNullOrWhiteSpace(clave) || clave == "-")
            {
                // Sin documento no hay identidad: se separa por nombre y ubicación,
                // nunca por IdIngreso (consecutivo por paciente, se repite).
                clave = $"NOM-{paciente.NombreCompleto?.Trim()}|{paciente.Pabellon}|{paciente.Cama}";
                if (clave == "NOM-||") continue;
            }

            if (!vistos.Add(clave)) continue;
            resultado.Add(paciente);
        }

        return resultado;
    }

    private static FilaDieta? ElegirFilaParaPacienteCenso(List<FilaDieta> candidatas)
    {
        if (candidatas.Count == 0) return null;

        return candidatas
            .OrderByDescending(f => f.Estado != EstadoDieta.Cancelada)
            .ThenByDescending(f => RankEstadoOperativo(f.Estado))
            .ThenByDescending(f => f.ModificadoEn ?? f.CreadoEn)
            .First();
    }

    /// <summary>
    /// Misma persona entre dos filas ya guardadas (cédula o clave legada), sin depender
    /// del formato con que se guardó PacienteId. No se compara <c>IdIngreso</c> suelto:
    /// en el HIS es un consecutivo por paciente y se repite entre personas distintas.
    /// </summary>
    private static bool MismaIdentidadEntreFilas(FilaDieta a, FilaDieta b)
    {
        var cedulaA = NormalizarDocumento(a.Cedula);
        if (string.IsNullOrEmpty(cedulaA))
            cedulaA = ExtraerCedulaDeClave(a.PacienteId);

        var cedulaB = NormalizarDocumento(b.Cedula);
        if (string.IsNullOrEmpty(cedulaB))
            cedulaB = ExtraerCedulaDeClave(b.PacienteId);

        if (cedulaA.Length >= LongitudMinimaDocumento && cedulaA == cedulaB)
            return true;

        return !string.IsNullOrWhiteSpace(a.PacienteId)
            && a.PacienteId.Equals(b.PacienteId, StringComparison.OrdinalIgnoreCase);
    }

    private static List<FilaDieta> DeduplicarFilasPorPaciente(List<FilaDieta> filas)
    {
        var resultado = new List<FilaDieta>();

        foreach (var fila in filas)
        {
            var indice = resultado.FindIndex(item =>
                item.Comida == fila.Comida && MismaIdentidadEntreFilas(item, fila));

            if (indice < 0)
            {
                resultado.Add(fila);
                continue;
            }

            resultado[indice] = ElegirFilaParaPacienteCenso(
                new List<FilaDieta> { resultado[indice], fila })!;
        }

        return resultado;
    }

    private static int RankEstadoOperativo(EstadoDieta estado) =>
        estado switch
        {
            EstadoDieta.Pendiente => 0,
            EstadoDieta.Guardado or EstadoDieta.Solicitada => 1,
            EstadoDieta.Confirmada => 2,
            EstadoDieta.EnPreparacion => 3,
            EstadoDieta.ListaEnvio => 4,
            EstadoDieta.EnRuta => 5,
            EstadoDieta.Entregada or EstadoDieta.Consumida => 6,
            EstadoDieta.Devuelta or EstadoDieta.NoConsumida => 5,
            EstadoDieta.Cancelada => -1,
            _ => 0,
        };

    /// <summary>
    /// Corrige dietas canceladas por egreso que debieron sostenerse (fuera del límite
    /// de novedades): restaura el estado previo y marca salida clínica sostenida.
    /// </summary>
    private async Task CorregirCancelacionesEgresoIndebidasAsync(
        List<FilaDieta> filas,
        TiempoComida comida,
        DateTime fechaOperativa,
        TiempoComidaConfig? configTiempo,
        CancellationToken cancellationToken)
    {
        var canceladasEgreso = filas
            .Where(f => f.Estado == EstadoDieta.Cancelada
                        && DietasReglasNegocio.EsObservacionSalidaClinica(f.Observaciones, f.Estado))
            .ToList();

        if (canceladasEgreso.Count == 0) return;

        var ids = canceladasEgreso.Select(f => f.Id).ToList();
        var eventos = await _context.EventosTrazabilidad
            .AsNoTracking()
            .Where(e => ids.Contains(e.FilaDietaId)
                        && e.TipoEvento == DietasReglasNegocio.TipoEventoCancelacionPorEgreso
                        && e.EstadoAnterior != null)
            .OrderByDescending(e => e.FechaEvento)
            .ToListAsync(cancellationToken);

        var ultimoEventoPorFila = eventos
            .GroupBy(e => e.FilaDietaId)
            .ToDictionary(g => g.Key, g => g.First());

        foreach (var fila in canceladasEgreso)
        {
            if (!ultimoEventoPorFila.TryGetValue(fila.Id, out var evento)) continue;

            var estadoAlEgreso = evento.EstadoAnterior!.Value;
            if (!DietasReglasNegocio.EsDietaSolicitada(estadoAlEgreso)) continue;

            var momentoColombia = HorarioOperativoHelper.AHoraColombia(evento.FechaEvento);
            if (!DietasReglasNegocio.EgresoDebióSostenerse(
                    estadoAlEgreso,
                    configTiempo,
                    fechaOperativa,
                    momentoColombia))
            {
                continue;
            }

            AplicarSostenimientoTrasCorreccion(fila, estadoAlEgreso);
        }
    }

    /// <summary>
    /// Quita el flag de sostenida en Guardado/Solicitada (nunca debió marcarse).
    /// El egreso posterior las cancelará en <see cref="CancelarDietasPorEgresoAsync"/>.
    /// </summary>
    private void LimpiarSostenidasSinCocinaIndevidas(List<FilaDieta> filas)
    {
        var ahora = DateTime.UtcNow;
        const string motivoSostenida = DietasReglasNegocio.MotivoSalidaClinicaSostenida;

        foreach (var fila in filas)
        {
            if (!fila.SalidaClinicaSostenida) continue;
            if (!DietasReglasNegocio.SostenidaSinCocinaEsIndevida(fila.Estado)) continue;

            fila.SalidaClinicaSostenida = false;
            if (!string.IsNullOrWhiteSpace(fila.Observaciones)
                && fila.Observaciones.Contains(motivoSostenida, StringComparison.OrdinalIgnoreCase))
            {
                fila.Observaciones = string.Join(
                    '\n',
                    fila.Observaciones
                        .Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                        .Where(linea =>
                            !linea.Contains(motivoSostenida, StringComparison.OrdinalIgnoreCase)
                            && !linea.Contains("fuera del límite de novedades", StringComparison.OrdinalIgnoreCase)
                            && !linea.Contains("fuera del limite de novedades", StringComparison.OrdinalIgnoreCase)
                            && !linea.Contains("asume la clínica", StringComparison.OrdinalIgnoreCase)
                            && !linea.Contains("asume la clinica", StringComparison.OrdinalIgnoreCase)));
                if (string.IsNullOrWhiteSpace(fila.Observaciones))
                    fila.Observaciones = null;
            }

            fila.ModificadoPor = UsuarioSistema;
            fila.ModificadoEn = ahora;

            _context.EventosTrazabilidad.Add(new EventoTrazabilidad
            {
                Id = Guid.NewGuid(),
                FilaDietaId = fila.Id,
                TipoEvento = "dieta_sostenida_indebida_limpiada",
                Descripcion =
                    "Corrección: sostenida indebida en Guardado/Solicitada (sin cocina); se limpia el flag",
                EstadoAnterior = fila.Estado,
                EstadoNuevo = fila.Estado,
                Usuario = UsuarioSistema,
                FechaEvento = ahora,
                DatosAdicionales = $"PacienteId: {fila.PacienteId}; IdIngreso: {fila.IdIngreso}",
            });

            _logger.LogWarning(
                "Dieta {FilaId} corregida: sostenida indebida en {Estado} → se limpia flag",
                fila.Id,
                fila.Estado);
        }
    }

    private void AplicarSostenimientoTrasCorreccion(FilaDieta fila, EstadoDieta estadoRestaurar)
    {
        var estadoAnterior = fila.Estado;
        var ahora = DateTime.UtcNow;
        const string motivoSostenida = DietasReglasNegocio.MotivoSalidaClinicaSostenida;

        fila.Estado = estadoRestaurar;
        fila.SalidaClinicaSostenida = true;
        fila.CancelacionTardia = false;
        if (!string.IsNullOrWhiteSpace(fila.Observaciones)
            && !fila.Observaciones.Contains(motivoSostenida, StringComparison.OrdinalIgnoreCase))
        {
            fila.Observaciones = $"{fila.Observaciones}\n{motivoSostenida}";
        }
        else if (string.IsNullOrWhiteSpace(fila.Observaciones))
        {
            fila.Observaciones = motivoSostenida;
        }

        fila.ModificadoPor = UsuarioSistema;
        fila.ModificadoEn = ahora;

        _context.EventosTrazabilidad.Add(new EventoTrazabilidad
        {
            Id = Guid.NewGuid(),
            FilaDietaId = fila.Id,
            TipoEvento = DietasReglasNegocio.TipoEventoSalidaClinicaSostenida,
            Descripcion = "Corrección: egreso fuera del límite debió sostener la dieta",
            EstadoAnterior = estadoAnterior,
            EstadoNuevo = estadoRestaurar,
            Usuario = UsuarioSistema,
            FechaEvento = ahora,
            DatosAdicionales =
                $"PacienteId: {fila.PacienteId}; IdIngreso: {fila.IdIngreso}; EstadoRestaurado: {estadoRestaurar}"
        });

        _logger.LogWarning(
            "Dieta {FilaId} corregida: cancelación por egreso fuera de ventana → sostenida ({Estado})",
            fila.Id,
            estadoRestaurar);
    }

    private async Task<ContextoReingreso> CargarContextoReingresoAsync(
        List<FilaDieta> filasExistentes,
        CancellationToken cancellationToken)
    {
        var reactivables = filasExistentes.Where(EsCandidataReingreso).ToList();

        if (reactivables.Count == 0)
            return new ContextoReingreso([], []);

        var filaIds = reactivables.Select(f => f.Id).ToList();

        var eventosCancelacion = await _context.EventosTrazabilidad
            .AsNoTracking()
            .Where(e => filaIds.Contains(e.FilaDietaId)
                        && e.EstadoAnterior != null
                        && (e.TipoEvento == DietasReglasNegocio.TipoEventoCancelacionPorEgreso
                            || e.TipoEvento == "dieta_cancelada"
                            || e.TipoEvento.Contains("egreso")))
            .Select(e => new { e.FilaDietaId, e.TipoEvento, e.EstadoAnterior, e.FechaEvento })
            .ToListAsync(cancellationToken);

        var estadoAlCancelar = eventosCancelacion
            .GroupBy(e => e.FilaDietaId)
            .ToDictionary(
                g => g.Key,
                g => g
                    .OrderByDescending(e =>
                        e.TipoEvento == DietasReglasNegocio.TipoEventoCancelacionPorEgreso)
                    .ThenByDescending(e => e.FechaEvento)
                    .First().EstadoAnterior!.Value);

        var ordenIds = reactivables
            .Where(f => f.OrdenCocinaId.HasValue)
            .Select(f => f.OrdenCocinaId!.Value)
            .Distinct()
            .ToList();

        // Solo se conserva el vínculo si la orden sigue viva (no cancelada ni completada).
        var ordenesReutilizables = ordenIds.Count == 0
            ? []
            : (await _context.OrdenesCocina
                .AsNoTracking()
                .Where(o => ordenIds.Contains(o.Id))
                .Select(o => new { o.Id, o.Estado })
                .ToListAsync(cancellationToken))
            .Where(o => !string.Equals(o.Estado, "Cancelada", StringComparison.OrdinalIgnoreCase)
                        && !string.Equals(o.Estado, "Completada", StringComparison.OrdinalIgnoreCase))
            .Select(o => o.Id)
            .ToHashSet();

        return new ContextoReingreso(estadoAlCancelar, ordenesReutilizables);
    }

    /// <summary>
    /// Paciente en censo con dieta cancelada por el sistema: se corrige el estado
    /// (reingreso real o cancelación automática previa que ya no aplica).
    /// </summary>
    private void ReactivarDietaPorReingreso(
        FilaDieta fila,
        ContextoReingreso contexto,
        bool ventanaNovedadesAbierta)
    {
        var estadoAlCancelar = contexto.EstadoAlCancelar.TryGetValue(fila.Id, out var previo)
            ? previo
            : EstadoDieta.Pendiente;

        var estadoAnterior = fila.Estado;
        var nuevoEstado = DietasReglasNegocio.EstadoTrasReingresoTrasSalidaClinica(
            estadoAlCancelar,
            ventanaNovedadesAbierta);
        var ahora = DateTime.UtcNow;
        var motivo = ventanaNovedadesAbierta
            ? DietasReglasNegocio.MotivoReactivacionReingreso
            : DietasReglasNegocio.MotivoReactivacionReingresoFueraVentana;

        fila.Estado = nuevoEstado;
        fila.SalidaClinicaSostenida = false;
        // Se libera el cobro por cancelación tardía: la dieta vuelve al flujo normal.
        fila.CancelacionTardia = false;
        if (!ventanaNovedadesAbierta || nuevoEstado == EstadoDieta.Pendiente)
        {
            fila.OrdenCocinaId = null;
        }
        else if (fila.OrdenCocinaId.HasValue
            && !contexto.OrdenesReutilizables.Contains(fila.OrdenCocinaId.Value))
        {
            // La orden quedó cancelada/completada: el turno se retoma con una orden nueva.
            fila.OrdenCocinaId = null;
        }
        fila.Observaciones = string.IsNullOrWhiteSpace(fila.Observaciones)
            ? motivo
            : $"{fila.Observaciones}\n{motivo}";
        fila.ModificadoPor = UsuarioSistema;
        fila.ModificadoEn = ahora;

        _context.EventosTrazabilidad.Add(new EventoTrazabilidad
        {
            Id = Guid.NewGuid(),
            FilaDietaId = fila.Id,
            TipoEvento = DietasReglasNegocio.TipoEventoReactivacionPorReingreso,
            Descripcion = "Dieta reactivada: paciente vigente en censo tras cancelación automática",
            EstadoAnterior = estadoAnterior,
            EstadoNuevo = nuevoEstado,
            Usuario = UsuarioSistema,
            FechaEvento = ahora,
            DatosAdicionales =
                $"PacienteId: {fila.PacienteId}; IdIngreso: {fila.IdIngreso}; EstadoAlCancelar: {estadoAlCancelar}"
        });

        _logger.LogInformation(
            "Dieta {FilaId} reactivada por revisión de censo: {Anterior} → {Nuevo} (antes de cancelar: {AlCancelar})",
            fila.Id, estadoAnterior, nuevoEstado, estadoAlCancelar);
    }

    /// <summary>
    /// Corrige dietas ya reactivadas a Confirmada/en cocina cuando el reingreso
    /// ocurrió fuera del límite de novedades (turno de cocina cerrado).
    /// </summary>
    private void CorregirReingresoFueraDeVentana(FilaDieta fila, bool ventanaNovedadesAbierta)
    {
        if (!DietasReglasNegocio.DebeCorregirReingresoFueraVentana(fila, ventanaNovedadesAbierta))
            return;

        var estadoAnterior = fila.Estado;
        var ahora = DateTime.UtcNow;
        fila.Estado = EstadoDieta.Pendiente;
        fila.OrdenCocinaId = null;
        fila.CancelacionTardia = false;
        fila.SalidaClinicaSostenida = false;
        if (string.IsNullOrWhiteSpace(fila.Observaciones)
            || !fila.Observaciones.Contains(
                DietasReglasNegocio.MotivoReactivacionReingresoFueraVentana,
                StringComparison.OrdinalIgnoreCase))
        {
            fila.Observaciones = string.IsNullOrWhiteSpace(fila.Observaciones)
                ? DietasReglasNegocio.MotivoReactivacionReingresoFueraVentana
                : $"{fila.Observaciones}\n{DietasReglasNegocio.MotivoReactivacionReingresoFueraVentana}";
        }
        fila.ModificadoPor = UsuarioSistema;
        fila.ModificadoEn = ahora;

        _context.EventosTrazabilidad.Add(new EventoTrazabilidad
        {
            Id = Guid.NewGuid(),
            FilaDietaId = fila.Id,
            TipoEvento = DietasReglasNegocio.TipoEventoReactivacionPorReingreso,
            Descripcion = "Reingreso fuera del límite: dieta corregida a sin solicitud",
            EstadoAnterior = estadoAnterior,
            EstadoNuevo = EstadoDieta.Pendiente,
            Usuario = UsuarioSistema,
            FechaEvento = ahora,
            DatosAdicionales =
                $"PacienteId: {fila.PacienteId}; IdIngreso: {fila.IdIngreso}; VentanaCerrada: true"
        });

        _logger.LogInformation(
            "Dieta {FilaId} corregida tras reingreso fuera de ventana: {Anterior} → Pendiente",
            fila.Id, estadoAnterior);
    }

    /// <summary>Evita emparejar por sufijo con documentos muy cortos o parciales.</summary>
    private const int LongitudMinimaDocumento = 5;

    private static string ClavePacienteHis(string? tipoDocumento, string? cedula) =>
        $"{(tipoDocumento ?? string.Empty).Trim()}-{(cedula ?? string.Empty).Trim()}";

    private static string NormalizarDocumento(string? valor)
    {
        if (string.IsNullOrWhiteSpace(valor)) return string.Empty;
        return new string(valor.Where(char.IsLetterOrDigit).ToArray()).ToUpperInvariant();
    }

    private static string ExtraerCedulaDeClave(string? pacienteId)
    {
        if (string.IsNullOrWhiteSpace(pacienteId)) return string.Empty;
        var partes = pacienteId.Split('-', 2);
        return NormalizarDocumento(partes.Length == 2 ? partes[1] : partes[0]);
    }

    /// <summary>
    /// Empareja una fila guardada con un paciente del censo por documento. No se usa
    /// <c>IdIngreso</c>: el HIS lo numera por paciente, así que se repite entre personas.
    /// </summary>
    private static bool MismaIdentidadPaciente(FilaDieta fila, string pacienteId)
    {
        if (!string.IsNullOrWhiteSpace(fila.PacienteId)
            && fila.PacienteId.Equals(pacienteId, StringComparison.OrdinalIgnoreCase))
            return true;

        var claveFila = ClavePacienteHis(fila.TipoDocumento, fila.Cedula);
        if (!string.IsNullOrWhiteSpace(claveFila)
            && !claveFila.Equals("-", StringComparison.Ordinal)
            && claveFila.Equals(pacienteId, StringComparison.OrdinalIgnoreCase))
            return true;

        // Filas legadas: a veces solo guardaron la cédula en PacienteId o Cedula.
        var cedulaHis = ExtraerCedulaDeClave(pacienteId);
        if (cedulaHis.Length < LongitudMinimaDocumento) return false;

        var cedulaFila = NormalizarDocumento(fila.Cedula);
        if (!string.IsNullOrEmpty(cedulaFila) && cedulaFila == cedulaHis)
            return true;

        var idFilaNorm = NormalizarDocumento(fila.PacienteId);
        if (idFilaNorm.Length < LongitudMinimaDocumento) return false;

        // El sufijo solo vale si la parte previa es el tipo de documento (no dígitos),
        // para no confundir dos cédulas cuando una termina igual que la otra.
        if (idFilaNorm == cedulaHis) return true;

        if (!idFilaNorm.EndsWith(cedulaHis, StringComparison.Ordinal)) return false;

        var prefijo = idFilaNorm[..^cedulaHis.Length];
        return prefijo.All(char.IsLetter);
    }

    private static bool EstaEnCensoHis(FilaDieta fila, HashSet<string> pacienteIdsEnCenso)
    {
        if (pacienteIdsEnCenso.Contains(fila.PacienteId))
            return true;

        var clave = ClavePacienteHis(fila.TipoDocumento, fila.Cedula);
        if (pacienteIdsEnCenso.Contains(clave))
            return true;

        var cedulaFila = NormalizarDocumento(fila.Cedula);
        if (string.IsNullOrEmpty(cedulaFila) && !string.IsNullOrWhiteSpace(fila.PacienteId))
            cedulaFila = ExtraerCedulaDeClave(fila.PacienteId);

        if (string.IsNullOrEmpty(cedulaFila)) return false;

        foreach (var id in pacienteIdsEnCenso)
        {
            if (ExtraerCedulaDeClave(id) == cedulaFila)
                return true;
        }

        return false;
    }

    public async Task<List<FilaDietaDto>> ObtenerDietasPacienteAsync(string pacienteId, DateTime fecha, CancellationToken cancellationToken = default)
    {
        var clave = pacienteId?.Trim() ?? string.Empty;
        var cedula = ExtraerCedulaDeClave(clave);

        var filas = await _context.FilasDietas
            .Include(f => f.TipoDieta)
            .Where(f => f.FechaOperativa.Date == fecha.Date)
            .ToListAsync(cancellationToken);

        // Incluye filas legadas con otro formato de PacienteId (solo cédula vs TipoDoc-Cédula).
        var delPaciente = filas
            .Where(f =>
                f.PacienteId.Equals(clave, StringComparison.OrdinalIgnoreCase)
                || (!string.IsNullOrEmpty(cedula)
                    && (NormalizarDocumento(f.Cedula) == cedula
                        || ExtraerCedulaDeClave(f.PacienteId) == cedula)))
            .ToList();

        // Una fila por comida: evita duplicados en «Otras dietas del paciente hoy».
        var porComida = delPaciente
            .GroupBy(f => f.Comida)
            .Select(g => g
                .OrderByDescending(f => f.Estado != EstadoDieta.Cancelada)
                .ThenByDescending(f => RankEstadoOperativo(f.Estado))
                .ThenByDescending(f => f.ModificadoEn ?? f.CreadoEn)
                .First())
            .OrderBy(f => f.Comida)
            .ToList();

        var dtos = porComida.Select(MapearADto).ToList();
        await ResolverNombresSolicitantesAsync(dtos, cancellationToken);
        return dtos;
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
        if (fila.Estado == EstadoDieta.Cancelada)
        {
            PrepararReactivacionTrasCancelacion(
                fila,
                DietasReglasNegocio.MotivoReactivacionAlSolicitar,
                DietasReglasNegocio.TipoEventoReactivacionManual,
                usuario,
                "Dieta reactivada al solicitar de nuevo tras cancelación",
                EstadoDieta.Solicitada);
        }

        var configTiempo = await _context.TiemposComida
            .FirstOrDefaultAsync(t => t.Comida == fila.Comida, cancellationToken);
        var modoCarga = (await ParametrosOperativosHelper.ObtenerOSemillarAsync(_context, cancellationToken))
            .ModoCarga;

        if (!DietasReglasNegocio.VentanaSolicitudAbiertaConModo(
                configTiempo, modoCarga, HorarioOperativoHelper.AhoraColombia()))
        {
            throw new InvalidOperationException(
                "La ventana de solicitud está cerrada según los parámetros operativos de esta comida.");
        }

        AplicarSolicitudClinica(fila, solicitud);
        DietasReglasNegocio.ValidarCamposClinicosPorComida(fila);
        await ValidarTarifaTipoDietaAsync(fila, cancellationToken);
        fila.SolicitadoPor = TruncarSolicitadoPor(usuario);
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

        return await MapearADtoConNombreAsync(fila, cancellationToken);
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

        if (fila.Estado != EstadoDieta.Solicitada && fila.Estado != EstadoDieta.Guardado)
        {
            throw new InvalidOperationException($"La dieta debe estar en estado Solicitada o Guardado para ser confirmada. Estado actual: {fila.Estado}");
        }

        var configTiempo = await _context.TiemposComida
            .FirstOrDefaultAsync(t => t.Comida == fila.Comida, cancellationToken);
        if (!DietasReglasNegocio.PuedeConfirmarEnvioACocina(
                configTiempo,
                fila.FechaOperativa,
                HorarioOperativoHelper.AhoraColombia()))
        {
            throw new InvalidOperationException(DietasReglasNegocio.MensajeConfirmacionFueraDeLimite);
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

        return await MapearADtoConNombreAsync(fila, cancellationToken);
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
        fila.SolicitadoPor = TruncarSolicitadoPor(usuario);
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

        var configs = await _context.TiemposComida.ToListAsync(cancellationToken);
        var configPorComida = configs.ToDictionary(c => c.Comida);
        var ahora = HorarioOperativoHelper.AhoraColombia();

        var candidatas = filas
            .Where(f => f.Estado is EstadoDieta.Solicitada or EstadoDieta.Guardado)
            .ToList();

        if (candidatas.Count > 0
            && candidatas.All(f =>
            {
                configPorComida.TryGetValue(f.Comida, out var cfg);
                return !DietasReglasNegocio.PuedeConfirmarEnvioACocina(cfg, f.FechaOperativa, ahora);
            }))
        {
            throw new InvalidOperationException(DietasReglasNegocio.MensajeConfirmacionFueraDeLimite);
        }

        int confirmadas = 0;

        foreach (var fila in filas)
        {
            if (fila.Estado is not (EstadoDieta.Solicitada or EstadoDieta.Guardado))
            {
                _logger.LogWarning(
                    "Dieta {DietaId} no está en estado Solicitada/Guardado (estado actual: {Estado}), no se puede confirmar",
                    fila.Id,
                    fila.Estado);
                continue;
            }

            configPorComida.TryGetValue(fila.Comida, out var configTiempo);
            if (!DietasReglasNegocio.PuedeConfirmarEnvioACocina(
                    configTiempo, fila.FechaOperativa, ahora))
            {
                _logger.LogWarning(
                    "Dieta {DietaId} fuera del límite de novedades, no se confirma",
                    fila.Id);
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

        var configTiempo = await _context.TiemposComida
            .FirstOrDefaultAsync(t => t.Comida == fila.Comida, cancellationToken);

        var ventanaAbierta = DietasReglasNegocio.VentanaNovedadesAbiertaParaFecha(
            configTiempo, fila.FechaOperativa, HorarioOperativoHelper.AhoraColombia());

        var tipoCancelacion = DietasReglasNegocio.ResolverTipoCancelacion(
            fila.Estado, cancelacion.RolUsuario, ventanaAbierta);

        if (tipoCancelacion == null)
        {
            throw new InvalidOperationException(
                MensajeBloqueoCancelacion(fila.Estado, ventanaAbierta, configTiempo));
        }

        var esTardia = tipoCancelacion == TipoCancelacionDieta.Tardia;

        if (esTardia && !cancelacion.AceptaFacturacion)
        {
            throw new InvalidOperationException(ventanaAbierta
                ? "Debe aceptar la responsabilidad de facturación para cancelar una dieta confirmada o en preparación."
                : "Debe aceptar la responsabilidad de facturación: pasado el límite de novedades la dieta ya entró en producción.");
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
        fila.SalidaClinicaSostenida = false;
        fila.Observaciones = $"{fila.Observaciones}\nCancelada: {motivoCompleto}".Trim();
        fila.ModificadoPor = usuario;
        fila.ModificadoEn = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        Auditar(AuditoriaCatalogo.Modulos.Dietas, AuditoriaCatalogo.Acciones.Cancelar, usuario,
            AuditoriaCatalogo.Entidades.FilaDieta, filaDietaId,
            new { estado = estadoAnterior.ToString() },
            new
            {
                estado = fila.Estado.ToString(),
                cancelacionTardia = esTardia,
                ventanaNovedadesAbierta = ventanaAbierta,
                motivo = cancelacion.Motivo
            });

        return true;
    }

    /// <summary>
    /// Explica por qué se rechaza la cancelación: estado no cancelable, o dieta ya
    /// solicitada que requiere Administrador (dentro y fuera del límite de novedades).
    /// </summary>
    private static string MensajeBloqueoCancelacion(
        EstadoDieta estado,
        bool ventanaAbierta,
        TiempoComidaConfig? configTiempo)
    {
        if (!DietasReglasNegocio.EsDietaSolicitada(estado))
            return $"No se puede cancelar la dieta en estado {estado}.";

        if (ventanaAbierta)
            return "Solo un Administrador puede cancelar una dieta ya confirmada o en cocina.";

        var limite = configTiempo is null
            ? string.Empty
            : $" (cerró a las {configTiempo.HoraCierre:hh\\:mm})";

        return $"Pasó el límite de novedades{limite}: cocina ya inició la producción y solo un "
            + "Administrador puede cancelar la dieta.";
    }

    public async Task<FilaDietaDto> ReactivarDietaCanceladaAsync(
        Guid filaDietaId,
        string usuario,
        CancellationToken cancellationToken = default)
    {
        var fila = await _context.FilasDietas
            .Include(f => f.TipoDieta)
            .FirstOrDefaultAsync(f => f.Id == filaDietaId, cancellationToken);

        if (fila == null)
            throw new KeyNotFoundException($"FilaDieta con ID {filaDietaId} no encontrada");

        if (fila.Estado != EstadoDieta.Cancelada)
        {
            throw new InvalidOperationException(
                $"Solo se puede reactivar una dieta cancelada. Estado actual: {fila.Estado}");
        }

        var estadoAnterior = fila.Estado;
        PrepararReactivacionTrasCancelacion(
            fila,
            DietasReglasNegocio.MotivoReactivacionManual,
            DietasReglasNegocio.TipoEventoReactivacionManual,
            usuario,
            "Dieta reactivada manualmente a sin solicitud",
            EstadoDieta.Pendiente);
        fila.Estado = EstadoDieta.Pendiente;
        fila.ModificadoPor = usuario;
        fila.ModificadoEn = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        Auditar(AuditoriaCatalogo.Modulos.Dietas, AuditoriaCatalogo.Acciones.Reactivar, usuario,
            AuditoriaCatalogo.Entidades.FilaDieta, filaDietaId,
            new { estado = estadoAnterior.ToString() },
            new { estado = fila.Estado.ToString() });

        _logger.LogInformation(
            "Dieta {DietaId} reactivada a Pendiente por {Usuario}",
            filaDietaId,
            usuario);

        return await MapearADtoConNombreAsync(fila, cancellationToken);
    }

    /// <summary>
    /// Limpia cobro tardío y orden de cocina no reutilizable al salir de Cancelada.
    /// No asigna el estado destino: lo decide el llamador (Pendiente o Solicitada).
    /// </summary>
    private void PrepararReactivacionTrasCancelacion(
        FilaDieta fila,
        string motivo,
        string tipoEvento,
        string usuario,
        string descripcion,
        EstadoDieta estadoNuevo)
    {
        var estadoAnterior = fila.Estado;
        fila.CancelacionTardia = false;
        fila.OrdenCocinaId = null;
        fila.Observaciones = string.IsNullOrWhiteSpace(fila.Observaciones)
            ? motivo
            : $"{fila.Observaciones}\n{motivo}";

        _context.EventosTrazabilidad.Add(new EventoTrazabilidad
        {
            Id = Guid.NewGuid(),
            FilaDietaId = fila.Id,
            TipoEvento = tipoEvento,
            Descripcion = descripcion,
            EstadoAnterior = estadoAnterior,
            EstadoNuevo = estadoNuevo,
            Usuario = usuario,
            FechaEvento = DateTime.UtcNow,
            DatosAdicionales = $"PacienteId: {fila.PacienteId}; IdIngreso: {fila.IdIngreso}",
        });
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
            .Include(f => f.TipoDieta)
            .FirstOrDefaultAsync(f => f.Id == filaDietaId, cancellationToken)
            ?? throw new KeyNotFoundException($"Dieta {filaDietaId} no encontrada");

        if (!DietasReglasNegocio.PermiteRegistrarNovedad(fila.Estado))
        {
            throw new InvalidOperationException(
                $"No se puede registrar novedad en estado {fila.Estado}.");
        }

        var configTiempo = await _context.TiemposComida
            .FirstOrDefaultAsync(t => t.Comida == fila.Comida, cancellationToken);

        if (!DietasReglasNegocio.VentanaNovedadesAbierta(
                configTiempo, HorarioOperativoHelper.AhoraColombia()))
        {
            throw new InvalidOperationException(
                "La ventana de novedades está cerrada según los parámetros operativos.");
        }

        var motivo = PrimerTextoNoVacio(novedad.Descripcion, novedad.Motivo, "Novedad clínica");
        var detalle = novedad.Observaciones?.Trim();
        var hayCambioClinico =
            novedad.TipoDietaId.HasValue
            || novedad.Consistencia != null
            || novedad.DescripcionDieta != null
            || novedad.Aislado.HasValue
            || novedad.Alergico.HasValue;

        if (hayCambioClinico)
        {
            AplicarSolicitudClinica(fila, new SolicitudDietaDto
            {
                TipoDietaId = novedad.TipoDietaId,
                Consistencia = novedad.Consistencia,
                DescripcionDieta = novedad.DescripcionDieta,
                Aislado = novedad.Aislado,
                Aislamiento = novedad.Aislamiento,
                ObservacionAislamiento = novedad.ObservacionAislamiento,
                Alergico = novedad.Alergico,
                Alergias = novedad.Alergias,
            }, parcial: true);
            DietasReglasNegocio.ValidarCamposClinicosPorComida(fila);
            await ValidarTarifaTipoDietaAsync(fila, cancellationToken);
        }

        var nota = string.IsNullOrEmpty(detalle) ? motivo : $"{motivo}: {detalle}";
        fila.Observaciones = CombinarObservaciones(
            fila.Observaciones,
            $"[{DateTime.UtcNow:yyyy-MM-dd HH:mm}] {nota}");
        fila.ModificadoPor = usuario;
        fila.ModificadoEn = DateTime.UtcNow;

        var tipoEvento = TruncarTexto(
            PrimerTextoNoVacio(novedad.TipoNovedad, "novedad_registrada"),
            50);
        _context.EventosTrazabilidad.Add(new EventoTrazabilidad
        {
            Id = Guid.NewGuid(),
            FilaDietaId = filaDietaId,
            TipoEvento = tipoEvento,
            Descripcion = TruncarTexto(nota, 1000),
            EstadoAnterior = fila.Estado,
            EstadoNuevo = fila.Estado,
            DatosAdicionales = detalle,
            Usuario = TruncarSolicitadoPor(usuario),
            CreadoPor = TruncarSolicitadoPor(usuario),
            FechaEvento = DateTime.UtcNow,
        });

        await _context.SaveChangesAsync(cancellationToken);

        if (fila.TipoDietaId.HasValue)
        {
            await _context.Entry(fila).Reference(f => f.TipoDieta).LoadAsync(cancellationToken);
        }

        Auditar(AuditoriaCatalogo.Modulos.Dietas, AuditoriaCatalogo.Acciones.Novedad, usuario,
            AuditoriaCatalogo.Entidades.FilaDieta, filaDietaId, null,
            new { tipoEvento, motivo, novedad.TipoDietaId, novedad.Consistencia });

        _logger.LogInformation("Novedad registrada en dieta {DietaId} por {Usuario}: {Tipo}", filaDietaId, usuario, tipoEvento);

        return await MapearADtoConNombreAsync(fila, cancellationToken);
    }

    public async Task<FilaDietaDto> ObtenerDetalleDietaAsync(Guid filaDietaId, CancellationToken cancellationToken = default)
    {
        var fila = await _context.FilasDietas
            .Include(f => f.TipoDieta)
            .FirstOrDefaultAsync(f => f.Id == filaDietaId, cancellationToken)
            ?? throw new KeyNotFoundException($"Dieta {filaDietaId} no encontrada");

        return await MapearADtoConNombreAsync(fila, cancellationToken);
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

        var dtos = filas.Select(MapearADto).ToList();
        await ResolverNombresSolicitantesAsync(dtos, cancellationToken);

        return new CensoDietasDto
        {
            FechaOperativa = filtros.Fecha ?? DateTime.UtcNow.Date,
            Comida = filtros.Comida ?? "Todos",
            TotalPacientes = filas.Count,
            DietasConfirmadas = filas.Count(f => f.Estado == EstadoDieta.Confirmada),
            DietasSolicitadas = filas.Count(f => f.Estado == EstadoDieta.Solicitada),
            DietasPendientes = filas.Count(f => f.Estado == EstadoDieta.Pendiente),
            Filas = dtos
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
            fila.SolicitadoPor ??= TruncarSolicitadoPor(usuario);
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

    private async Task<FilaDietaDto> MapearADtoConNombreAsync(FilaDieta fila, CancellationToken cancellationToken)
    {
        var dto = MapearADto(fila);
        await ResolverNombresSolicitantesAsync([dto], cancellationToken);
        return dto;
    }

    private static string TruncarSolicitadoPor(string usuario)
    {
        var valor = usuario.Trim();
        return valor.Length <= MaxSolicitadoPor
            ? valor
            : valor[..MaxSolicitadoPor].TrimEnd();
    }

    private static string PrimerTextoNoVacio(params string?[] valores)
    {
        foreach (var valor in valores)
        {
            var texto = valor?.Trim();
            if (!string.IsNullOrEmpty(texto)) return texto;
        }

        return string.Empty;
    }

    private static string TruncarTexto(string valor, int max)
    {
        var texto = valor.Trim();
        return texto.Length <= max ? texto : texto[..max].TrimEnd();
    }

    private static string CombinarObservaciones(string? actuales, string nota)
    {
        const int maxObservaciones = 1000;
        var combinado = string.IsNullOrWhiteSpace(actuales)
            ? nota
            : $"{actuales.TrimEnd()}\n{nota}";
        return TruncarTexto(combinado, maxObservaciones);
    }

    /// <summary>
    /// SQL no conserva DateTimeKind; se marca UTC para que el JSON lleve Z y el front no desfase la hora.
    /// </summary>
    private static DateTime? ComoUtc(DateTime? valor)
    {
        if (valor is not { } fecha) return null;
        return fecha.Kind switch
        {
            DateTimeKind.Utc => fecha,
            DateTimeKind.Local => fecha.ToUniversalTime(),
            _ => DateTime.SpecifyKind(fecha, DateTimeKind.Utc),
        };
    }

    /// <summary>
    /// Registros legados guardaron el usuario de login (cédula o nombre de usuario) en SolicitadoPor;
    /// se resuelve a NombreCompleto para la UI.
    /// </summary>
    private async Task ResolverNombresSolicitantesAsync(
        IList<FilaDietaDto> dtos,
        CancellationToken cancellationToken)
    {
        var claves = dtos
            .Select(d => d.SolicitadoPor?.Trim())
            .OfType<string>()
            .Where(s =>
                s.Length > 0
                && !s.Equals(UsuarioSistema, StringComparison.OrdinalIgnoreCase))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (claves.Count == 0)
        {
            return;
        }

        var clavesLower = claves.Select(c => c.ToLowerInvariant()).ToList();

        var usuarios = await _context.UsuariosModulo
            .AsNoTracking()
            .Where(u =>
                u.Identificacion != null
                && clavesLower.Contains(u.Identificacion!.ToLower()))
            .Select(u => new { u.Identificacion, u.NombreCompleto })
            .ToListAsync(cancellationToken);

        var mapa = usuarios
            .Where(u =>
                !string.IsNullOrWhiteSpace(u.Identificacion)
                && !string.IsNullOrWhiteSpace(u.NombreCompleto))
            .GroupBy(u => u.Identificacion!.Trim(), StringComparer.OrdinalIgnoreCase)
            .ToDictionary(
                g => g.Key,
                g => TruncarSolicitadoPor(g.First().NombreCompleto),
                StringComparer.OrdinalIgnoreCase);

        foreach (var dto in dtos)
        {
            var clave = dto.SolicitadoPor?.Trim();
            if (clave != null && mapa.TryGetValue(clave, out var nombre))
            {
                dto.SolicitadoPor = nombre;
            }
        }
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
            SolicitadoEn = ComoUtc(fila.SolicitadoEn),
            CancelacionTardia = fila.CancelacionTardia,
            CancelacionPorSalidaClinica =
                fila.Estado == EstadoDieta.Cancelada
                && DietasReglasNegocio.EsObservacionSalidaClinica(fila.Observaciones, fila.Estado),
            SalidaClinicaSostenida = DietasReglasNegocio.EsSalidaClinicaSostenida(fila),
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
