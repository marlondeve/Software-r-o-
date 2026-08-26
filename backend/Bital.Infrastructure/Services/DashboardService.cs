using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Bital.Application.DTOs.DietasCocina;
using Bital.Application.Interfaces;
using Bital.Domain.Enums;
using Bital.Domain.Entities.DietasCocina;
using Bital.Infrastructure.Data;
using Bital.Infrastructure.DietasCocina;
using Microsoft.EntityFrameworkCore;

namespace Bital.Infrastructure.Services;

public class DashboardService : IDashboardService
{
    private readonly BitalNegocioDbContext _context;

    public DashboardService(BitalNegocioDbContext context)
    {
        _context = context;
    }

    private static bool TryParseTiempoComida(string? comida, out TiempoComida tiempoComida)
    {
        tiempoComida = default;
        return !string.IsNullOrWhiteSpace(comida)
            && Enum.TryParse<TiempoComida>(comida, ignoreCase: true, out tiempoComida);
    }

    private static bool TryResolverComidaReporte(FiltrosReportesDto filtros, out TiempoComida comida)
    {
        if (!string.IsNullOrWhiteSpace(filtros.Comida) && TryParseTiempoComida(filtros.Comida, out comida))
        {
            return true;
        }

        var horario = filtros.Horario?.Trim().ToLowerInvariant();
        comida = horario switch
        {
            "desayuno" => TiempoComida.Desayuno,
            "merienda-manana" => TiempoComida.MediaNueve,
            "almuerzo" => TiempoComida.Almuerzo,
            "merienda-tarde" => TiempoComida.Onces,
            "cena" => TiempoComida.Cena,
            "merienda-noche" => TiempoComida.MediaNoche,
            _ => default,
        };

        return horario is not (null or "" or "todos");
    }

    private static int ContarDiasPeriodo(DateTime desde, DateTime hasta) =>
        Math.Max(1, (hasta.Date - desde.Date).Days + 1);

    private static string ContextoFiltroReporte(DateTime desde, DateTime hasta) =>
        desde.Date == hasta.Date
            ? $"el {desde:yyyy-MM-dd}"
            : $"del {desde:yyyy-MM-dd} al {hasta:yyyy-MM-dd}";

    private static string EtiquetaEstadoDietaReporte(FilaDieta dieta) =>
        dieta.Estado switch
        {
            EstadoDieta.Pendiente => "Sin solicitud",
            EstadoDieta.Guardado or EstadoDieta.Solicitada => "Guardadas",
            EstadoDieta.Confirmada => "Confirmadas",
            EstadoDieta.EnPreparacion => "En gestión",
            EstadoDieta.ListaEnvio => "Listas",
            EstadoDieta.EnRuta => "En tránsito",
            EstadoDieta.Entregada or EstadoDieta.Consumida => "Entregadas",
            EstadoDieta.NoConsumida or EstadoDieta.Devuelta => "Devueltas",
            EstadoDieta.Cancelada => DietasReglasNegocio.EsObservacionSalidaClinica(dieta.Observaciones)
                ? "Salida clínica"
                : "Cancelada",
            _ => dieta.Estado.ToString(),
        };

    private static string EtiquetaComidaReporte(TiempoComida comida) =>
        comida switch
        {
            TiempoComida.Desayuno => "Desayuno",
            TiempoComida.MediaNueve => "Merienda mañana",
            TiempoComida.Almuerzo => "Almuerzo",
            TiempoComida.Onces => "Merienda tarde",
            TiempoComida.Cena => "Cena",
            TiempoComida.MediaNoche => "Merienda noche",
            _ => comida.ToString(),
        };

    private static string EtiquetaEstadoOrdenReporte(string estado) =>
        estado switch
        {
            "Pendiente" => "Pendientes",
            "EnPreparacion" => "En preparación",
            "Completada" => "Completadas",
            _ => estado,
        };

    private static GraficoDto CrearGraficoBarra(
        string titulo,
        IEnumerable<(string Categoria, int Cantidad)> datos)
    {
        var items = datos.ToList();
        return new GraficoDto
        {
            Tipo = "barra",
            Titulo = titulo,
            Categorias = items.Select(d => d.Categoria).ToList(),
            Series = new List<GraficoSerieDto>
            {
                new()
                {
                    Etiqueta = "Cantidad",
                    Valores = items.Select(d => (decimal)d.Cantidad).ToList(),
                },
            },
        };
    }

    private static GraficoDto CrearGraficoBarraMoneda(
        string titulo,
        IEnumerable<(string Categoria, decimal Monto)> datos)
    {
        var items = datos.ToList();
        return new GraficoDto
        {
            Tipo = "barra",
            Titulo = titulo,
            Categorias = items.Select(d => d.Categoria).ToList(),
            Series = new List<GraficoSerieDto>
            {
                new()
                {
                    Etiqueta = "Costo",
                    Valores = items.Select(d => Math.Round(d.Monto, 2)).ToList(),
                },
            },
        };
    }

    private static decimal ResolverTarifaDieta(
        IReadOnlyList<Domain.Entities.DietasCocina.TarifaHistorico> tarifas,
        Guid? tipoDietaId,
        TiempoComida comida,
        DateTime fecha)
    {
        if (tipoDietaId is null || tipoDietaId == Guid.Empty)
            return 0m;

        return tarifas
            .Where(t =>
                t.DietaCatalogoId == tipoDietaId
                && t.TiempoComida == comida
                && TarifasCatalogoHelper.EsTarifaVigente(t, fecha.Date))
            .OrderByDescending(t => t.VigenciaDesde)
            .Select(t => t.Monto)
            .FirstOrDefault();
    }

    private static GraficoDto CrearGraficoPie(
        string titulo,
        IEnumerable<(string Categoria, int Cantidad)> datos)
    {
        var items = datos.ToList();
        return new GraficoDto
        {
            Tipo = "pie",
            Titulo = titulo,
            Categorias = items.Select(d => d.Categoria).ToList(),
            Series = new List<GraficoSerieDto>
            {
                new()
                {
                    Etiqueta = "Cantidad",
                    Valores = items.Select(d => (decimal)d.Cantidad).ToList(),
                },
            },
        };
    }

