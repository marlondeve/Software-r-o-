using System.Globalization;
using Bital.Application.DTOs.DietasCocina;
using Bital.Application.Interfaces;
using Bital.Domain.Entities.DietasCocina;
using Bital.Domain.Enums;
using Bital.Infrastructure.Data;
using Bital.Infrastructure.DietasCocina;
using Microsoft.EntityFrameworkCore;
using MiniExcelLibs;

namespace Bital.Infrastructure.Services;

public class CocinaReporteService : ICocinaReporteService
{
    private readonly BitalNegocioDbContext _context;

    public CocinaReporteService(BitalNegocioDbContext context)
    {
        _context = context;
    }

    public async Task<byte[]> GenerarReporteExcelAsync(
        FiltrosReporteCocinaDto filtros,
        CancellationToken cancellationToken = default)
    {
        if (!Enum.TryParse<TiempoComida>(filtros.Comida, true, out var tiempoComida))
            throw new ArgumentException($"Tiempo de comida inválido: {filtros.Comida}");

        var fecha = filtros.Fecha.Date;
        var finFecha = fecha.AddDays(1);

        var filas = await _context.FilasDietas
            .Include(f => f.TipoDieta)
            .Where(f => f.FechaOperativa >= fecha
                && f.FechaOperativa < finFecha
                && f.Comida == tiempoComida)
            .OrderBy(f => f.Pabellon)
            .ThenBy(f => f.Habitacion)
            .ThenBy(f => f.Paciente)
            .ToListAsync(cancellationToken);

        var etiquetas = await _context.EtiquetasEnfermeria
            .Where(e => e.FechaOperativa >= fecha
                && e.FechaOperativa < finFecha
                && e.Comida == tiempoComida)
            .ToListAsync(cancellationToken);

        var etiquetasPorFila = etiquetas
            .GroupBy(e => e.FilaDietaId)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(e => e.GeneradaEn).First());

        var ordenIds = filas
            .Where(f => f.OrdenCocinaId.HasValue)
            .Select(f => f.OrdenCocinaId!.Value)
            .Distinct()
            .ToList();

        var numerosOrden = ordenIds.Count == 0
            ? new Dictionary<Guid, int>()
            : await _context.OrdenesCocina
                .Where(o => ordenIds.Contains(o.Id))
                .ToDictionaryAsync(o => o.Id, o => o.NumeroOrden, cancellationToken);

        var filasVisibles = filas
            .Where(ReporteCocinaHelper.EsFilaReporteCocina)
            .Where(f =>
            {
                etiquetasPorFila.TryGetValue(f.Id, out var etiqueta);
                return ReporteCocinaHelper.CoincideFiltros(
                    f,
                    etiqueta,
                    filtros,
                    NumeroOrdenDe(f, numerosOrden));
            })
            // Lo que el proveedor debe producir va primero; las bajas quedan al final.
            .OrderBy(f => f.Estado == EstadoDieta.Cancelada ? 1 : 0)
            .ThenBy(f => f.Pabellon)
            .ThenBy(f => f.Habitacion)
            .ThenBy(f => f.Paciente)
            .ToList();

        var resumen = ConstruirResumen(fecha, tiempoComida, filasVisibles, etiquetasPorFila).ToList();
        var produccion = ConstruirProduccion(filasVisibles).ToList();
        var bandejas = ConstruirBandejas(filasVisibles, etiquetasPorFila, numerosOrden).ToList();

