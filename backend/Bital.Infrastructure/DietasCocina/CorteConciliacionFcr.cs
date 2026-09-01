using Bital.Domain.Entities.DietasCocina;
using Bital.Domain.Enums;

namespace Bital.Infrastructure.DietasCocina;

/// <summary>
/// Corte de conciliación: mismas bandejas y agrupación FCR que Reportes.
/// </summary>
internal static class CorteConciliacionFcr
{
    internal const string EstadoCoincide = "coincide";
    internal const string EstadoDifCantidad = "dif-cantidad";
    internal const string EstadoDifTipo = "dif-tipo";
    internal const string EstadoPendiente = "pendiente";
    internal const string EstadoConAlerta = "con-alerta";
    internal const string EstadoConciliado = "conciliado";
    internal const string EstadoEnRevision = "en_revision";

    internal sealed record BandejaCorte(
        Guid? FilaDietaId,
        Guid? OrdenCocinaId,
        TiempoComida Comida,
        DateTime FechaOperativa,
        string Paciente,
        string Cedula,
        string Pabellon,
        string Habitacion,
        string TipoClinico,
        string LineaFcr,
        string EstadoDieta,
        string? EstadoOrden,
        bool TieneEtiqueta,
        bool EsHuerfana,
        decimal Tarifa);

    internal sealed record GrupoCorte(
        Guid Id,
        DateTime PeriodoDesde,
        DateTime PeriodoHasta,
        TiempoComida Comida,
        string LineaFcr,
        string EtiquetaPlanilla,
        int CantidadSistema,
        decimal Tarifa,
        decimal ValorSistema,
        int SinEtiqueta,
        int Huerfanas,
        IReadOnlyList<BandejaCorte> Bandejas);

    internal static List<GrupoCorte> Construir(
        DateTime desde,
        DateTime hasta,
        IReadOnlyList<FilaDieta> dietas,
        IReadOnlyList<OrdenCocina> ordenes,
        IReadOnlyList<EtiquetaEnfermera> etiquetas,
        IReadOnlyList<TarifaHistorico> tarifas)
    {
        var filasConEtiqueta = etiquetas.Select(e => e.FilaDietaId).ToHashSet();
        var ordenPorId = ordenes.ToDictionary(o => o.Id);
        var fechaTarifa = hasta.Date;

        var bandejas = new List<BandejaCorte>();
        foreach (var dieta in dietas)
        {
            var tieneEtiqueta = filasConEtiqueta.Contains(dieta.Id);
            var estadoOrden = dieta.OrdenCocinaId is { } oid && ordenPorId.TryGetValue(oid, out var orden)
                ? orden.Estado
                : null;
            if (!ContratoCocinaHelper.EsSuministrada(dieta, estadoOrden, tieneEtiqueta))
                continue;

            var linea = ContratoCocinaHelper.LineaContrato(dieta.TipoDieta?.Nombre);
            var tarifa = ContratoCocinaHelper.ResolverTarifaLineaContrato(
                tarifas, linea, dieta.Comida, fechaTarifa);
            bandejas.Add(new BandejaCorte(
                dieta.Id,
                dieta.OrdenCocinaId,
                dieta.Comida,
                dieta.FechaOperativa,
                dieta.Paciente,
                dieta.Cedula ?? string.Empty,
                dieta.Pabellon,
                dieta.Habitacion,
                dieta.TipoDieta?.Nombre ?? string.Empty,
                linea,
                dieta.Estado.ToString(),
                estadoOrden,
                tieneEtiqueta,
                false,
                tarifa));
        }

        var idsConFila = dietas
            .Where(d => d.OrdenCocinaId.HasValue)
            .Select(d => d.OrdenCocinaId!.Value)
            .ToHashSet();

        foreach (var orden in ordenes)
        {
            if (!ContratoCocinaHelper.EsOrdenHuerfanaSuministrada(orden) || idsConFila.Contains(orden.Id))
                continue;

            var tarifa = ContratoCocinaHelper.ResolverTarifaLineaContrato(
                tarifas,
                ContratoCocinaHelper.LineaNormalesYDerivadas,
                orden.Comida,
                fechaTarifa);
            bandejas.Add(new BandejaCorte(
                null,
                orden.Id,
                orden.Comida,
                orden.FechaOperativa,
                string.Empty,
                string.Empty,
                string.Empty,
                string.Empty,
                string.Empty,
                ContratoCocinaHelper.LineaNormalesYDerivadas,
                "Cancelada",
                orden.Estado,
                false,
                true,
                tarifa));
        }

        var porClave = bandejas
            .GroupBy(b => (b.Comida, b.LineaFcr))
            .ToDictionary(g => g.Key, g => g.ToList());

        var grupos = new List<GrupoCorte>(ContratoCocinaHelper.PlantillaFcr.Length);
        foreach (var def in ContratoCocinaHelper.PlantillaFcr)
        {
            porClave.TryGetValue((def.Comida, def.Linea), out var items);
            items ??= [];
            var tarifa = ContratoCocinaHelper.ResolverTarifaLineaContrato(
                tarifas, def.Linea, def.Comida, fechaTarifa);
            var cantidad = items.Count;
            grupos.Add(new GrupoCorte(
                ContratoCocinaHelper.IdGrupoCorte(desde, hasta, def.Comida, def.Linea),
                desde.Date,
                hasta.Date,
                def.Comida,
                def.Linea,
                def.Etiqueta,
                cantidad,
                tarifa,
                cantidad * tarifa,
                items.Count(b => !b.TieneEtiqueta),
                items.Count(b => b.EsHuerfana),
                items));
        }

        return grupos;
    }

