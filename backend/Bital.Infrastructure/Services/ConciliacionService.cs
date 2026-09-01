using System.Globalization;
using System.Text;
using Bital.Application.DTOs.DietasCocina;
using Bital.Application.Interfaces;
using Bital.Domain.Entities.DietasCocina;
using Bital.Domain.Enums;
using Bital.Infrastructure.Data;
using Bital.Infrastructure.DietasCocina;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Bital.Infrastructure.Services;

public class ConciliacionService : IConciliacionService
{
    private readonly BitalNegocioDbContext _context;
    private readonly IAuditoriaService _auditoria;
    private readonly IAuditoriaContextoRequest _contextoAuditoria;
    private readonly ILogger<ConciliacionService> _logger;
    private readonly IDietasCocinaRealtime _realtime;

    public ConciliacionService(
        BitalNegocioDbContext context,
        IAuditoriaService auditoria,
        IAuditoriaContextoRequest contextoAuditoria,
        ILogger<ConciliacionService> logger,
        IDietasCocinaRealtime? realtime = null)
    {
        _context = context;
        _auditoria = auditoria;
        _contextoAuditoria = contextoAuditoria;
        _logger = logger;
        _realtime = realtime ?? NullDietasCocinaRealtime.Instance;
    }

    public async Task<ListaConciliacionDto> ObtenerConciliacionAsync(
        DateTime? desde = null,
        DateTime? hasta = null,
        string? busqueda = null,
        string? numeroFactura = null,
        string? periodo = null,
        string? estado = null,
        int page = 1,
        int pageSize = 50,
        bool sinPaginar = false,
        CancellationToken cancellationToken = default)
    {
        var (rangoDesde, rangoHasta) = ContratoCocinaHelper.ResolverRango(desde, hasta, periodo);
        var grupos = await ConstruirGruposAsync(rangoDesde, rangoHasta, cancellationToken);
        var lineas = grupos
            .Select(g => FiltrarGrupo(g, busqueda, numeroFactura, estado))
            .Where(x => x != null)
            .Select(x => x!)
            .ToList();

        var total = lineas.Count;
        if (!sinPaginar && pageSize > 0 && pageSize < total)
        {
            var pagina = page < 1 ? 1 : page;
            var tamano = Math.Min(pageSize, 50);
            lineas = lineas.Skip((pagina - 1) * tamano).Take(tamano).ToList();
            return new ListaConciliacionDto
            {
                Data = lineas,
                Meta = PaginacionHelper.CrearMeta(total, pagina, tamano)
            };
        }

        return new ListaConciliacionDto
        {
            Data = lineas,
            Meta = PaginacionHelper.CrearMeta(total, 1, Math.Max(total, 1))
        };
    }

    public async Task<DetalleConciliacionDto> ObtenerDetalleConciliacionAsync(
        Guid id,
        DateTime? desde = null,
        DateTime? hasta = null,
        string? periodo = null,
        CancellationToken cancellationToken = default)
    {
        var persistida = await _context.FilasConciliacion
            .AsNoTracking()
            .FirstOrDefaultAsync(f => f.Id == id, cancellationToken);

        var rangoDesde = persistida is { PeriodoDesde: var pd, PeriodoHasta: var ph } && pd != default && ph != default
            ? pd
            : ContratoCocinaHelper.ResolverRango(desde, hasta, periodo).Desde;
        var rangoHasta = persistida is { PeriodoHasta: var ph2 } && persistida.PeriodoDesde != default && ph2 != default
            ? persistida.PeriodoHasta
            : ContratoCocinaHelper.ResolverRango(desde, hasta, periodo).Hasta;

        var grupos = await ConstruirCorteAsync(rangoDesde, rangoHasta, cancellationToken);
        var grupo = grupos.FirstOrDefault(g => g.Id == id)
            ?? throw new KeyNotFoundException($"Línea de conciliación con ID {id} no encontrada");

        var persistidas = await CargarPersistidasAsync(rangoDesde, rangoHasta, cancellationToken);
        persistidas.TryGetValue(id, out var filaPersistida);
        var linea = MapearGrupo(grupo, filaPersistida);

        var registros = grupo.Bandejas
            .OrderBy(b => b.FechaOperativa)
            .ThenBy(b => b.Paciente)
            .Select(MapearRegistro)
            .ToArray();

        var alertas = registros.SelectMany(r => r.Alertas).Distinct().ToArray();
        var recomendaciones = new List<string>();
        if (linea.CantidadCocina is null)
            recomendaciones.Add("Cargar la planilla de cocina para comparar cantidades.");
        else if (linea.DiferenciaCantidad != 0)
            recomendaciones.Add("Revisar bandejas del detalle: tipo clínico distinto o bandeja extra en el sistema.");
        if (linea.SinEtiqueta > 0)
            recomendaciones.Add("Hay bandejas sin etiqueta; confirmar si cocina las produjo.");

        return new DetalleConciliacionDto
        {
            Linea = linea,
            Registros = registros,
            Alertas = alertas,
            Recomendaciones = recomendaciones.ToArray()
        };
    }