    private static List<HitoReporteDto> ConstruirHitosLogisticos(
        List<Domain.Entities.DietasCocina.EtiquetaEnfermera> etiquetas,
        DateTime hasta)
    {
        var hitos = new List<HitoReporteDto>();
        var minImpresion = PromedioMinutosEtiquetas(etiquetas, e => e.GeneradaEn, e => e.ImpresaEn);
        if (minImpresion.HasValue)
        {
            hitos.Add(new HitoReporteDto
            {
                Fecha = hasta,
                Evento = "Impresión de etiqueta",
                Detalle = FormatearDuracionHhMm(minImpresion.Value),
            });
        }

        var minTransito = PromedioMinutosEtiquetas(etiquetas, e => e.ImpresaEn, e => e.PreEntregadaEn);
        if (minTransito.HasValue)
        {
            hitos.Add(new HitoReporteDto
            {
                Fecha = hasta,
                Evento = "Tránsito a enfermería",
                Detalle = FormatearDuracionHhMm(minTransito.Value),
            });
        }

        var minEntrega = PromedioMinutosEtiquetas(etiquetas, e => e.PreEntregadaEn, e => e.EntregadaEn);
        if (minEntrega.HasValue)
        {
            hitos.Add(new HitoReporteDto
            {
                Fecha = hasta,
                Evento = "Entrega al paciente",
                Detalle = FormatearDuracionHhMm(minEntrega.Value),
            });
        }

        return hitos;
    }

    private static string FormatearDuracionHhMm(int minutos)
    {
        var total = Math.Max(0, minutos);
        var horas = total / 60;
        var mins = total % 60;
        return $"{horas:D2}:{mins:D2}";
    }

    private static List<(string Categoria, int Cantidad)> AgruparMotivosTop3(
        IEnumerable<Domain.Entities.DietasCocina.EtiquetaEnfermera> etiquetas,
        Func<Domain.Entities.DietasCocina.EtiquetaEnfermera, bool> filtro)
    {
        return etiquetas
            .Where(filtro)
            .GroupBy(e => string.IsNullOrWhiteSpace(e.MotivoDevolucion) ? "Sin motivo" : e.MotivoDevolucion!.Trim())
            .OrderByDescending(g => g.Count())
            .Take(3)
            .Select(g => (g.Key, g.Count()))
            .ToList();
    }

    private static bool EsRechazoAntesEntrega(Domain.Entities.DietasCocina.EtiquetaEnfermera etiqueta) =>
        etiqueta.EstadoLogistica == "devuelta" && !etiqueta.EntregadaEn.HasValue;

    private static bool EsRecogidaPostEntrega(Domain.Entities.DietasCocina.EtiquetaEnfermera etiqueta) =>
        etiqueta.EstadoLogistica == "devuelta" && etiqueta.EntregadaEn.HasValue;

    private static int? PromedioMinutosEtiquetas(
        IEnumerable<Domain.Entities.DietasCocina.EtiquetaEnfermera> etiquetas,
        Func<Domain.Entities.DietasCocina.EtiquetaEnfermera, DateTime?> inicio,
        Func<Domain.Entities.DietasCocina.EtiquetaEnfermera, DateTime?> fin)
    {
        var muestras = etiquetas
            .Select(e =>
            {
                var desde = inicio(e);
                var hasta = fin(e);
                if (!desde.HasValue || !hasta.HasValue || hasta <= desde) return (int?)null;
                return (int?)Math.Round((hasta.Value - desde.Value).TotalMinutes);
            })
            .Where(minutos => minutos.HasValue)
            .Select(minutos => minutos!.Value)
            .ToList();

        return muestras.Count > 0 ? (int)Math.Round(muestras.Average()) : null;
    }

    private static List<HallazgoDto> ConstruirHallazgosNutricionista(
        List<Domain.Entities.DietasCocina.FilaDieta> dietas,
        List<Domain.Entities.DietasCocina.EtiquetaEnfermera> etiquetas,
        DateTime desde,
        DateTime hasta)
    {
        var hallazgos = new List<HallazgoDto>();
        var contexto = ContextoFiltroReporte(desde, hasta);
        var totalEtiquetas = etiquetas.Count;

        if (totalEtiquetas == 0 && dietas.Count == 0)
        {
            hallazgos.Add(new HallazgoDto
            {
                Tipo = "sin_actividad",
                Descripcion = $"Sin actividad registrada para {contexto}",
                Severidad = "info",
                Cantidad = 0,
            });
            return hallazgos;
        }

        var entregadas = etiquetas.Count(e => e.EstadoLogistica == "entregada");
        var devueltas = etiquetas.Count(e => e.EstadoLogistica == "devuelta");
        var recogidas = etiquetas.Count(e =>
            e.EstadoLogistica == "devuelta" && e.EntregadaEn.HasValue);
        var rechazadas = devueltas - recogidas;

        if (devueltas > 0)
        {
            hallazgos.Add(new HallazgoDto
            {
                Tipo = "cierres_bandeja",
                Descripcion =
                    $"{recogidas} recogida(s), {rechazadas} rechazada(s) de {totalEtiquetas} en {contexto}",
                Severidad = rechazadas > 5 ? "alta" : "media",
                Cantidad = devueltas,
            });
        }

        if (totalEtiquetas > 0)
        {
            hallazgos.Add(new HallazgoDto
            {
                Tipo = "resumen_logistico",
                Descripcion =
                    $"{entregadas} entregadas, {recogidas} recogidas, {rechazadas} rechazadas de {totalEtiquetas} etiquetas ({contexto})",
                Severidad = "info",
                Cantidad = totalEtiquetas,
            });
        }

        var canceladas = dietas.Count(d => d.Estado == EstadoDieta.Cancelada);
        if (canceladas > 0)
        {
            var salidas = dietas.Count(d =>
                d.Estado == EstadoDieta.Cancelada
                && DietasReglasNegocio.EsObservacionSalidaClinica(d.Observaciones));
            var manuales = canceladas - salidas;
            var detalle = salidas > 0 && manuales > 0
                ? $"{salidas} salida(s) clínica(s) y {manuales} cancelada(s)"
                : salidas > 0
                    ? $"{salidas} salida(s) clínica(s)"
                    : $"{manuales} dieta(s) cancelada(s)";

            hallazgos.Add(new HallazgoDto
            {
                Tipo = "dietas_canceladas",
                Descripcion = $"{detalle} en {contexto}",
                Severidad = canceladas > 10 ? "alta" : "media",
                Cantidad = canceladas,
            });
        }

        if (hallazgos.Count == 0)
        {
            hallazgos.Add(new HallazgoDto
            {
                Tipo = "sin_alertas",
                Descripcion = $"No hay incidencias para {contexto}",
                Severidad = "info",
                Cantidad = 0,
            });
        }

        return hallazgos;
    }