        using var stream = new MemoryStream();
        var sheets = new Dictionary<string, object>
        {
            ["Resumen"] = resumen,
            ["Producción"] = SinFilasVacias(produccion, FilaProduccionVacia),
            ["Bandejas"] = SinFilasVacias(bandejas, FilaBandejaVacia),
        };
        await stream.SaveAsAsync(sheets, cancellationToken: cancellationToken);
        return stream.ToArray();
    }

    /// <summary>
    /// MiniExcel no puede inferir las columnas de una colección vacía: se emite una
    /// fila testigo para que la hoja conserve encabezados y explique el vacío.
    /// </summary>
    private static List<IDictionary<string, object?>> SinFilasVacias(
        List<IDictionary<string, object?>> filas,
        Func<IDictionary<string, object?>> filaTestigo) =>
        filas.Count > 0 ? filas : [filaTestigo()];

    private static int? NumeroOrdenDe(FilaDieta fila, IReadOnlyDictionary<Guid, int> numerosOrden) =>
        fila.OrdenCocinaId.HasValue && numerosOrden.TryGetValue(fila.OrdenCocinaId.Value, out var numero)
            ? numero
            : null;

    private static IEnumerable<IDictionary<string, object?>> ConstruirResumen(
        DateTime fecha,
        TiempoComida comida,
        IReadOnlyList<FilaDieta> filas,
        IReadOnlyDictionary<Guid, EtiquetaEnfermera> etiquetasPorFila)
    {
        var activas = filas.Where(f => f.Estado != EstadoDieta.Cancelada).ToList();
        var canceladas = filas.Count(f => f.Estado == EstadoDieta.Cancelada);
        var salidasClinicas = filas.Count(f =>
            f.Estado == EstadoDieta.Cancelada
            && DietasReglasNegocio.EsObservacionSalidaClinica(f.Observaciones));
        var canceladasManuales = canceladas - salidasClinicas;
        var sostenidas = filas.Count(DietasReglasNegocio.EsSalidaClinicaSostenida);
        var enGestion = filas.Count(f =>
            f.Estado is EstadoDieta.Confirmada or EstadoDieta.EnPreparacion);
        var listas = filas.Count(f => f.Estado == EstadoDieta.ListaEnvio);
        var enTransito = filas.Count(f =>
        {
            etiquetasPorFila.TryGetValue(f.Id, out var etiqueta);
            return ReporteCocinaHelper.OrdenEnTransito(f, etiqueta);
        });

        yield return FilaResumen("Fecha operativa", fecha.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture));
        yield return FilaResumen("Comida", ReporteCocinaHelper.EtiquetaComida(comida));
        yield return FilaResumen(
            "Generado",
            HorarioOperativoHelper.AhoraColombia().ToString("yyyy-MM-dd HH:mm", CultureInfo.InvariantCulture));
        yield return FilaResumen("Total bandejas activas", activas.Count.ToString(CultureInfo.InvariantCulture));
        yield return FilaResumen("En gestión", enGestion.ToString(CultureInfo.InvariantCulture));
        yield return FilaResumen("Listas", listas.ToString(CultureInfo.InvariantCulture));
        yield return FilaResumen("En tránsito", enTransito.ToString(CultureInfo.InvariantCulture));
        yield return FilaResumen("Bandejas con aislamiento", activas.Count(f => f.Aislado).ToString(CultureInfo.InvariantCulture));
        yield return FilaResumen("Bandejas con alergias", activas.Count(f => f.Alergico).ToString(CultureInfo.InvariantCulture));
        yield return FilaResumen("Salidas clínicas", salidasClinicas.ToString(CultureInfo.InvariantCulture));
        yield return FilaResumen("Canceladas", canceladasManuales.ToString(CultureInfo.InvariantCulture));
        yield return FilaResumen("Salidas clínicas sostenidas", sostenidas.ToString(CultureInfo.InvariantCulture));
    }

    private static IDictionary<string, object?> FilaResumen(string indicador, string valor) =>
        new Dictionary<string, object?>
        {
            ["Indicador"] = indicador,
            ["Valor"] = valor,
        };

    /// <summary>
    /// Conteos por tipo de dieta y consistencia: es lo que cocina usa para producir.
    /// Solo bandejas activas — una cancelada no se prepara.
    /// </summary>
    private static IEnumerable<IDictionary<string, object?>> ConstruirProduccion(
        IReadOnlyList<FilaDieta> filas)
    {
        var activas = filas.Where(f => f.Estado != EstadoDieta.Cancelada).ToList();

        var grupos = activas
            .GroupBy(f => new
            {
                TipoDieta = ReporteCocinaHelper.NombreTipoDieta(f),
                Consistencia = ReporteCocinaHelper.EtiquetaConsistencia(f),
            })
            .OrderBy(g => g.Key.TipoDieta, StringComparer.CurrentCulture)
            .ThenBy(g => g.Key.Consistencia, StringComparer.CurrentCulture);

        foreach (var grupo in grupos)
        {
            yield return new Dictionary<string, object?>
            {
                ["Tipo dieta"] = grupo.Key.TipoDieta,
                ["Consistencia"] = grupo.Key.Consistencia,
                ["Bandejas"] = grupo.Count(),
                ["Con aislamiento"] = grupo.Count(f => f.Aislado),
                ["Con alergias"] = grupo.Count(f => f.Alergico),
            };
        }

        if (activas.Count > 0)
        {
            yield return new Dictionary<string, object?>
            {
                ["Tipo dieta"] = "TOTAL",
                ["Consistencia"] = string.Empty,
                ["Bandejas"] = activas.Count,
                ["Con aislamiento"] = activas.Count(f => f.Aislado),
                ["Con alergias"] = activas.Count(f => f.Alergico),
            };
        }
    }

    private static IDictionary<string, object?> FilaProduccionVacia() =>
        new Dictionary<string, object?>
        {
            ["Tipo dieta"] = "Sin bandejas activas para los filtros seleccionados",
            ["Consistencia"] = string.Empty,
            ["Bandejas"] = 0,
            ["Con aislamiento"] = 0,
            ["Con alergias"] = 0,
        };

    private static IEnumerable<IDictionary<string, object?>> ConstruirBandejas(
        IReadOnlyList<FilaDieta> filas,
        IReadOnlyDictionary<Guid, EtiquetaEnfermera> etiquetasPorFila,
        IReadOnlyDictionary<Guid, int> numerosOrden)
    {
        foreach (var fila in filas)
        {
            etiquetasPorFila.TryGetValue(fila.Id, out var etiqueta);
            var numeroOrden = NumeroOrdenDe(fila, numerosOrden);
            yield return ConstruirFilaBandeja(
                fila,
                etiqueta,
                numeroOrden?.ToString(CultureInfo.InvariantCulture) ?? string.Empty);
        }
    }

    private static IDictionary<string, object?> ConstruirFilaBandeja(
        FilaDieta fila,
        EtiquetaEnfermera? etiqueta,
        string numeroOrden)
    {
        var cancelacionPorSalida =
            fila.Estado == EstadoDieta.Cancelada
            && DietasReglasNegocio.EsObservacionSalidaClinica(fila.Observaciones);

        return new Dictionary<string, object?>
        {
            ["Estado"] = ReporteCocinaHelper.EtiquetaEstadoVisible(fila, etiqueta),
            ["Seguimiento"] = ReporteCocinaHelper.EtiquetaSeguimiento(fila, etiqueta),
            ["Pabellón"] = fila.Pabellon,
            ["Habitación"] = fila.Habitacion,
            ["Servicio"] = DietasReglasNegocio.ResolverServicioClinico(fila.Servicio, fila.Pabellon),
            ["Paciente"] = fila.Paciente,
            ["Documento"] = fila.Cedula ?? fila.PacienteId,
            ["Edad"] = fila.Edad,
            ["Tipo dieta"] = ReporteCocinaHelper.NombreTipoDieta(fila),
            ["Consistencia"] = ReporteCocinaHelper.EtiquetaConsistencia(fila),
            ["Aislamiento"] = fila.Aislado
                ? (string.IsNullOrWhiteSpace(fila.ObservacionAislamiento)
                    ? "Sí"
                    : fila.ObservacionAislamiento.Trim())
                : "No",
            ["Alergias"] = fila.Alergico
                ? (string.IsNullOrWhiteSpace(fila.Alergias) ? "Sí" : fila.Alergias.Trim())
                : "No",
            ["Alertas"] = ReporteCocinaHelper.ConstruirAlertas(fila),
            ["Observaciones"] = fila.Observaciones ?? string.Empty,
            ["Código etiqueta"] = etiqueta?.Codigo ?? string.Empty,
            ["Etiqueta impresa"] = etiqueta?.ImpresaEn.HasValue == true ? "Sí" : "No",
            ["Salida clínica sostenida"] = DietasReglasNegocio.EsSalidaClinicaSostenida(fila) ? "Sí" : "No",
            ["Cancelación por salida clínica"] = cancelacionPorSalida ? "Sí" : "No",
            ["Cancelación tardía"] = fila.CancelacionTardia ? "Sí" : "No",
            ["Solicitado por"] = fila.SolicitadoPor ?? string.Empty,
            ["Solicitado en"] = FormatearFecha(fila.SolicitadoEn),
            ["Nº orden cocina"] = numeroOrden,
        };
    }

    private static IDictionary<string, object?> FilaBandejaVacia()
    {
        var vacia = new Dictionary<string, object?>();
        var primera = true;
        foreach (var clave in ConstruirFilaBandeja(new FilaDieta(), null, string.Empty).Keys)
        {
            vacia[clave] = primera ? "Sin bandejas para los filtros seleccionados" : string.Empty;
            primera = false;
        }
        return vacia;
    }

    private static string FormatearFecha(DateTime? fecha) =>
        fecha?.ToString("yyyy-MM-dd HH:mm", CultureInfo.InvariantCulture) ?? string.Empty;
}
