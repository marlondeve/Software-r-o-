using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Bital.Application.DTOs.DietasCocina;
using Bital.Application.Interfaces;
using Bital.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Bital.Infrastructure.Services;

public class DashboardService : IDashboardService
{
    private readonly BitalNegocioDbContext _context;

    public DashboardService(BitalNegocioDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardNutricionistaDto> ObtenerDashboardNutricionistaAsync(DateTime? fecha, string? comida)
    {
        var fechaOperativa = fecha ?? DateTime.Today;

        // Query base de dietas del día
        var dietasQuery = _context.FilasDietas
            .Where(f => f.FechaOperativa.Date == fechaOperativa.Date);

        if (!string.IsNullOrEmpty(comida))
            dietasQuery = dietasQuery.Where(f => f.Comida.ToString() == comida);

        var dietas = await dietasQuery.ToListAsync();
        var totalDietas = dietas.Count;
        var dietasActivas = dietas.Count(d => d.Estado != Domain.Enums.EstadoDieta.Cancelada);

        // Órdenes del día
        var ordenesQuery = _context.OrdenesCocina
            .Where(o => o.FechaOperativa.Date == fechaOperativa.Date);

        if (!string.IsNullOrEmpty(comida))
            ordenesQuery = ordenesQuery.Where(o => o.Comida.ToString() == comida);

        var ordenes = await ordenesQuery.ToListAsync();
        var ordenesGeneradas = ordenes.Count;
        var ordenesCompletadas = ordenes.Count(o => o.Estado == "Completada");

        // Etiquetas generadas hoy
        var etiquetasQuery = _context.EtiquetasEnfermeria
            .Where(e => e.GeneradaEn.Date == fechaOperativa.Date);

        if (!string.IsNullOrEmpty(comida))
            etiquetasQuery = etiquetasQuery.Where(e => e.Comida.ToString() == comida);

        var etiquetas = await etiquetasQuery.CountAsync();

        // KPIs
        var kpis = new List<KpiDto>
        {
            new() { Clave = "total_dietas", Etiqueta = "Total dietas", Valor = totalDietas, Formato = "numero", Tendencia = null, Comparacion = null },
            new() { Clave = "dietas_activas", Etiqueta = "Dietas activas", Valor = dietasActivas, Formato = "numero", Tendencia = null, Comparacion = null },
            new() { Clave = "ordenes_generadas", Etiqueta = "Órdenes generadas", Valor = ordenesGeneradas, Formato = "numero", Tendencia = null, Comparacion = null },
            new() { Clave = "ordenes_completadas", Etiqueta = "Órdenes completadas", Valor = ordenesCompletadas, Formato = "numero", Tendencia = null, Comparacion = null },
            new() { Clave = "etiquetas_generadas", Etiqueta = "Etiquetas generadas", Valor = etiquetas, Formato = "numero", Tendencia = null, Comparacion = null },
            new() { Clave = "porcentaje_ordenes_completadas", Etiqueta = "% Órdenes completadas", Valor = ordenesGeneradas > 0 ? Math.Round((decimal)ordenesCompletadas / ordenesGeneradas * 100, 1) : 0, Formato = "porcentaje", Tendencia = null, Comparacion = null }
        };

        // Distribución por tipo de dieta
        var distribucionDietas = totalDietas > 0
            ? dietas
                .Where(d => d.TipoDieta != null)
                .GroupBy(d => d.TipoDieta!.ToString())
                .Select(g => new DistribucionItemDto
                {
                    Categoria = g.Key,
                    Cantidad = g.Count(),
                    Porcentaje = Math.Round((decimal)g.Count() / totalDietas * 100, 1)
                })
                .ToList()
            : new List<DistribucionItemDto>();

        // Distribución por servicio
        var distribucionServicios = totalDietas > 0
            ? dietas
                .GroupBy(d => d.Servicio ?? "Sin servicio")
                .Select(g => new DistribucionItemDto
                {
                    Categoria = g.Key,
                    Cantidad = g.Count(),
                    Porcentaje = Math.Round((decimal)g.Count() / totalDietas * 100, 1)
                })
                .ToList()
            : new List<DistribucionItemDto>();

        var distribuciones = new List<DistribucionDto>
        {
            new() { Tipo = "dietas", Items = distribucionDietas },
            new() { Tipo = "servicios", Items = distribucionServicios }
        };

        // Actividad reciente (últimas 10 operaciones de trazabilidad del día)
        var actividad = await _context.EventosTrazabilidad
            .Where(e => e.FechaEvento.Date == fechaOperativa.Date)
            .OrderByDescending(e => e.FechaEvento)
            .Take(10)
            .Select(e => new ActividadDto
            {
                Timestamp = e.FechaEvento,
                Tipo = e.TipoEvento,
                Usuario = e.Usuario,
                Descripcion = e.Descripcion,
                Entidad = "FilaDieta",
                EntidadId = e.FilaDietaId.ToString()
            })
            .ToListAsync();

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

        if (!string.IsNullOrEmpty(comida))
            ordenesQuery = ordenesQuery.Where(o => o.Comida.ToString() == comida);

        var ordenes = await ordenesQuery.ToListAsync();
        var totalOrdenes = ordenes.Count;
        var ordenesCompletadas = ordenes.Count(o => o.Estado == "Completada");
        var porcentajeProgreso = totalOrdenes > 0 ? Math.Round((decimal)ordenesCompletadas / totalOrdenes * 100, 1) : 0;

        // Etiquetas generadas
        var etiquetasQuery = _context.EtiquetasEnfermeria
            .Where(e => e.GeneradaEn.Date == fechaHoy);

        if (!string.IsNullOrEmpty(comida))
            etiquetasQuery = etiquetasQuery.Where(e => e.Comida.ToString() == comida);

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

        if (!string.IsNullOrEmpty(comida))
            etiquetasQuery = etiquetasQuery.Where(e => e.Comida.ToString() == comida);

        if (!string.IsNullOrEmpty(pabellon))
            etiquetasQuery = etiquetasQuery.Where(e => e.FilaDieta != null && e.FilaDieta.Servicio == pabellon);

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
        var desde = filtros.Desde ?? DateTime.Today.AddDays(-30);
        var hasta = filtros.Hasta ?? DateTime.Today;

        // Dietas en el rango
        var dietasQuery = _context.FilasDietas
            .Where(f => f.FechaOperativa >= desde && f.FechaOperativa <= hasta);

        if (!string.IsNullOrEmpty(filtros.Servicio))
            dietasQuery = dietasQuery.Where(f => f.Servicio == filtros.Servicio);

        if (!string.IsNullOrEmpty(filtros.Comida))
            dietasQuery = dietasQuery.Where(f => f.Comida.ToString() == filtros.Comida);

        var dietas = await dietasQuery.ToListAsync();
        var totalDietas = dietas.Count;
        var dietasActivas = dietas.Count(d => d.Estado != Domain.Enums.EstadoDieta.Cancelada);

        // Órdenes
        var ordenesQuery = _context.OrdenesCocina
            .Where(o => o.FechaOperativa >= desde && o.FechaOperativa <= hasta);

        if (!string.IsNullOrEmpty(filtros.Comida))
            ordenesQuery = ordenesQuery.Where(o => o.Comida.ToString() == filtros.Comida);

        var ordenes = await ordenesQuery.ToListAsync();
        var totalOrdenes = ordenes.Count;

        // KPIs
        var kpis = new List<KpiDto>
        {
            new() { Clave = "total_dietas_periodo", Etiqueta = "Total dietas período", Valor = totalDietas, Formato = "numero", Tendencia = null, Comparacion = null },
            new() { Clave = "dietas_activas_periodo", Etiqueta = "Dietas activas período", Valor = dietasActivas, Formato = "numero", Tendencia = null, Comparacion = null },
            new() { Clave = "ordenes_periodo", Etiqueta = "Órdenes período", Valor = totalOrdenes, Formato = "numero", Tendencia = null, Comparacion = null },
            new() { Clave = "promedio_diario", Etiqueta = "Promedio diario dietas", Valor = (hasta - desde).Days > 0 ? Math.Round((decimal)totalDietas / (hasta - desde).Days, 1) : 0, Formato = "numero", Tendencia = null, Comparacion = null }
        };

        // Hitos
        var hitos = new List<HitoReporteDto>
        {
            new() { Fecha = desde, Evento = "Inicio período", Detalle = $"Reporte generado desde {desde:yyyy-MM-dd}" },
            new() { Fecha = hasta, Evento = "Fin período", Detalle = $"Reporte generado hasta {hasta:yyyy-MM-dd}" }
        };

        // Gráfico de dietas por día
        var dietasPorDia = dietas
            .GroupBy(d => d.FechaOperativa.Date)
            .OrderBy(g => g.Key)
            .Select(g => new { Fecha = g.Key.ToString("yyyy-MM-dd"), Cantidad = g.Count() })
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
            }
        };