    private static string MapearEstadoActividad(string tipoEvento, Domain.Enums.EstadoDieta estadoNuevo)
    {
        return tipoEvento.ToLowerInvariant() switch
        {
            "entrega_confirmada" => "recibida",
            "devolucion_registrada" => "devuelta",
            "pre_entrega_confirmada" => "confirmada",
            "dieta_confirmada" => "confirmada",
            "cancelacion" => "cancelada",
            "dieta_cancelada" => "cancelada",
            "dieta_cancelada_egreso" => "cancelada",
            "dieta_reactivada_reingreso" => "confirmada",
            _ => MapearEstadoDieta(estadoNuevo)
        };
    }

    private static string MapearEstadoDieta(Domain.Enums.EstadoDieta estado)
    {
        return estado switch
        {
            Domain.Enums.EstadoDieta.Pendiente => "no-solicitada",
            Domain.Enums.EstadoDieta.Guardado => "guardado",
            Domain.Enums.EstadoDieta.Solicitada => "guardado",
            Domain.Enums.EstadoDieta.Confirmada => "confirmada",
            Domain.Enums.EstadoDieta.EnPreparacion => "en-preparacion",
            Domain.Enums.EstadoDieta.ListaEnvio => "lista-despacho",
            Domain.Enums.EstadoDieta.EnRuta => "despachada",
            Domain.Enums.EstadoDieta.Entregada => "recibida",
            Domain.Enums.EstadoDieta.Consumida => "recibida",
            Domain.Enums.EstadoDieta.Cancelada => "cancelada",
            Domain.Enums.EstadoDieta.NoConsumida => "devuelta",
            Domain.Enums.EstadoDieta.Devuelta => "devuelta",
            _ => "guardado"
        };
    }

    private static (DateTime Desde, DateTime Hasta) RangoDia(DateTime fecha)
    {
        var desde = fecha.Date;
        return (desde, desde.AddDays(1));
    }

    private const int LongitudMinimaDocumentoDashboard = 5;

    private static string NormalizarDocumentoDashboard(string? valor)
    {
        if (string.IsNullOrWhiteSpace(valor)) return string.Empty;
        return new string(valor.Where(char.IsLetterOrDigit).ToArray()).ToUpperInvariant();
    }

    private static string ClavePacienteDashboard(FilaDieta fila)
    {
        var cedula = NormalizarDocumentoDashboard(fila.Cedula);
        if (cedula.Length >= LongitudMinimaDocumentoDashboard) return cedula;

        var id = fila.PacienteId ?? string.Empty;
        var partes = id.Split('-', 2);
        var extraida = NormalizarDocumentoDashboard(partes.Length == 2 ? partes[1] : partes[0]);
        if (extraida.Length >= LongitudMinimaDocumentoDashboard) return extraida;

        return string.IsNullOrWhiteSpace(id) ? string.Empty : id.Trim().ToUpperInvariant();
    }

    private static int RankEstadoDashboard(EstadoDieta estado) =>
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
    /// Una fila por paciente + comida + día operativo. No usa IdIngreso:
    /// en el HIS se repite entre personas. Incluye la fecha para no colapsar
    /// el mismo turno de días distintos en un reporte de período.
    /// </summary>
    private static List<FilaDieta> DeduplicarFilasDashboard(IEnumerable<FilaDieta> filas)
    {
        var porClave = new Dictionary<string, FilaDieta>(StringComparer.OrdinalIgnoreCase);

        foreach (var fila in filas)
        {
            var paciente = ClavePacienteDashboard(fila);
            if (string.IsNullOrEmpty(paciente))
            {
                paciente = string.IsNullOrWhiteSpace(fila.PacienteId)
                    ? $"NOM-{fila.Paciente}|{fila.Pabellon}|{fila.Habitacion}"
                    : fila.PacienteId.Trim();
            }

            var clave = $"{fila.FechaOperativa:yyyy-MM-dd}|{fila.Comida}|{paciente}";
            if (!porClave.TryGetValue(clave, out var actual))
            {
                porClave[clave] = fila;
                continue;
            }

            porClave[clave] =
                fila.Estado != EstadoDieta.Cancelada && actual.Estado == EstadoDieta.Cancelada
                    ? fila
                    : RankEstadoDashboard(fila.Estado) >= RankEstadoDashboard(actual.Estado)
                        ? fila
                        : actual;
        }

        return porClave.Values.ToList();
    }

