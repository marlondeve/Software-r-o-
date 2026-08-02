using Bital.Application.DTOs.DietasCocina;
using Bital.Domain.Entities.DietasCocina;
using Bital.Domain.Enums;

namespace Bital.Infrastructure.DietasCocina;

internal static class TarifasCatalogoHelper
{
    internal static bool TryParseTiempoComida(string? valor, out TiempoComida comida)
    {
        comida = default;
        if (string.IsNullOrWhiteSpace(valor))
        {
            return false;
        }

        if (Enum.TryParse<TiempoComida>(valor, ignoreCase: true, out comida))
        {
            return true;
        }

        var clave = valor.Trim().ToLowerInvariant().Replace("-", "").Replace(" ", "");
        switch (clave)
        {
            case "desayuno":
                comida = TiempoComida.Desayuno;
                return true;
            case "medianueve":
            case "meriendamanana":
            case "meriendamañana":
                comida = TiempoComida.MediaNueve;
                return true;
            case "almuerzo":
                comida = TiempoComida.Almuerzo;
                return true;
            case "onces":
            case "meriendatarde":
                comida = TiempoComida.Onces;
                return true;
            case "cena":
                comida = TiempoComida.Cena;
                return true;
            case "medianoche":
            case "meriendanoche":
                comida = TiempoComida.MediaNoche;
                return true;
            default:
                return false;
        }
    }

    internal static string EtiquetaTiempoComida(TiempoComida comida) => comida.ToString();

    internal static List<(TiempoComida Comida, decimal Monto)> ResolverMontosPorComida(
        IEnumerable<TarifaComidaDto>? tarifas,
        decimal? montoUnico)
    {
        var resultado = new List<(TiempoComida Comida, decimal Monto)>();

        if (tarifas != null)
        {
            foreach (var item in tarifas)
            {
                if (item.Monto <= 0 || !TryParseTiempoComida(item.TiempoComida, out var comida))
                {
                    continue;
                }

                var indice = resultado.FindIndex(entry => entry.Comida == comida);
                if (indice >= 0)
                {
                    resultado[indice] = (comida, item.Monto);
                }
                else
                {
                    resultado.Add((comida, item.Monto));
                }
            }
        }

        if (resultado.Count == 0 && montoUnico.HasValue && montoUnico.Value > 0)
        {
            foreach (TiempoComida comida in Enum.GetValues<TiempoComida>())
            {
                resultado.Add((comida, montoUnico.Value));
            }
        }

        return resultado;
    }

    internal static Dictionary<string, decimal> ConstruirTarifasVigentes(
        IEnumerable<TarifaHistorico> tarifasActivas,
        DateTime hoy)
    {
        return tarifasActivas
            .Where(t => EsTarifaVigente(t, hoy))
            .GroupBy(t => t.TiempoComida)
            .ToDictionary(
                g => EtiquetaTiempoComida(g.Key),
                g => g.OrderByDescending(t => t.VigenciaDesde).First().Monto);
    }

    internal static bool TieneTarifaVigenteParaComida(
        IEnumerable<TarifaHistorico> tarifas,
        TiempoComida comida,
        DateTime hoy) =>
        tarifas.Any(t =>
            t.TiempoComida == comida
            && EsTarifaVigente(t, hoy));

    internal static bool EsTarifaVigente(TarifaHistorico tarifa, DateTime hoy) =>
        tarifa.Activa
        && tarifa.VigenciaDesde.Date <= hoy
        && tarifa.VigenciaHasta.Date >= hoy;

    internal static TarifaHistoricoDto MapTarifaHistoricoDto(
        TarifaHistorico tarifa,
        DateTime hoy,
        string registradoPorFallback)
    {
        return new TarifaHistoricoDto
        {
            Id = tarifa.Id,
            Anio = tarifa.Anio,
            TiempoComida = EtiquetaTiempoComida(tarifa.TiempoComida),
            Monto = tarifa.Monto,
            VigenciaDesde = tarifa.VigenciaDesde,
            VigenciaHasta = tarifa.VigenciaHasta,
            Vigente = EsTarifaVigente(tarifa, hoy),
            RegistradoPor = string.IsNullOrWhiteSpace(tarifa.CreadoPor)
                ? registradoPorFallback
                : tarifa.CreadoPor,
            MotivoCambio = tarifa.Observaciones,
            CreadoEn = tarifa.CreadoEn,
        };
    }

    internal static void CerrarSolapamientos(
        IEnumerable<TarifaHistorico> tarifasActivas,
        TiempoComida comida,
        DateTime vigenciaDesde,
        DateTime vigenciaHasta)
    {
        foreach (var tarifa in tarifasActivas.Where(t => t.Activa && t.TiempoComida == comida).ToList())
        {
            if (vigenciaDesde > tarifa.VigenciaDesde.Date
                && vigenciaDesde <= tarifa.VigenciaHasta.Date)
            {
                tarifa.VigenciaHasta = vigenciaDesde.AddDays(-1);
            }
            else if (vigenciaDesde <= tarifa.VigenciaDesde.Date
                     && vigenciaHasta >= tarifa.VigenciaDesde.Date)
            {
                tarifa.Activa = false;
            }
        }
    }

    internal static bool TieneSolapamiento(
        IEnumerable<TarifaHistorico> tarifas,
        TiempoComida comida,
        DateTime vigenciaDesde,
        DateTime vigenciaHasta) =>
        tarifas.Any(t =>
            t.Activa
            && t.TiempoComida == comida
            && vigenciaDesde <= t.VigenciaHasta.Date
            && vigenciaHasta >= t.VigenciaDesde.Date);
}