        return new ReporteNutricionistaDto
        {
            Kpis = kpis,
            Hitos = hitos,
            Graficos = graficos,
            Filtros = filtros
        };
    }

    public async Task<ReporteProveedorDto> ObtenerReporteProveedorAsync(FiltrosReportesDto filtros)
    {
        var desde = filtros.Desde ?? DateTime.Today.AddDays(-30);
        var hasta = filtros.Hasta ?? DateTime.Today;

        // Órdenes
        var ordenesQuery = _context.OrdenesCocina
            .Where(o => o.FechaOperativa >= desde && o.FechaOperativa <= hasta);

        if (!string.IsNullOrEmpty(filtros.Comida))
            ordenesQuery = ordenesQuery.Where(o => o.Comida.ToString() == filtros.Comida);

        var ordenes = await ordenesQuery.ToListAsync();
        var totalOrdenes = ordenes.Count;
        var ordenesCompletadas = ordenes.Count(o => o.Estado == "Completada");

        // Etiquetas
        var etiquetasQuery = _context.EtiquetasEnfermeria
            .Where(e => e.GeneradaEn >= desde && e.GeneradaEn <= hasta);

        if (!string.IsNullOrEmpty(filtros.Comida))
            etiquetasQuery = etiquetasQuery.Where(e => e.Comida.ToString() == filtros.Comida);

        var totalEtiquetas = await etiquetasQuery.CountAsync();
        var etiquetasEntregadas = await etiquetasQuery.CountAsync(e => e.EntregadaEn != null);

        // KPIs
        var kpis = new List<KpiDto>
        {
            new() { Clave = "ordenes_periodo", Etiqueta = "Órdenes período", Valor = totalOrdenes, Formato = "numero", Tendencia = null, Comparacion = null },
            new() { Clave = "ordenes_completadas_periodo", Etiqueta = "Órdenes completadas período", Valor = ordenesCompletadas, Formato = "numero", Tendencia = null, Comparacion = null },
            new() { Clave = "etiquetas_periodo", Etiqueta = "Etiquetas período", Valor = totalEtiquetas, Formato = "numero", Tendencia = null, Comparacion = null },
            new() { Clave = "etiquetas_entregadas_periodo", Etiqueta = "Etiquetas entregadas período", Valor = etiquetasEntregadas, Formato = "numero", Tendencia = null, Comparacion = null },
            new() { Clave = "porcentaje_cumplimiento", Etiqueta = "% Cumplimiento entregas", Valor = totalEtiquetas > 0 ? Math.Round((decimal)etiquetasEntregadas / totalEtiquetas * 100, 1) : 0, Formato = "porcentaje", Tendencia = null, Comparacion = null }
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

        // Gráfico de cumplimiento diario
        var cumplimientoDiario = ordenes
            .GroupBy(o => o.FechaOperativa.Date)
            .OrderBy(g => g.Key)
            .Select(g => new
            {
                Fecha = g.Key.ToString("yyyy-MM-dd"),
                Porcentaje = g.Count() > 0 ? Math.Round((decimal)g.Count(o => o.Estado == "Completada") / g.Count() * 100, 1) : 0
            })
            .ToList();

        var graficos = new List<GraficoDto>
        {
            new()
            {
                Tipo = "barra",
                Titulo = "Cumplimiento diario (%)",
                Categorias = cumplimientoDiario.Select(c => c.Fecha).ToList(),
                Series = new List<GraficoSerieDto>
                {
                    new() { Etiqueta = "% Impresión", Valores = cumplimientoDiario.Select(c => c.Porcentaje).ToList() }
                }
            }
        };

        return new ReporteProveedorDto
        {
            Kpis = kpis,
            Hallazgos = hallazgos,
            Graficos = graficos,
            Filtros = filtros
        };
    }
}