    public async Task<DashboardNutricionistaDto> ObtenerDashboardNutricionistaAsync(DateTime? fecha, string? comida)
    {
        var fechaOperativa = (fecha ?? DateTime.Today).Date;
        var (desde, hasta) = RangoDia(fechaOperativa);

        var dietasQuery = _context.FilasDietas
            .Where(f => f.FechaOperativa >= desde && f.FechaOperativa < hasta);

        if (TryParseTiempoComida(comida, out var tiempoComida))
            dietasQuery = dietasQuery.Where(f => f.Comida == tiempoComida);

        var dietas = DeduplicarFilasDashboard(await dietasQuery.ToListAsync());
        var totalDietas = dietas.Count;
        var canceladas = dietas.Count(d => d.Estado == EstadoDieta.Cancelada);
        var dietasActivas = totalDietas - canceladas;
        var pendientes = dietas.Count(d =>
            d.Estado is EstadoDieta.Pendiente or EstadoDieta.Guardado or EstadoDieta.Solicitada);
        var confirmadas = dietas.Count(d =>
            d.Estado is EstadoDieta.Confirmada
                or EstadoDieta.EnPreparacion
                or EstadoDieta.ListaEnvio
                or EstadoDieta.EnRuta);
        var novedades = dietas.Count(d =>
            d.Estado is EstadoDieta.Guardado or EstadoDieta.Solicitada);
        var fueraHorario = dietas.Count(d => d.CancelacionTardia);

        var kpis = new List<KpiDto>
        {
            new() { Clave = "pacientes_activos", Etiqueta = "Pacientes activos", Valor = dietasActivas, Formato = "numero", Tendencia = null, Comparacion = null },
            new() { Clave = "dietas_pendientes", Etiqueta = "Dietas pendientes", Valor = pendientes, Formato = "numero", Tendencia = null, Comparacion = null },
            new() { Clave = "confirmadas", Etiqueta = "Confirmadas", Valor = confirmadas, Formato = "numero", Tendencia = null, Comparacion = null },
            new() { Clave = "novedades", Etiqueta = "Novedades", Valor = novedades, Formato = "numero", Tendencia = null, Comparacion = null },
            new() { Clave = "salidas_canceladas", Etiqueta = "Salidas / canceladas", Valor = canceladas, Formato = "numero", Tendencia = null, Comparacion = null },
            new() { Clave = "fuera_horario", Etiqueta = "Fuera de horario", Valor = fueraHorario, Formato = "numero", Tendencia = null, Comparacion = null },
        };

        var distribucionEstados = totalDietas > 0
            ? dietas
                .GroupBy(EtiquetaEstadoDietaReporte)
                .Select(g => new DistribucionItemDto
                {
                    Categoria = g.Key,
                    Cantidad = g.Count(),
                    Porcentaje = Math.Round((decimal)g.Count() / totalDietas * 100, 1)
                })
                .ToList()
            : new List<DistribucionItemDto>();

        var distribucionDietas = totalDietas > 0
            ? dietas
                .Where(d => d.TipoDieta != null)
                .GroupBy(d => d.TipoDieta!.ToString())
                .Select(g => new DistribucionItemDto
                {
                    Categoria = g.Key ?? "Sin categoría",
                    Cantidad = g.Count(),
                    Porcentaje = Math.Round((decimal)g.Count() / totalDietas * 100, 1)
                })
                .ToList()
            : new List<DistribucionItemDto>();

        var distribucionServicios = totalDietas > 0
            ? dietas
                .GroupBy(d => DietasReglasNegocio.ResolverServicioClinico(d.Servicio, d.Pabellon))
                .Select(g => new DistribucionItemDto
                {
                    Categoria = g.Key ?? "Sin categoría",
                    Cantidad = g.Count(),
                    Porcentaje = Math.Round((decimal)g.Count() / totalDietas * 100, 1)
                })
                .ToList()
            : new List<DistribucionItemDto>();

        var distribuciones = new List<DistribucionDto>
        {
            new() { Tipo = "estados", Items = distribucionEstados },
            new() { Tipo = "dietas", Items = distribucionDietas },
            new() { Tipo = "servicios", Items = distribucionServicios }
        };

        // Actividad reciente de enfermería (excluye eventos de cocina/etiquetas)
        var actividadQuery = _context.EventosTrazabilidad
            .Include(e => e.FilaDieta)
            .Where(e => e.FechaEvento >= desde && e.FechaEvento < hasta)
            .Where(e =>
                !e.TipoEvento.StartsWith("orden_") &&
                !e.TipoEvento.StartsWith("etiqueta_"));

        if (TryParseTiempoComida(comida, out var tiempoComidaActividad))
            actividadQuery = actividadQuery.Where(e => e.FilaDieta.Comida == tiempoComidaActividad);

        var eventosActividad = await actividadQuery
            .OrderByDescending(e => e.FechaEvento)
            .Take(8)
            .ToListAsync();

        var actividad = eventosActividad
            .Select(e =>
            {
                var observaciones = e.FilaDieta?.Observaciones;
                var cancelacionPorSalida =
                    string.Equals(
                        e.TipoEvento,
                        DietasReglasNegocio.TipoEventoCancelacionPorEgreso,
                        StringComparison.OrdinalIgnoreCase)
                    || (e.FilaDieta?.Estado == EstadoDieta.Cancelada
                        && DietasReglasNegocio.EsObservacionSalidaClinica(observaciones));

                return new ActividadDto
                {
                    Timestamp = e.FechaEvento,
                    Tipo = e.TipoEvento,
                    Usuario = e.Usuario,
                    Descripcion = e.Descripcion,
                    Paciente = e.FilaDieta?.Paciente,
                    Habitacion = e.FilaDieta?.Habitacion,
                    Estado = MapearEstadoActividad(e.TipoEvento, e.EstadoNuevo),
                    Observaciones = observaciones,
                    CancelacionPorSalidaClinica = cancelacionPorSalida,
                    Entidad = "FilaDieta",
                    EntidadId = e.FilaDietaId.ToString(),
                };
            })
            .ToList();

        return new DashboardNutricionistaDto
        {
            Kpis = kpis,
            Distribuciones = distribuciones,
            ActividadReciente = actividad,
            FechaOperativa = fechaOperativa,
            Comida = comida
        };
    }