    internal static string EstadoAutomatico(
        int cantidadSistema,
        int? cantidadCocina,
        int sinEtiqueta,
        int huerfanas,
        decimal tarifa,
        bool tieneDifTipo)
    {
        if (!cantidadCocina.HasValue)
            return EstadoPendiente;

        if (cantidadCocina.Value != cantidadSistema)
            return EstadoDifCantidad;

        if (tieneDifTipo)
            return EstadoDifTipo;

        if (sinEtiqueta > 0 || huerfanas > 0 || tarifa <= 0)
            return EstadoConAlerta;

        return EstadoCoincide;
    }

    internal static bool EstadoManualNoPisar(string? estado) =>
        string.Equals(estado, EstadoConciliado, StringComparison.OrdinalIgnoreCase)
        || string.Equals(estado, EstadoEnRevision, StringComparison.OrdinalIgnoreCase);

    internal static bool TieneDifTipo(IReadOnlyList<BandejaCorte> bandejas, string lineaFcr) =>
        bandejas.Any(b =>
            !b.EsHuerfana
            && !string.IsNullOrWhiteSpace(b.TipoClinico)
            && !string.Equals(b.TipoClinico.Trim(), lineaFcr, StringComparison.OrdinalIgnoreCase)
            && ContratoCocinaHelper.LineaContrato(b.TipoClinico) == lineaFcr);

    internal static IReadOnlyList<string> AlertasBandeja(BandejaCorte bandeja)
    {
        var alertas = new List<string>();
        if (bandeja.EsHuerfana)
        {
            alertas.Add(
                $"Orden cancelada de {ContratoCocinaHelper.EtiquetaComidaContrato(bandeja.Comida)} sin fila (huérfana)");
        }
        else if (!bandeja.TieneEtiqueta)
        {
            var orden = string.IsNullOrWhiteSpace(bandeja.EstadoOrden)
                ? "sin orden"
                : bandeja.EstadoOrden;
            alertas.Add($"Sin etiqueta, orden en {orden}");
        }

        if (!string.IsNullOrWhiteSpace(bandeja.TipoClinico)
            && !string.Equals(bandeja.TipoClinico.Trim(), bandeja.LineaFcr, StringComparison.OrdinalIgnoreCase))
        {
            alertas.Add($"Tipo clínico {bandeja.TipoClinico} cobrado en esta línea");
        }

        return alertas;
    }

    internal static ContratoCocinaHelper.LineaPlanillaDef? ResolverDefinicionPlanilla(
        string? comida,
        string? lineaOEtiqueta)
    {
        var comidaTxt = (comida ?? string.Empty).Trim();
        var lineaTxt = (lineaOEtiqueta ?? string.Empty).Trim();

        TiempoComida? comidaParsed = null;
        if (TarifasCatalogoHelper.TryParseTiempoComida(comidaTxt, out var parsed))
            comidaParsed = parsed;
        else
        {
            foreach (var def in ContratoCocinaHelper.PlantillaFcr)
            {
                if (string.Equals(def.Etiqueta, comidaTxt, StringComparison.OrdinalIgnoreCase)
                    || string.Equals(
                        ContratoCocinaHelper.EtiquetaComidaContrato(def.Comida),
                        comidaTxt,
                        StringComparison.OrdinalIgnoreCase))
                {
                    comidaParsed = def.Comida;
                    break;
                }
            }
        }

        if (comidaParsed is null && lineaTxt.Length == 0)
            return null;

        IEnumerable<ContratoCocinaHelper.LineaPlanillaDef> candidatos = ContratoCocinaHelper.PlantillaFcr;
        if (comidaParsed is { } comidaFiltro)
            candidatos = candidatos.Where(d => d.Comida == comidaFiltro);

        if (lineaTxt.Length == 0)
        {
            return candidatos.FirstOrDefault(d => d.Linea == ContratoCocinaHelper.LineaNormalesYDerivadas)
                ?? candidatos.FirstOrDefault();
        }

        return candidatos.FirstOrDefault(d =>
                   string.Equals(d.Linea, lineaTxt, StringComparison.OrdinalIgnoreCase)
                   || string.Equals(d.Etiqueta, lineaTxt, StringComparison.OrdinalIgnoreCase));
    }
}
