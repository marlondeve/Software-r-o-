using Bital.Application.DTOs.DietasCocina;
using MiniExcelLibs;

namespace Bital.Infrastructure.DietasCocina;

/// <summary>
/// Exporta reportes analíticos (nutricionista / proveedor) a Excel multi-hoja.
/// </summary>
public static class ReporteDashboardExcelExport
{
    public static async Task<byte[]> GenerarAsync(
        string tituloReporte,
        FiltrosReportesDto filtros,
        IReadOnlyList<KpiDto> kpis,
        IReadOnlyList<HitoReporteDto> hitos,
        IReadOnlyList<GraficoDto> graficos,
        IReadOnlyList<HallazgoDto> hallazgos,
        CancellationToken cancellationToken = default)
    {
        var desde = filtros.Desde?.Date;
        var hasta = filtros.Hasta?.Date;
        var periodo = desde.HasValue && hasta.HasValue
            ? desde.Value == hasta.Value
                ? desde.Value.ToString("yyyy-MM-dd")
                : $"{desde:yyyy-MM-dd} a {hasta:yyyy-MM-dd}"
            : "—";

        var resumen = new List<IDictionary<string, object?>>
        {
            FilaResumen("Reporte", tituloReporte),
            FilaResumen("Periodo", periodo),
            FilaResumen("Servicio", string.IsNullOrWhiteSpace(filtros.Servicio) ? "Todos" : filtros.Servicio),
            FilaResumen("Horario", string.IsNullOrWhiteSpace(filtros.Horario) ? "Todos" : filtros.Horario),
            FilaResumen("Comida (filtro API)", string.IsNullOrWhiteSpace(filtros.Comida) ? "Todos" : filtros.Comida),
            FilaResumen("Generado (UTC)", DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm")),
        };

        var indicadores = kpis.Select(k => new Dictionary<string, object?>
        {
            ["Indicador"] = k.Etiqueta,
            ["Clave"] = k.Clave,
            ["Valor"] = k.Valor,
            ["Formato"] = k.Formato,
            ["Comparación / nota"] = k.Comparacion ?? "",
        }).ToList<IDictionary<string, object?>>();

        var planilla = ConstruirPlanillaFcr(graficos);
        var hallazgosFilas = hallazgos.Select(h => new Dictionary<string, object?>
        {
            ["Tipo"] = h.Tipo,
            ["Descripción"] = h.Descripcion,
            ["Severidad"] = h.Severidad,
            ["Cantidad"] = h.Cantidad,
        }).ToList<IDictionary<string, object?>>();

        var logistica = hitos.Select(h => new Dictionary<string, object?>
        {
            ["Fecha"] = h.Fecha.ToString("yyyy-MM-dd"),
            ["Evento"] = h.Evento,
            ["Detalle"] = h.Detalle,
        }).ToList<IDictionary<string, object?>>();

        var datosGraficos = ConstruirDatosGraficos(graficos);

        using var stream = new MemoryStream();
        var sheets = new Dictionary<string, object>
        {
            ["Resumen"] = resumen,
            ["Indicadores"] = SinFilasVacias(indicadores, FilaIndicadorVacia),
            ["Planilla FCR"] = SinFilasVacias(planilla, FilaPlanillaVacia),
            ["Hallazgos"] = SinFilasVacias(hallazgosFilas, FilaHallazgoVacia),
            ["Logística"] = SinFilasVacias(logistica, FilaLogisticaVacia),
            ["Datos gráficos"] = SinFilasVacias(datosGraficos, FilaGraficoVacia),
        };
        await stream.SaveAsAsync(sheets, cancellationToken: cancellationToken);
        return stream.ToArray();
    }

    private static List<IDictionary<string, object?>> ConstruirPlanillaFcr(IReadOnlyList<GraficoDto> graficos)
    {
        var filas = new List<IDictionary<string, object?>>();
        foreach (var grafico in graficos.Where(g =>
                     string.Equals(g.Tipo, "tabla-contrato", StringComparison.OrdinalIgnoreCase)))
        {
            var suministradas = ValoresSerie(grafico, "Suministradas");
            var tarifas = ValoresSerie(grafico, "Contrato");
            var totales = ValoresSerie(grafico, "ValorTotal");
            for (var i = 0; i < grafico.Categorias.Count; i++)
            {
                filas.Add(new Dictionary<string, object?>
                {
                    ["Sección"] = grafico.Titulo,
                    ["Línea planilla"] = grafico.Categorias[i],
                    ["Suministradas"] = ValorEn(suministradas, i),
                    ["Tarifa contrato"] = ValorEn(tarifas, i),
                    ["Valor total"] = ValorEn(totales, i),
                });
            }
        }

        return filas;
    }

    private static List<IDictionary<string, object?>> ConstruirDatosGraficos(IReadOnlyList<GraficoDto> graficos)
    {
        var filas = new List<IDictionary<string, object?>>();
        foreach (var grafico in graficos.Where(g =>
                     !string.Equals(g.Tipo, "tabla-contrato", StringComparison.OrdinalIgnoreCase)))
        {
            for (var i = 0; i < grafico.Categorias.Count; i++)
            {
                foreach (var serie in grafico.Series)
                {
                    filas.Add(new Dictionary<string, object?>
                    {
                        ["Gráfico"] = grafico.Titulo,
                        ["Tipo"] = grafico.Tipo,
                        ["Categoría"] = grafico.Categorias[i],
                        ["Serie"] = serie.Etiqueta,
                        ["Valor"] = ValorEn(serie.Valores, i),
                    });
                }
            }
        }

        return filas;
    }

    private static IReadOnlyList<decimal> ValoresSerie(GraficoDto grafico, string etiqueta) =>
        grafico.Series.FirstOrDefault(s =>
            string.Equals(s.Etiqueta, etiqueta, StringComparison.OrdinalIgnoreCase))?.Valores
        ?? [];

    private static decimal ValorEn(IReadOnlyList<decimal> valores, int indice) =>
        indice >= 0 && indice < valores.Count ? valores[indice] : 0m;

    private static IDictionary<string, object?> FilaResumen(string indicador, object? valor) =>
        new Dictionary<string, object?>
        {
            ["Indicador"] = indicador,
            ["Valor"] = valor,
        };

    private static List<IDictionary<string, object?>> SinFilasVacias(
        List<IDictionary<string, object?>> filas,
        Func<IDictionary<string, object?>> filaTestigo) =>
        filas.Count > 0 ? filas : [filaTestigo()];

    private static IDictionary<string, object?> FilaIndicadorVacia() =>
        new Dictionary<string, object?>
        {
            ["Indicador"] = "Sin indicadores para los filtros aplicados",
            ["Clave"] = string.Empty,
            ["Valor"] = 0m,
            ["Formato"] = string.Empty,
            ["Comparación / nota"] = string.Empty,
        };

    private static IDictionary<string, object?> FilaPlanillaVacia() =>
        new Dictionary<string, object?>
        {
            ["Sección"] = string.Empty,
            ["Línea planilla"] = "Sin datos de planilla FCR para el periodo",
            ["Suministradas"] = 0m,
            ["Tarifa contrato"] = 0m,
            ["Valor total"] = 0m,
        };

    private static IDictionary<string, object?> FilaHallazgoVacia() =>
        new Dictionary<string, object?>
        {
            ["Tipo"] = string.Empty,
            ["Descripción"] = "Sin hallazgos registrados",
            ["Severidad"] = string.Empty,
            ["Cantidad"] = 0,
        };

    private static IDictionary<string, object?> FilaLogisticaVacia() =>
        new Dictionary<string, object?>
        {
            ["Fecha"] = string.Empty,
            ["Evento"] = "Sin hitos logísticos en el periodo",
            ["Detalle"] = string.Empty,
        };

    private static IDictionary<string, object?> FilaGraficoVacia() =>
        new Dictionary<string, object?>
        {
            ["Gráfico"] = "Sin series de gráficos para exportar",
            ["Tipo"] = string.Empty,
            ["Categoría"] = string.Empty,
            ["Serie"] = string.Empty,
            ["Valor"] = 0m,
        };
}