    public async Task<DashboardProveedorDto> ObtenerDashboardProveedorAsync(string? comida)
    {
        var fechaHoy = DateTime.Today;

        // Órdenes del día
        var ordenesQuery = _context.OrdenesCocina
            .Where(o => o.FechaOperativa.Date == fechaHoy);

        if (TryParseTiempoComida(comida, out var tiempoComidaOrden))
            ordenesQuery = ordenesQuery.Where(o => o.Comida == tiempoComidaOrden);

        var ordenes = await ordenesQuery.ToListAsync();
        var totalOrdenes = ordenes.Count;
        var ordenesCompletadas = ordenes.Count(o => o.Estado == "Completada");
        var porcentajeProgreso = totalOrdenes > 0 ? Math.Round((decimal)ordenesCompletadas / totalOrdenes * 100, 1) : 0;

        // Etiquetas generadas
        var etiquetasQuery = _context.EtiquetasEnfermeria
            .Where(e => e.GeneradaEn.Date == fechaHoy);

        if (TryParseTiempoComida(comida, out var tiempoComidaEtiqueta))
            etiquetasQuery = etiquetasQuery.Where(e => e.Comida == tiempoComidaEtiqueta);

        var etiquetasGeneradas = await etiquetasQuery.CountAsync();
        var etiquetasEntregadas = await etiquetasQuery.CountAsync(e => e.EntregadaEn != null);

        // KPIs
        var kpis = new List<KpiDto>
        {
            new() { Clave = "ordenes_totales", Etiqueta = "Órdenes totales", Valor = totalOrdenes, Formato = "numero", Tendencia = null, Comparacion = null },
            new() { Clave = "ordenes_completadas", Etiqueta = "Órdenes completadas", Valor = ordenesCompletadas, Formato = "numero", Tendencia = null, Comparacion = null },
            new() { Clave = "etiquetas_generadas", Etiqueta = "Etiquetas generadas", Valor = etiquetasGeneradas, Formato = "numero", Tendencia = null, Comparacion = null },
            new() { Clave = "etiquetas_entregadas", Etiqueta = "Etiquetas entregadas", Valor = etiquetasEntregadas, Formato = "numero", Tendencia = null, Comparacion = null },
            new() { Clave = "progreso_entregas", Etiqueta = "Progreso entregas", Valor = porcentajeProgreso, Formato = "porcentaje", Tendencia = null, Comparacion = null }
        };

        // Alertas: órdenes pendientes de completar
        var alertas = new List<AlertaDto>();
        var ordenesPendientes = totalOrdenes - ordenesCompletadas;
        if (ordenesPendientes > 0)
        {
            alertas.Add(new AlertaDto
            {
                Nivel = ordenesPendientes > 10 ? "alta" : "media",
                Tipo = "ordenes_pendientes",
                Mensaje = $"{ordenesPendientes} órdenes pendientes de completar",
                GeneradaEn = DateTime.UtcNow,
                EntidadId = null,
                Accion = "Revisar estado de órdenes"
            });
        }

        return new DashboardProveedorDto
        {
            Kpis = kpis,
            Alertas = alertas,
            Comida = comida,
            ProgresoEntregas = porcentajeProgreso
        };
    }

    public async Task<DashboardEnfermeraDto> ObtenerDashboardEnfermeraAsync(string? comida, string? pabellon)
    {
        var fechaHoy = DateTime.Today;

        // Etiquetas generadas para el pabellón
        var etiquetasQuery = _context.EtiquetasEnfermeria
            .Include(e => e.FilaDieta)
            .Where(e => e.GeneradaEn.Date == fechaHoy);

        if (TryParseTiempoComida(comida, out var tiempoComidaEtiqueta))
            etiquetasQuery = etiquetasQuery.Where(e => e.Comida == tiempoComidaEtiqueta);

        if (!string.IsNullOrEmpty(pabellon))
            etiquetasQuery = etiquetasQuery.Where(e => e.FilaDieta != null && e.FilaDieta.Pabellon == pabellon);

        var etiquetas = await etiquetasQuery.ToListAsync();
        var totalEtiquetas = etiquetas.Count;
        var etiquetasEntregadas = etiquetas.Count(e => e.EntregadaEn != null);
        var etiquetasPendientes = totalEtiquetas - etiquetasEntregadas;

        // Conciliación con diferencias
        var conciliacionQuery = _context.FilasConciliacion
            .Where(c => c.FechaOperativa.Date == fechaHoy && c.Diferencia != 0);

        if (!string.IsNullOrEmpty(pabellon))
            conciliacionQuery = conciliacionQuery.Where(c => c.Pabellon == pabellon);

        var lineasConDiferencia = await conciliacionQuery.CountAsync();

        // KPIs
        var kpis = new List<KpiDto>
        {
            new() { Clave = "etiquetas_generadas", Etiqueta = "Etiquetas generadas", Valor = totalEtiquetas, Formato = "numero", Tendencia = null, Comparacion = null },
            new() { Clave = "etiquetas_entregadas", Etiqueta = "Etiquetas entregadas", Valor = etiquetasEntregadas, Formato = "numero", Tendencia = null, Comparacion = null },
            new() { Clave = "etiquetas_pendientes", Etiqueta = "Etiquetas pendientes", Valor = etiquetasPendientes, Formato = "numero", Tendencia = null, Comparacion = null },
            new() { Clave = "diferencias_conciliacion", Etiqueta = "Diferencias en conciliación", Valor = lineasConDiferencia, Formato = "numero", Tendencia = null, Comparacion = null }
        };

        // Alertas clínicas
        var alertas = new List<AlertaDto>();

        if (etiquetasPendientes > 0)
        {
            alertas.Add(new AlertaDto
            {
                Nivel = etiquetasPendientes > 5 ? "alta" : "media",
                Tipo = "etiquetas_pendientes",
                Mensaje = $"{etiquetasPendientes} etiquetas pendientes de entrega",
                GeneradaEn = DateTime.UtcNow,
                EntidadId = null,
                Accion = "Verificar entregas en pabellón"
            });
        }

        if (lineasConDiferencia > 0)
        {
            alertas.Add(new AlertaDto
            {
                Nivel = "media",
                Tipo = "diferencias_conciliacion",
                Mensaje = $"{lineasConDiferencia} líneas con diferencias en conciliación",
                GeneradaEn = DateTime.UtcNow,
                EntidadId = null,
                Accion = "Revisar conciliación facturación"
            });
        }

        return new DashboardEnfermeraDto
        {
            Kpis = kpis,
            Alertas = alertas,
            Comida = comida,
            Pabellon = pabellon
        };
    }