    public async Task<FilaConciliacionDto> MarcarConciliadoAsync(
        Guid id,
        MarcarConciliadoDto datos,
        string usuario,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(datos.Motivo))
            throw new ArgumentException("El motivo es requerido");
        if (string.IsNullOrWhiteSpace(datos.Observaciones) || datos.Observaciones.Trim().Length < 10)
            throw new ArgumentException("Las observaciones deben tener al menos 10 caracteres");

        var fila = await AsegurarFilaAsync(id, cancellationToken);
        var estadoAnterior = fila.Estado;
        fila.Estado = CorteConciliacionFcr.EstadoConciliado;
        fila.Motivo = datos.Motivo.Trim();
        fila.Observaciones = datos.Observaciones.Trim();
        fila.ResueltoPor = usuario;
        fila.ResueltaEn = DateTime.UtcNow;
        fila.ModificadoPor = usuario;
        fila.ModificadoEn = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        Auditar(AuditoriaCatalogo.Acciones.MarcarConciliado, usuario, id,
            new { estado = estadoAnterior },
            new { estado = fila.Estado, datos.Motivo });
        await _realtime.NotificarConciliacionAsync(cancellationToken);
        return MapearPersistida(fila);
    }

    public async Task<FilaConciliacionDto> MarcarPendienteRevisionAsync(
        Guid id,
        MarcarPendienteRevisionDto datos,
        string usuario,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(datos.Motivo))
            throw new ArgumentException("El motivo es requerido");

        var fila = await AsegurarFilaAsync(id, cancellationToken);
        var estadoAnterior = fila.Estado;
        fila.Estado = CorteConciliacionFcr.EstadoEnRevision;
        fila.Motivo = datos.Motivo.Trim();
        fila.Observaciones = datos.Observaciones?.Trim();
        fila.ResueltoPor = usuario;
        fila.ResueltaEn = DateTime.UtcNow;
        fila.ModificadoPor = usuario;
        fila.ModificadoEn = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        Auditar(AuditoriaCatalogo.Acciones.MarcarPendiente, usuario, id,
            new { estado = estadoAnterior },
            new { estado = fila.Estado, datos.Motivo });
        await _realtime.NotificarConciliacionAsync(cancellationToken);
        return MapearPersistida(fila);
    }

    public async Task<List<KpiConciliacionDto>> ObtenerKpisConciliacionAsync(
        DateTime? desde = null,
        DateTime? hasta = null,
        string? periodo = null,
        CancellationToken cancellationToken = default)
    {
        var lista = await ObtenerConciliacionAsync(
            desde, hasta, periodo: periodo, sinPaginar: true, cancellationToken: cancellationToken);
        return CalcularKpis(lista.Data);
    }

    public static List<KpiConciliacionDto> CalcularKpis(IReadOnlyList<FilaConciliacionDto> filas)
    {
        var sistema = filas.Sum(f => f.CantidadSistema);
        var tienePlanilla = filas.Any(f => f.CantidadCocina.HasValue);
        var cocina = filas.Where(f => f.CantidadCocina.HasValue).Sum(f => f.CantidadCocina!.Value);
        var valorSistema = filas.Sum(f => f.ValorSistema);
        var valorCocina = filas.Where(f => f.ValorCocina.HasValue).Sum(f => f.ValorCocina!.Value);
        var inconsistencias = filas.Count(f =>
            f.Estado is CorteConciliacionFcr.EstadoDifCantidad
                or CorteConciliacionFcr.EstadoDifTipo
                or CorteConciliacionFcr.EstadoConAlerta
                or CorteConciliacionFcr.EstadoPendiente);

        return
        [
            Kpi("dietas_sistema", "Dietas sistema", sistema, "numero"),
            Kpi("dietas_cocina", "Dietas cocina", tienePlanilla ? cocina : 0, "numero",
                tienePlanilla ? null : "Cargue la planilla"),
            Kpi("diferencia_cantidad", "Diferencia de cantidad", tienePlanilla ? cocina - sistema : 0, "numero"),
            Kpi("valor_sistema", "Valor sistema", valorSistema, "moneda"),
            Kpi("valor_cocina", "Valor cocina", tienePlanilla ? valorCocina : 0, "moneda",
                tienePlanilla ? null : "Cargue la planilla"),
            Kpi("inconsistencias", "Líneas con diferencia", inconsistencias, "numero"),
        ];
    }

    public async Task<FilaConciliacionDto> SubirFacturaAsync(
        Guid id,
        Stream archivo,
        string nombreArchivo,
        string usuario,
        CancellationToken cancellationToken = default)
    {
        var fila = await AsegurarFilaAsync(id, cancellationToken);
        var url = await ArchivosUploadHelper.GuardarAsync(archivo, "conciliacion", nombreArchivo, cancellationToken);
        fila.FacturaDocumentoUrl = url;
        fila.ModificadoEn = DateTime.UtcNow;
        fila.ModificadoPor = usuario;
        await _context.SaveChangesAsync(cancellationToken);
        Auditar(AuditoriaCatalogo.Acciones.SubirFactura, usuario, id, null, new { url, nombreArchivo });
        await _realtime.NotificarConciliacionAsync(cancellationToken);
        return MapearPersistida(fila);
    }

    public async Task SubirFacturaPeriodoAsync(
        DateTime desde,
        DateTime hasta,
        Stream archivo,
        string nombreArchivo,
        string? numeroFactura,
        string usuario,
        string? periodo = null,
        CancellationToken cancellationToken = default)
    {
        var rango = ContratoCocinaHelper.ResolverRango(
            desde == default ? null : desde,
            hasta == default ? null : hasta,
            periodo);
        desde = rango.Desde;
        hasta = rango.Hasta;
        var url = await ArchivosUploadHelper.GuardarAsync(archivo, "conciliacion", nombreArchivo, cancellationToken);
        var grupos = await ConstruirCorteAsync(desde, hasta, cancellationToken);
        foreach (var grupo in grupos)
        {
            var fila = await AsegurarFilaDesdeGrupoAsync(grupo, usuario, cancellationToken);
            fila.FacturaDocumentoUrl = url;
            if (!string.IsNullOrWhiteSpace(numeroFactura))
                fila.NumeroFactura = numeroFactura.Trim();
            fila.ModificadoEn = DateTime.UtcNow;
            fila.ModificadoPor = usuario;
        }

        await _context.SaveChangesAsync(cancellationToken);
        Auditar(AuditoriaCatalogo.Acciones.SubirFactura, usuario, null, null, new { url, desde, hasta, numeroFactura });
        await _realtime.NotificarConciliacionAsync(cancellationToken);
    }

    public async Task<ListaConciliacionDto> CargarPlanillaAsync(
        CargarPlanillaCocinaDto datos,
        string usuario,
        CancellationToken cancellationToken = default)
    {
        var (desde, hasta) = ContratoCocinaHelper.ResolverRango(datos.Desde, datos.Hasta, datos.Periodo);
        var grupos = await ConstruirCorteAsync(desde, hasta, cancellationToken);
        var porId = grupos.ToDictionary(g => g.Id);

        foreach (var linea in datos.Lineas)
        {
            var def = CorteConciliacionFcr.ResolverDefinicionPlanilla(
                linea.Comida,
                linea.LineaFcr ?? linea.Linea ?? linea.Etiqueta);
            if (def is null)
                continue;

            var id = ContratoCocinaHelper.IdGrupoCorte(desde, hasta, def.Comida, def.Linea);
            if (!porId.TryGetValue(id, out var grupo))
                continue;

            var fila = await AsegurarFilaDesdeGrupoAsync(grupo, usuario, cancellationToken);
            if (CorteConciliacionFcr.EstadoManualNoPisar(fila.Estado))
                continue;

            fila.CantidadCocina = linea.Cantidad;
            fila.ValorCocina = linea.Cantidad * grupo.Tarifa;
            fila.Diferencia = linea.Cantidad - grupo.CantidadSistema;
            fila.CantidadFacturada = linea.Cantidad;
            if (!string.IsNullOrWhiteSpace(datos.NumeroFactura))
                fila.NumeroFactura = datos.NumeroFactura.Trim();
            if (!CorteConciliacionFcr.EstadoManualNoPisar(fila.Estado))
            {
                fila.Estado = CorteConciliacionFcr.EstadoAutomatico(
                    grupo.CantidadSistema,
                    linea.Cantidad,
                    grupo.SinEtiqueta,
                    grupo.Huerfanas,
                    grupo.Tarifa,
                    CorteConciliacionFcr.TieneDifTipo(grupo.Bandejas, grupo.LineaFcr));
            }

            fila.ModificadoEn = DateTime.UtcNow;
            fila.ModificadoPor = usuario;
        }

        await _context.SaveChangesAsync(cancellationToken);
        Auditar(AuditoriaCatalogo.Acciones.CargarPlanilla, usuario, null, null, new { desde, hasta, datos.Lineas.Count });
        await _realtime.NotificarConciliacionAsync(cancellationToken);
        return await ObtenerConciliacionAsync(desde, hasta, sinPaginar: true, cancellationToken: cancellationToken);
    }

    public static List<LineaPlanillaCocinaDto> ParsearCsvPlanilla(string csv)
    {
        var lineas = new List<LineaPlanillaCocinaDto>();
        using var reader = new StringReader(csv);
        var encabezado = reader.ReadLine();
        if (encabezado is null)
            return lineas;

        var cols = encabezado.Split(',').Select(c => c.Trim().ToLowerInvariant()).ToArray();
        var idxComida = IndiceColumna(cols, "comida", "tiempo");
        var idxLinea = IndiceColumna(cols, "lineafcr", "linea", "linea_fcr", "tipo", "etiqueta");
        var idxCantidad = IndiceColumna(cols, "cantidad", "cant", "cocina");

        string? filaCsv;
        while ((filaCsv = reader.ReadLine()) != null)
        {
            if (string.IsNullOrWhiteSpace(filaCsv))
                continue;
            var partes = filaCsv.Split(',');
            var comida = idxComida >= 0 && idxComida < partes.Length ? partes[idxComida].Trim() : string.Empty;
            var linea = idxLinea >= 0 && idxLinea < partes.Length ? partes[idxLinea].Trim() : string.Empty;
            var cantidadTxt = idxCantidad >= 0 && idxCantidad < partes.Length ? partes[idxCantidad].Trim() : "0";
            if (!int.TryParse(cantidadTxt, NumberStyles.Integer, CultureInfo.InvariantCulture, out var cantidad))
                continue;
            lineas.Add(new LineaPlanillaCocinaDto { Comida = comida, LineaFcr = linea, Cantidad = cantidad });
        }

        return lineas;
    }

    private async Task<List<FilaConciliacionDto>> ConstruirGruposAsync(
        DateTime desde,
        DateTime hasta,
        CancellationToken cancellationToken)
    {
        for (var intento = 0; intento < 2; intento++)
        {
            try
            {
                return await ConstruirGruposInternoAsync(desde, hasta, cancellationToken);
            }
            catch (DbUpdateException ex) when (intento == 0 && EsViolacionClaveDuplicada(ex))
            {
                _logger.LogWarning(ex, "Colisión al insertar filas FCR; reintentando conciliación {Desde}-{Hasta}", desde, hasta);
                _context.ChangeTracker.Clear();
            }
        }

        return await ConstruirGruposInternoAsync(desde, hasta, cancellationToken);
    }

    private async Task<List<FilaConciliacionDto>> ConstruirGruposInternoAsync(
        DateTime desde,
        DateTime hasta,
        CancellationToken cancellationToken)
    {
        var corte = await ConstruirCorteAsync(desde, hasta, cancellationToken);
        var persistidas = await CargarPersistidasAsync(desde, hasta, cancellationToken);
        var lineas = new List<FilaConciliacionDto>(corte.Count);
        foreach (var grupo in corte)
        {
            persistidas.TryGetValue(grupo.Id, out var fila);
            if (fila == null)
            {
                fila = new FilaConciliacion
                {
                    Id = grupo.Id,
                    CreadoPor = "sistema",
                    CreadoEn = DateTime.UtcNow,
                };
                CopiarGrupo(fila, grupo);
                _context.FilasConciliacion.Add(fila);
                persistidas[grupo.Id] = fila;
            }
            else if (fila.CantidadSistema != grupo.CantidadSistema
                     || fila.ValorSistema != grupo.ValorSistema
                     || fila.SinEtiqueta != grupo.SinEtiqueta
                     || fila.Huerfanas != grupo.Huerfanas)
            {
                ActualizarSistema(fila, grupo);
            }

            lineas.Add(MapearGrupo(grupo, fila));
        }

        if (_context.ChangeTracker.HasChanges())
            await _context.SaveChangesAsync(cancellationToken);

        return lineas;
    }

    private async Task<List<CorteConciliacionFcr.GrupoCorte>> ConstruirCorteAsync(
        DateTime desde,
        DateTime hasta,
        CancellationToken cancellationToken)
    {
        var hastaExclusivo = hasta.Date.AddDays(1);
        var dietas = await _context.FilasDietas
            .Include(f => f.TipoDieta)
            .Where(f => f.FechaOperativa >= desde && f.FechaOperativa < hastaExclusivo)
            .ToListAsync(cancellationToken);
        var ordenes = await _context.OrdenesCocina
            .Where(o => o.FechaOperativa >= desde && o.FechaOperativa < hastaExclusivo)
            .ToListAsync(cancellationToken);
        var etiquetas = await _context.EtiquetasEnfermeria
            .Where(e => e.FechaOperativa >= desde && e.FechaOperativa < hastaExclusivo)
            .ToListAsync(cancellationToken);
        var tarifas = await _context.TarifasHistorico
            .Include(t => t.DietaCatalogo)
            .Where(t => t.Activa)
            .ToListAsync(cancellationToken);

        return CorteConciliacionFcr.Construir(desde, hasta, Deduplicar(dietas), ordenes, etiquetas, tarifas);
    }

    private async Task<Dictionary<Guid, FilaConciliacion>> CargarPersistidasAsync(
        DateTime desde,
        DateTime hasta,
        CancellationToken cancellationToken)
    {
        var clave = ContratoCocinaHelper.ClavePeriodo(desde, hasta);
        var filas = await _context.FilasConciliacion
            .Where(f =>
                (f.PeriodoDesde == desde && f.PeriodoHasta == hasta)
                || f.Periodo == clave)
            .ToListAsync(cancellationToken);
        return filas.ToDictionary(f => f.Id);
    }

    private FilaConciliacionDto? FiltrarGrupo(
        FilaConciliacionDto linea,
        string? busqueda,
        string? numeroFactura,
        string? estado)
    {
        if (!string.IsNullOrWhiteSpace(estado)
            && !string.Equals(linea.Estado, estado, StringComparison.OrdinalIgnoreCase)
            && !CoincideFiltroEstado(linea.Estado, estado))
        {
            return null;
        }

        if (!string.IsNullOrWhiteSpace(numeroFactura)
            && !string.Equals(linea.NumeroFactura, numeroFactura.Trim(), StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        if (!string.IsNullOrWhiteSpace(busqueda))
        {
            var q = busqueda.Trim();
            if (!linea.EtiquetaPlanilla.Contains(q, StringComparison.OrdinalIgnoreCase)
                && !linea.LineaFcr.Contains(q, StringComparison.OrdinalIgnoreCase)
                && !linea.Comida.Contains(q, StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }
        }

        return linea;
    }

    private static bool CoincideFiltroEstado(string estado, string filtro)
    {
        var f = filtro.Trim().ToLowerInvariant();
        return f switch
        {
            "con-diferencia" or "diferencia" =>
                estado is CorteConciliacionFcr.EstadoDifCantidad
                    or CorteConciliacionFcr.EstadoDifTipo
                    or CorteConciliacionFcr.EstadoConAlerta,
            "conciliado" or "conciliado-manual" =>
                estado is CorteConciliacionFcr.EstadoConciliado,
            "en_revision" or "en-revision" =>
                estado is CorteConciliacionFcr.EstadoEnRevision,
            _ => false,
        };
    }

    private async Task<FilaConciliacion> AsegurarFilaAsync(Guid id, CancellationToken cancellationToken)
    {
        var existente = await _context.FilasConciliacion
            .FirstOrDefaultAsync(f => f.Id == id, cancellationToken);
        if (existente != null)
            return existente;

        var hoy = HorarioOperativoHelper.HoyColombia();
        var grupos = await ConstruirCorteAsync(hoy.AddDays(-29), hoy, cancellationToken);
        var grupo = grupos.FirstOrDefault(g => g.Id == id)
            ?? throw new KeyNotFoundException($"Línea de conciliación con ID {id} no encontrada");
        return await AsegurarFilaDesdeGrupoAsync(grupo, "sistema", cancellationToken);
    }

    private async Task<FilaConciliacion> AsegurarFilaDesdeGrupoAsync(
        CorteConciliacionFcr.GrupoCorte grupo,
        string usuario,
        CancellationToken cancellationToken)
    {
        var existente = await _context.FilasConciliacion
            .FirstOrDefaultAsync(f => f.Id == grupo.Id, cancellationToken);
        if (existente != null)
        {
            ActualizarSistema(existente, grupo);
            return existente;
        }

        var fila = new FilaConciliacion { Id = grupo.Id, CreadoPor = usuario, CreadoEn = DateTime.UtcNow };
        CopiarGrupo(fila, grupo);
        _context.FilasConciliacion.Add(fila);
        return fila;
    }

    private static void ActualizarSistema(FilaConciliacion fila, CorteConciliacionFcr.GrupoCorte grupo)
    {
        fila.CantidadSistema = grupo.CantidadSistema;
        fila.CantidadSolicitada = grupo.CantidadSistema;
        fila.ValorSistema = grupo.ValorSistema;
        fila.ValorUnitario = grupo.Tarifa;
        fila.ValorTotal = grupo.ValorSistema;
        fila.SinEtiqueta = grupo.SinEtiqueta;
        fila.Huerfanas = grupo.Huerfanas;
        fila.EtiquetaPlanilla = grupo.EtiquetaPlanilla;
        fila.LineaFcr = grupo.LineaFcr;
        fila.TipoDieta = grupo.LineaFcr;
        fila.Consistencia = grupo.EtiquetaPlanilla;
        if (fila.CantidadCocina.HasValue)
        {
            fila.ValorCocina = fila.CantidadCocina.Value * grupo.Tarifa;
            fila.Diferencia = fila.CantidadCocina.Value - grupo.CantidadSistema;
        }

        if (!CorteConciliacionFcr.EstadoManualNoPisar(fila.Estado))
        {
            fila.Estado = CorteConciliacionFcr.EstadoAutomatico(
                grupo.CantidadSistema,
                fila.CantidadCocina,
                grupo.SinEtiqueta,
                grupo.Huerfanas,
                grupo.Tarifa,
                CorteConciliacionFcr.TieneDifTipo(grupo.Bandejas, grupo.LineaFcr));
        }
    }

    private static void CopiarGrupo(FilaConciliacion fila, CorteConciliacionFcr.GrupoCorte grupo)
    {
        fila.PeriodoDesde = grupo.PeriodoDesde;
        fila.PeriodoHasta = grupo.PeriodoHasta;
        fila.Periodo = ContratoCocinaHelper.ClavePeriodo(grupo.PeriodoDesde, grupo.PeriodoHasta);
        fila.FechaOperativa = grupo.PeriodoDesde;
        fila.Comida = ContratoCocinaHelper.EtiquetaComidaContrato(grupo.Comida);
        fila.LineaFcr = grupo.LineaFcr;
        fila.EtiquetaPlanilla = grupo.EtiquetaPlanilla;
        fila.TipoDieta = grupo.LineaFcr;
        fila.Consistencia = grupo.EtiquetaPlanilla;
        fila.CantidadSistema = grupo.CantidadSistema;
        fila.CantidadSolicitada = grupo.CantidadSistema;
        fila.ValorSistema = grupo.ValorSistema;
        fila.ValorUnitario = grupo.Tarifa;
        fila.ValorTotal = grupo.ValorSistema;
        fila.SinEtiqueta = grupo.SinEtiqueta;
        fila.Huerfanas = grupo.Huerfanas;
        if (!CorteConciliacionFcr.EstadoManualNoPisar(fila.Estado))
        {
            fila.Estado = CorteConciliacionFcr.EstadoAutomatico(
                grupo.CantidadSistema,
                fila.CantidadCocina,
                grupo.SinEtiqueta,
                grupo.Huerfanas,
                grupo.Tarifa,
                CorteConciliacionFcr.TieneDifTipo(grupo.Bandejas, grupo.LineaFcr));
        }
    }

    private FilaConciliacionDto MapearGrupo(
        CorteConciliacionFcr.GrupoCorte grupo,
        FilaConciliacion? persistida)
    {
        var cantidadCocina = persistida?.CantidadCocina;
        var valorCocina = cantidadCocina.HasValue ? cantidadCocina.Value * grupo.Tarifa : (decimal?)null;
        var estado = persistida != null && CorteConciliacionFcr.EstadoManualNoPisar(persistida.Estado)
            ? persistida.Estado
            : CorteConciliacionFcr.EstadoAutomatico(
                grupo.CantidadSistema,
                cantidadCocina,
                grupo.SinEtiqueta,
                grupo.Huerfanas,
                grupo.Tarifa,
                CorteConciliacionFcr.TieneDifTipo(grupo.Bandejas, grupo.LineaFcr));

        return new FilaConciliacionDto
        {
            Id = grupo.Id,
            PeriodoDesde = grupo.PeriodoDesde,
            PeriodoHasta = grupo.PeriodoHasta,
            Periodo = ContratoCocinaHelper.ClavePeriodo(grupo.PeriodoDesde, grupo.PeriodoHasta),
            Comida = ContratoCocinaHelper.EtiquetaComidaContrato(grupo.Comida),
            LineaFcr = grupo.LineaFcr,
            EtiquetaPlanilla = grupo.EtiquetaPlanilla,
            Tarifa = grupo.Tarifa,
            CantidadSistema = grupo.CantidadSistema,
            CantidadCocina = cantidadCocina,
            ValorSistema = grupo.ValorSistema,
            ValorCocina = valorCocina,
            DiferenciaCantidad = cantidadCocina.HasValue ? cantidadCocina.Value - grupo.CantidadSistema : 0,
            DiferenciaEconomica = valorCocina.HasValue ? valorCocina.Value - grupo.ValorSistema : null,
            SinEtiqueta = grupo.SinEtiqueta,
            Huerfanas = grupo.Huerfanas,
            Estado = estado,
            Motivo = persistida?.Motivo,
            Observaciones = persistida?.Observaciones,
            ResueltoPor = persistida?.ResueltoPor,
            ResueltaEn = persistida?.ResueltaEn,
            NumeroFactura = persistida?.NumeroFactura,
            FacturaDocumentoUrl = persistida?.FacturaDocumentoUrl,
        };
    }

    private static FilaConciliacionDto MapearPersistida(FilaConciliacion fila)
    {
        var valorCocina = fila.CantidadCocina.HasValue ? fila.CantidadCocina.Value * fila.ValorUnitario : (decimal?)null;
        return new FilaConciliacionDto
        {
            Id = fila.Id,
            PeriodoDesde = fila.PeriodoDesde,
            PeriodoHasta = fila.PeriodoHasta,
            Periodo = fila.Periodo,
            Comida = fila.Comida,
            LineaFcr = fila.LineaFcr,
            EtiquetaPlanilla = fila.EtiquetaPlanilla,
            Tarifa = fila.ValorUnitario,
            CantidadSistema = fila.CantidadSistema,
            CantidadCocina = fila.CantidadCocina,
            ValorSistema = fila.ValorSistema,
            ValorCocina = valorCocina,
            DiferenciaCantidad = fila.CantidadCocina.HasValue
                ? fila.CantidadCocina.Value - fila.CantidadSistema
                : 0,
            DiferenciaEconomica = valorCocina.HasValue ? valorCocina.Value - fila.ValorSistema : null,
            SinEtiqueta = fila.SinEtiqueta,
            Huerfanas = fila.Huerfanas,
            Estado = fila.Estado,
            Motivo = fila.Motivo,
            Observaciones = fila.Observaciones,
            ResueltoPor = fila.ResueltoPor,
            ResueltaEn = fila.ResueltaEn,
            NumeroFactura = fila.NumeroFactura,
            FacturaDocumentoUrl = fila.FacturaDocumentoUrl,
        };
    }

    private static RegistroBandejaConciliacionDto MapearRegistro(CorteConciliacionFcr.BandejaCorte bandeja)
    {
        return new RegistroBandejaConciliacionDto
        {
            FilaDietaId = bandeja.FilaDietaId,
            Fecha = bandeja.FechaOperativa.ToString("yyyy-MM-dd"),
            Paciente = string.IsNullOrWhiteSpace(bandeja.Paciente)
                ? (bandeja.EsHuerfana ? "Orden huérfana" : "—")
                : bandeja.Paciente,
            Cedula = bandeja.Cedula,
            Pabellon = bandeja.Pabellon,
            Habitacion = bandeja.Habitacion,
            TipoClinico = bandeja.TipoClinico,
            LineaFcr = bandeja.LineaFcr,
            EstadoDieta = bandeja.EstadoDieta,
            EstadoOrden = bandeja.EstadoOrden,
            TieneEtiqueta = bandeja.TieneEtiqueta,
            EsHuerfana = bandeja.EsHuerfana,
            Alertas = CorteConciliacionFcr.AlertasBandeja(bandeja).ToArray(),
        };
    }

    private static List<FilaDieta> Deduplicar(IEnumerable<FilaDieta> filas)
    {
        var porClave = new Dictionary<string, FilaDieta>(StringComparer.OrdinalIgnoreCase);
        foreach (var fila in filas)
        {
            var paciente = string.IsNullOrWhiteSpace(fila.Cedula)
                ? (string.IsNullOrWhiteSpace(fila.PacienteId) ? fila.Paciente : fila.PacienteId)
                : fila.Cedula.Trim();
            var clave = $"{fila.FechaOperativa:yyyy-MM-dd}|{fila.Comida}|{paciente}";
            if (!porClave.TryGetValue(clave, out var actual))
            {
                porClave[clave] = fila;
                continue;
            }

            porClave[clave] = fila.Estado != EstadoDieta.Cancelada && actual.Estado == EstadoDieta.Cancelada
                ? fila
                : fila.Estado >= actual.Estado
                    ? fila
                    : actual;
        }

        return porClave.Values.ToList();
    }

    private static bool EsViolacionClaveDuplicada(DbUpdateException ex)
    {
        var mensaje = ex.InnerException?.Message ?? ex.Message;
        return mensaje.Contains("PK_FilasConciliacion", StringComparison.OrdinalIgnoreCase)
            || mensaje.Contains("duplicate key", StringComparison.OrdinalIgnoreCase)
            || mensaje.Contains("2601", StringComparison.Ordinal)
            || mensaje.Contains("2627", StringComparison.Ordinal);
    }

    private static KpiConciliacionDto Kpi(
        string clave,
        string etiqueta,
        decimal valor,
        string formato,
        string? comparacion = null) =>
        new()
        {
            Clave = clave,
            Etiqueta = etiqueta,
            Valor = valor,
            Formato = formato,
            Comparacion = comparacion,
        };

    private static int IndiceColumna(string[] cols, params string[] nombres)
    {
        for (var i = 0; i < cols.Length; i++)
        {
            var c = cols[i].Replace(" ", "").Replace("_", "");
            if (nombres.Any(n => string.Equals(c, n, StringComparison.OrdinalIgnoreCase)))
                return i;
        }
        return -1;
    }

    private void Auditar(
        string accion,
        string usuario,
        Guid? entidadId,
        object? antes,
        object? despues)
    {
        AuditoriaOperativaHelper.RegistrarSilencioso(
            _auditoria,
            _logger,
            AuditoriaCatalogo.Modulos.Conciliacion,
            accion,
            usuario,
            AuditoriaCatalogo.Entidades.FilaConciliacion,
            entidadId,
            AuditoriaSnapshot.Json(antes),
            AuditoriaSnapshot.Json(despues),
            contexto: _contextoAuditoria);
    }
}