    public async Task<ReporteNutricionistaDto> ObtenerReporteNutricionistaAsync(FiltrosReportesDto filtros)
    {
        var desde = (filtros.Desde ?? DateTime.Today.AddDays(-30)).Date;
        var hasta = (filtros.Hasta ?? DateTime.Today).Date;
        var hastaExclusivo = hasta.AddDays(1);
        var diasPeriodo = ContarDiasPeriodo(desde, hasta);

        var dietasQuery = _context.FilasDietas
            .Include(f => f.TipoDieta)
            .Where(f => f.FechaOperativa >= desde && f.FechaOperativa < hastaExclusivo);

        if (TryResolverComidaReporte(filtros, out var comidaFiltro))
            dietasQuery = dietasQuery.Where(f => f.Comida == comidaFiltro);

        var dietas = DeduplicarFilasDashboard(await dietasQuery.ToListAsync());

        if (!string.IsNullOrEmpty(filtros.Servicio))
        {
            dietas = dietas
                .Where(d => DietasReglasNegocio.ResolverServicioClinico(d.Servicio, d.Pabellon) == filtros.Servicio)
                .ToList();
        }

        var totalDietas = dietas.Count;
        var dietasActivas = dietas.Count(d => d.Estado != Domain.Enums.EstadoDieta.Cancelada);

        var ordenesQuery = _context.OrdenesCocina
            .Where(o => o.FechaOperativa >= desde && o.FechaOperativa < hastaExclusivo);

        if (TryResolverComidaReporte(filtros, out var comidaReporteOrden))
            ordenesQuery = ordenesQuery.Where(o => o.Comida == comidaReporteOrden);

        var ordenes = await ordenesQuery.ToListAsync();
        var totalOrdenes = ordenes.Count;

        // Etiquetas del período (tiempos logísticos)
        var etiquetasQuery = _context.EtiquetasEnfermeria
            .Where(e => e.FechaOperativa >= desde && e.FechaOperativa < hastaExclusivo);

        if (TryResolverComidaReporte(filtros, out var comidaReporteEtiqueta))
            etiquetasQuery = etiquetasQuery.Where(e => e.Comida == comidaReporteEtiqueta);

        var etiquetas = await etiquetasQuery.ToListAsync();

        var catalogIds = dietas
            .Where(d => d.TipoDietaId.HasValue)
            .Select(d => d.TipoDietaId!.Value)
            .Distinct()
            .ToList();

        var tarifas = catalogIds.Count == 0
            ? new List<Domain.Entities.DietasCocina.TarifaHistorico>()
            : await _context.TarifasHistorico
                .Where(t => t.Activa && catalogIds.Contains(t.DietaCatalogoId))
                .ToListAsync();

        var dietasConCosto = dietas
            .Where(d => d.Estado != EstadoDieta.Pendiente)
            .Select(d =>
            {
                var monto = ResolverTarifaDieta(tarifas, d.TipoDietaId, d.Comida, d.FechaOperativa);
                return (Dieta: d, Monto: monto);
            })
            .ToList();

        var costoTotal = dietasConCosto
            .Where(x => x.Dieta.Estado != EstadoDieta.Cancelada)
            .Sum(x => x.Monto);
        var costoCancTardia = dietasConCosto
            .Where(x => x.Dieta.CancelacionTardia)
            .Sum(x => x.Monto);

        // KPIs
        var kpis = new List<KpiDto>
        {
            new() { Clave = "total_dietas_periodo", Etiqueta = "Total dietas período", Valor = totalDietas, Formato = "numero", Tendencia = null, Comparacion = null },
            new() { Clave = "dietas_activas_periodo", Etiqueta = "Dietas activas período", Valor = dietasActivas, Formato = "numero", Tendencia = null, Comparacion = null },
            new() { Clave = "ordenes_periodo", Etiqueta = "Órdenes período", Valor = totalOrdenes, Formato = "numero", Tendencia = null, Comparacion = null },
            new() { Clave = "promedio_diario", Etiqueta = "Promedio diario dietas", Valor = Math.Round((decimal)totalDietas / diasPeriodo, 1), Formato = "numero", Tendencia = null, Comparacion = null },
            new() { Clave = "costo_total", Etiqueta = "Costo total", Valor = Math.Round(costoTotal, 2), Formato = "moneda", Tendencia = null, Comparacion = null },
            new() { Clave = "costo_canc_tardia", Etiqueta = "Costo canc. tardía", Valor = Math.Round(costoCancTardia, 2), Formato = "moneda", Tendencia = null, Comparacion = null },
        };

        // Hitos logísticos (promedios en minutos)
        var hitos = ConstruirHitosLogisticos(etiquetas, hasta);

        // Gráfico de dietas por día
        var dietasPorDia = dietas
            .GroupBy(d => d.FechaOperativa.Date)
            .OrderBy(g => g.Key)
            .Select(g => new { Fecha = g.Key.ToString("yyyy-MM-dd"), Cantidad = g.Count() })
            .ToList();

        var estadosDietas = dietas
            .GroupBy(d => EtiquetaEstadoDietaReporte(d))
            .OrderByDescending(g => g.Count())
            .Select(g => new { Categoria = g.Key, Cantidad = g.Count() })
            .ToList();

        var tiposDieta = dietas
            .Where(d => d.TipoDieta != null)
            .GroupBy(d => d.TipoDieta!.Nombre)
            .OrderByDescending(g => g.Count())
            .Take(5)
            .Select(g => (g.Key, g.Count()))
            .ToList();

        var motivosRechazo = AgruparMotivosTop3(etiquetas, EsRechazoAntesEntrega);
        var motivosRecogida = AgruparMotivosTop3(etiquetas, EsRecogidaPostEntrega);

        var distribucionServicio = dietas
            .GroupBy(d => DietasReglasNegocio.ResolverServicioClinico(d.Servicio, d.Pabellon))
            .OrderByDescending(g => g.Count())
            .Take(6)
            .Select(g => (g.Key, g.Count()))
            .ToList();

        var distribucionTurno = dietas
            .GroupBy(d => EtiquetaComidaReporte(d.Comida))
            .OrderByDescending(g => g.Count())
            .Select(g => (g.Key, g.Count()))
            .ToList();

        var costoPorDia = dietasConCosto
            .Where(x => x.Dieta.Estado != EstadoDieta.Cancelada)
            .GroupBy(x => x.Dieta.FechaOperativa.Date)
            .OrderBy(g => g.Key)
            .Select(g => (g.Key.ToString("yyyy-MM-dd"), g.Sum(x => x.Monto)))
            .ToList();

        var costoPorServicio = dietasConCosto
            .Where(x => x.Dieta.Estado != EstadoDieta.Cancelada)
            .GroupBy(x => DietasReglasNegocio.ResolverServicioClinico(x.Dieta.Servicio, x.Dieta.Pabellon))
            .OrderByDescending(g => g.Sum(x => x.Monto))
            .Take(8)
            .Select(g => (g.Key, g.Sum(x => x.Monto)))
            .ToList();

        var costoPorComida = dietasConCosto
            .Where(x => x.Dieta.Estado != EstadoDieta.Cancelada)
            .GroupBy(x => EtiquetaComidaReporte(x.Dieta.Comida))
            .OrderByDescending(g => g.Sum(x => x.Monto))
            .Select(g => (g.Key, g.Sum(x => x.Monto)))
            .ToList();

        var graficos = new List<GraficoDto>
        {
            new()
            {
                Tipo = "linea",
                Titulo = "Dietas por día",
                Categorias = dietasPorDia.Select(d => d.Fecha).ToList(),
                Series = new List<GraficoSerieDto>
                {
                    new() { Etiqueta = "Dietas", Valores = dietasPorDia.Select(d => (decimal)d.Cantidad).ToList() }
                }
            },
            CrearGraficoPie("Estado de dietas", estadosDietas.Select(e => (e.Categoria, e.Cantidad))),
            CrearGraficoBarra("Tipos de dieta principales", tiposDieta),
            CrearGraficoBarra("Rechazos antes de entrega (Top 3)", motivosRechazo),
            CrearGraficoBarra("Recogidas de bandeja (Top 3)", motivosRecogida),
            CrearGraficoBarra("Distribución por servicios", distribucionServicio),
            CrearGraficoBarra("Volumen por comida", distribucionTurno),
            CrearGraficoBarraMoneda("Costo por día", costoPorDia),
            CrearGraficoBarraMoneda("Costo por servicio", costoPorServicio),
            CrearGraficoBarraMoneda("Costo por comida", costoPorComida),
        };

        return new ReporteNutricionistaDto
        {
            Kpis = kpis,
            Hitos = hitos,
            Graficos = graficos,
            Hallazgos = ConstruirHallazgosNutricionista(dietas, etiquetas, desde, hasta),
            Filtros = filtros
        };
    }

    public async Task<ReporteProveedorDto> ObtenerReporteProveedorAsync(FiltrosReportesDto filtros)
    {
        var desde = (filtros.Desde ?? DateTime.Today.AddDays(-30)).Date;
        var hasta = (filtros.Hasta ?? DateTime.Today).Date;
        var hastaExclusivo = hasta.AddDays(1);

        var ordenesQuery = _context.OrdenesCocina
            .Where(o => o.FechaOperativa >= desde && o.FechaOperativa < hastaExclusivo);

        if (TryResolverComidaReporte(filtros, out var comidaReporteOrden))
            ordenesQuery = ordenesQuery.Where(o => o.Comida == comidaReporteOrden);

        var ordenes = await ordenesQuery.ToListAsync();
        var totalOrdenes = ordenes.Count;
        var ordenesCompletadas = ordenes.Count(o => o.Estado == "Completada");

        // Etiquetas
        var etiquetasQuery = _context.EtiquetasEnfermeria
            .Where(e => e.FechaOperativa >= desde && e.FechaOperativa < hastaExclusivo);

        if (TryResolverComidaReporte(filtros, out var comidaReporteEtiqueta))
            etiquetasQuery = etiquetasQuery.Where(e => e.Comida == comidaReporteEtiqueta);

        var etiquetas = await etiquetasQuery.ToListAsync();
        var totalEtiquetas = etiquetas.Count;
        var etiquetasEntregadas = etiquetas.Count(e => e.EntregadaEn != null);

        var dietasQuery = _context.FilasDietas
            .Include(f => f.TipoDieta)
            .Where(f => f.FechaOperativa >= desde && f.FechaOperativa < hastaExclusivo);

        if (TryResolverComidaReporte(filtros, out var comidaReporteDieta))
            dietasQuery = dietasQuery.Where(f => f.Comida == comidaReporteDieta);

        var dietas = DeduplicarFilasDashboard(await dietasQuery.ToListAsync());

        if (!string.IsNullOrWhiteSpace(filtros.Servicio) &&
            !string.Equals(filtros.Servicio, "todos", StringComparison.OrdinalIgnoreCase))
        {
            dietas = dietas
                .Where(d => DietasReglasNegocio.ResolverServicioClinico(d.Servicio, d.Pabellon) == filtros.Servicio)
                .ToList();
        }

        var catalogIds = dietas
            .Where(d => d.TipoDietaId.HasValue)
            .Select(d => d.TipoDietaId!.Value)
            .Distinct()
            .ToList();

        var tarifas = catalogIds.Count == 0
            ? new List<Domain.Entities.DietasCocina.TarifaHistorico>()
            : await _context.TarifasHistorico
                .Where(t => t.Activa && catalogIds.Contains(t.DietaCatalogoId))
                .ToListAsync();

        // Costos: raciones con solicitud (no pendientes) × tarifa vigente; retrasos = cancelación tardía.
        var dietasFacturables = dietas
            .Where(d => d.Estado != EstadoDieta.Pendiente)
            .Select(d =>
            {
                var monto = ResolverTarifaDieta(tarifas, d.TipoDietaId, d.Comida, d.FechaOperativa);
                return (Dieta: d, Monto: monto);
            })
            .ToList();

        var costoProduccion = dietasFacturables
            .Where(x => x.Dieta.Estado != EstadoDieta.Cancelada)
            .Sum(x => x.Monto);

        var costoRetrasos = dietasFacturables
            .Where(x => x.Dieta.CancelacionTardia)
            .Sum(x => x.Monto);

        // KPIs
        var kpis = new List<KpiDto>
        {
            new() { Clave = "ordenes_periodo", Etiqueta = "Órdenes período", Valor = totalOrdenes, Formato = "numero", Tendencia = null, Comparacion = null },
            new() { Clave = "ordenes_completadas_periodo", Etiqueta = "Órdenes completadas período", Valor = ordenesCompletadas, Formato = "numero", Tendencia = null, Comparacion = null },
            new() { Clave = "etiquetas_periodo", Etiqueta = "Etiquetas período", Valor = totalEtiquetas, Formato = "numero", Tendencia = null, Comparacion = null },
            new() { Clave = "etiquetas_entregadas_periodo", Etiqueta = "Etiquetas entregadas período", Valor = etiquetasEntregadas, Formato = "numero", Tendencia = null, Comparacion = null },
            new() { Clave = "porcentaje_cumplimiento", Etiqueta = "% Cumplimiento entregas", Valor = totalEtiquetas > 0 ? Math.Round((decimal)etiquetasEntregadas / totalEtiquetas * 100, 1) : 0, Formato = "porcentaje", Tendencia = null, Comparacion = null },
            new() { Clave = "costo_produccion", Etiqueta = "Costo producción", Valor = Math.Round(costoProduccion, 2), Formato = "moneda", Tendencia = null, Comparacion = null },
            new() { Clave = "costo_retrasos", Etiqueta = "Costo por retrasos", Valor = Math.Round(costoRetrasos, 2), Formato = "moneda", Tendencia = null, Comparacion = null },
        };

        // Hallazgos
        var hallazgos = new List<HallazgoDto>();

        var ordenesPendientes = totalOrdenes - ordenesCompletadas;
        if (ordenesPendientes > 0)
        {
            hallazgos.Add(new HallazgoDto
            {
                Tipo = "ordenes_pendientes",
                Descripcion = "Órdenes pendientes de completar",
                Severidad = ordenesPendientes > 20 ? "alta" : "media",
                Cantidad = ordenesPendientes
            });
        }

        var etiquetasPendientes = totalEtiquetas - etiquetasEntregadas;
        if (etiquetasPendientes > 0)
        {
            hallazgos.Add(new HallazgoDto
            {
                Tipo = "etiquetas_pendientes",
                Descripcion = "Etiquetas pendientes de entrega",
                Severidad = etiquetasPendientes > 10 ? "alta" : "media",
                Cantidad = etiquetasPendientes
            });
        }

        if (costoRetrasos > 0)
        {
            hallazgos.Add(new HallazgoDto
            {
                Tipo = "costo_retrasos",
                Descripcion = "Costo asociado a cancelaciones tardías",
                Severidad = costoRetrasos > costoProduccion * 0.1m ? "alta" : "media",
                Cantidad = dietasFacturables.Count(x => x.Dieta.CancelacionTardia)
            });
        }

        // Gráficos operativos
        var estadosOrdenes = ordenes
            .GroupBy(o => EtiquetaEstadoOrdenReporte(o.Estado))
            .OrderByDescending(g => g.Count())
            .Select(g => (g.Key, g.Count()))
            .ToList();

        var tiposDieta = dietas
            .Where(d => d.TipoDieta != null)
            .GroupBy(d => d.TipoDieta!.Nombre)
            .OrderByDescending(g => g.Count())
            .Take(5)
            .Select(g => (g.Key, g.Count()))
            .ToList();

        var motivosRechazo = AgruparMotivosTop3(etiquetas, EsRechazoAntesEntrega);
        var motivosRecogida = AgruparMotivosTop3(etiquetas, EsRecogidaPostEntrega);

        var distribucionTurno = dietas
            .GroupBy(d => EtiquetaComidaReporte(d.Comida))
            .OrderByDescending(g => g.Count())
            .Select(g => (g.Key, g.Count()))
            .ToList();

        var cumplimientoDiario = ordenes
            .GroupBy(o => o.FechaOperativa.Date)
            .OrderBy(g => g.Key)
            .Select(g => new
            {
                Fecha = g.Key.ToString("yyyy-MM-dd"),
                Porcentaje = g.Count() > 0 ? Math.Round((decimal)g.Count(o => o.Estado == "Completada") / g.Count() * 100, 1) : 0
            })
            .ToList();

        var costoPorDia = dietasFacturables
            .Where(x => x.Dieta.Estado != EstadoDieta.Cancelada)
            .GroupBy(x => x.Dieta.FechaOperativa.Date)
            .OrderBy(g => g.Key)
            .Select(g => (g.Key.ToString("yyyy-MM-dd"), g.Sum(x => x.Monto)))
            .ToList();

        var costoPorServicio = dietasFacturables
            .Where(x => x.Dieta.Estado != EstadoDieta.Cancelada)
            .GroupBy(x => DietasReglasNegocio.ResolverServicioClinico(x.Dieta.Servicio, x.Dieta.Pabellon))
            .OrderByDescending(g => g.Sum(x => x.Monto))
            .Take(8)
            .Select(g => (g.Key, g.Sum(x => x.Monto)))
            .ToList();

        var costoPorComida = dietasFacturables
            .Where(x => x.Dieta.Estado != EstadoDieta.Cancelada)
            .GroupBy(x => EtiquetaComidaReporte(x.Dieta.Comida))
            .OrderByDescending(g => g.Sum(x => x.Monto))
            .Select(g => (g.Key, g.Sum(x => x.Monto)))
            .ToList();

        var graficos = new List<GraficoDto>
        {
            CrearGraficoPie("Estado de órdenes", estadosOrdenes),
            CrearGraficoBarra("Tipos de dieta producidos", tiposDieta),
            CrearGraficoBarra("Rechazos antes de entrega (Top 3)", motivosRechazo),
            CrearGraficoBarra("Recogidas de bandeja (Top 3)", motivosRecogida),
            CrearGraficoBarra("Volumen por comida", distribucionTurno),
            new()
            {
                Tipo = "barra",
                Titulo = "Cumplimiento diario (%)",
                Categorias = cumplimientoDiario.Select(c => c.Fecha).ToList(),
                Series = new List<GraficoSerieDto>
                {
                    new() { Etiqueta = "% Completadas", Valores = cumplimientoDiario.Select(c => c.Porcentaje).ToList() }
                }
            },
            CrearGraficoBarraMoneda("Costo por día", costoPorDia),
            CrearGraficoBarraMoneda("Costo por servicio", costoPorServicio),
            CrearGraficoBarraMoneda("Costo por comida", costoPorComida),
        };

        var hitos = ConstruirHitosLogisticos(etiquetas, hasta);

        return new ReporteProveedorDto
        {
            Kpis = kpis,
            Hitos = hitos,
            Hallazgos = hallazgos,
            Graficos = graficos,
            Filtros = filtros
        };
    }
}
