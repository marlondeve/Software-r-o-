using System.Globalization;
using Bital.Application.DTOs.DietasCocina;
using Bital.Domain.Entities.DietasCocina;
using Bital.Domain.Enums;

namespace Bital.Infrastructure.DietasCocina;

/// <summary>
/// Etiquetas y filtros del reporte de cocina alineados con la UI del proveedor.
/// </summary>
internal static class ReporteCocinaHelper
{
    internal static bool EsFilaReporteCocina(FilaDieta fila)
    {
        if (!DietasReglasNegocio.EstuvoComprometidaConCocina(fila))
            return false;

        if (!fila.TipoDietaId.HasValue && string.IsNullOrWhiteSpace(fila.DescripcionDieta))
            return false;

        if (DietasReglasNegocio.RequiereConsistencia(fila.Comida) && string.IsNullOrEmpty(fila.Consistencia))
            return false;

        return true;
    }

    internal static string EtiquetaComida(TiempoComida comida) =>
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

    internal static string NombreTipoDieta(FilaDieta fila) =>
        fila.DescripcionDieta?.Trim()
        ?? fila.TipoDieta?.Nombre?.Trim()
        ?? string.Empty;

    internal static string EtiquetaConsistencia(FilaDieta fila)
    {
        if (!DietasReglasNegocio.RequiereConsistencia(fila.Comida))
            return "No aplica";

        return string.IsNullOrWhiteSpace(fila.Consistencia) ? "Sin asignar" : fila.Consistencia.Trim();
    }

    internal static string EtiquetaEstadoVisible(FilaDieta fila, EtiquetaEnfermera? etiqueta)
    {
        if (etiqueta != null)
        {
            switch (etiqueta.EstadoLogistica.Trim().ToLowerInvariant())
            {
                case "pre_entregada":
                    return "Pre-entregada";
                case "entregada":
                    return "Entregada";
                case "devuelta":
                    return EsRechazo(etiqueta) ? "Rechazada" : "Recogida";
            }
        }

        if (fila.Estado == EstadoDieta.Cancelada)
        {
            if (DietasReglasNegocio.EsObservacionSalidaClinica(fila.Observaciones))
                return "Salida clínica";
            return "Cancelada";
        }

        return fila.Estado switch
        {
            EstadoDieta.Confirmada or EstadoDieta.EnPreparacion => "En gestión",
            EstadoDieta.ListaEnvio => "Lista p/ Despacho",
            EstadoDieta.EnRuta => "Despachada",
            EstadoDieta.Entregada or EstadoDieta.Consumida => "Entregada",
            EstadoDieta.Devuelta or EstadoDieta.NoConsumida => "Devuelta",
            _ => fila.Estado.ToString(),
        };
    }

    internal static string EtiquetaSeguimiento(FilaDieta fila, EtiquetaEnfermera? etiqueta)
    {
        if (etiqueta == null)
        {
            return fila.Estado == EstadoDieta.EnRuta ? "En tránsito" : string.Empty;
        }

        var logistica = etiqueta.EstadoLogistica.Trim().ToLowerInvariant();
        if (logistica == "devuelta")
            return EsRechazo(etiqueta) ? "Rechazada" : "Recogida";

        return logistica switch
        {
            "generada" => "Etiqueta generada",
            "impresa" => "Etiqueta impresa",
            "pre_entregada" => "Pre-entregada en enfermería",
            "entregada" => "Entregada al paciente",
            _ => etiqueta.EstadoLogistica,
        };
    }

    internal static string ConstruirAlertas(FilaDieta fila)
    {
        var alertas = new List<string>();

        if (fila.Aislado)
            alertas.Add("Aislado");

        if (fila.Alergico && !string.IsNullOrWhiteSpace(fila.Alergias))
            alertas.Add($"Alergia: {fila.Alergias.Trim()}");
        else if (fila.Alergico)
            alertas.Add("Alergia");

        if (DietasReglasNegocio.EsSalidaClinicaSostenida(fila))
            alertas.Add("Salida clínica: enviar (asume la clínica)");

        if (fila.CancelacionTardia)
            alertas.Add("Cancelación tardía");

        return string.Join("; ", alertas);
    }

    internal static bool OrdenEnTransito(FilaDieta fila, EtiquetaEnfermera? etiqueta)
    {
        if (fila.Estado != EstadoDieta.EnRuta)
            return false;

        if (etiqueta == null)
            return true;

        var logistica = etiqueta.EstadoLogistica.Trim().ToLowerInvariant();
        return logistica is "generada" or "impresa" or "";
    }

    internal static bool CoincideFiltros(
        FilaDieta fila,
        EtiquetaEnfermera? etiqueta,
        FiltrosReporteCocinaDto filtros,
        int? numeroOrden = null)
    {
        if (!EsValorTodos(filtros.Pabellon) &&
            !string.Equals(fila.Pabellon, filtros.Pabellon, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (!EsValorTodos(filtros.Habitacion, "Todas") &&
            !string.Equals(fila.Habitacion, filtros.Habitacion, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        var tipoDieta = NombreTipoDieta(fila);
        if (!EsValorTodos(filtros.TipoDieta) &&
            !string.Equals(tipoDieta, filtros.TipoDieta, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        // Se compara la consistencia cruda, igual que la vista del proveedor: la
        // etiqueta «No aplica» / «Sin asignar» es solo presentación del reporte.
        if (!EsValorTodos(filtros.Consistencia, "Todas") &&
            !string.Equals(fila.Consistencia?.Trim(), filtros.Consistencia?.Trim(), StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (filtros.SoloAislados == true && !fila.Aislado)
            return false;

        if (!EsValorTodos(filtros.EstadoCocina) &&
            !CoincideEstadoCocina(fila, etiqueta, filtros.EstadoCocina!))
        {
            return false;
        }

        if (!EsValorTodos(filtros.Seguimiento) &&
            !CoincideSeguimiento(fila, etiqueta, filtros.Seguimiento!))
        {
            return false;
        }

        var busqueda = filtros.Busqueda?.Trim();
        if (!string.IsNullOrEmpty(busqueda))
        {
            var q = busqueda;
            var codigoEtiqueta = etiqueta?.Codigo ?? string.Empty;
            var hay =
                fila.Paciente.Contains(q, StringComparison.OrdinalIgnoreCase) ||
                fila.PacienteId.Contains(q, StringComparison.OrdinalIgnoreCase) ||
                (fila.Cedula ?? string.Empty).Contains(q, StringComparison.OrdinalIgnoreCase) ||
                fila.Habitacion.Contains(q, StringComparison.OrdinalIgnoreCase) ||
                fila.Id.ToString().Contains(q, StringComparison.OrdinalIgnoreCase) ||
                (numeroOrden?.ToString(CultureInfo.InvariantCulture) ?? string.Empty)
                    .Contains(q, StringComparison.OrdinalIgnoreCase) ||
                codigoEtiqueta.Contains(q, StringComparison.OrdinalIgnoreCase);

            if (!hay)
                return false;
        }

        return true;
    }

    private static bool EsValorTodos(string? valor, string todos = "Todos") =>
        string.IsNullOrWhiteSpace(valor) ||
        string.Equals(valor.Trim(), todos, StringComparison.OrdinalIgnoreCase) ||
        string.Equals(valor.Trim(), "Todos", StringComparison.OrdinalIgnoreCase);

    private static string ResolverEstadoCocina(FilaDieta fila)
    {
        return fila.Estado switch
        {
            EstadoDieta.Confirmada or EstadoDieta.EnPreparacion => "en_preparacion",
            EstadoDieta.ListaEnvio => "lista",
            EstadoDieta.EnRuta or EstadoDieta.Entregada or EstadoDieta.Consumida
                or EstadoDieta.Devuelta or EstadoDieta.NoConsumida => "despachada",
            EstadoDieta.Cancelada => "cancelada",
            _ => "en_preparacion",
        };
    }

    private static bool OrdenEnGestion(FilaDieta fila) =>
        fila.Estado is EstadoDieta.Confirmada or EstadoDieta.EnPreparacion;

    private static bool CoincideEstadoCocina(FilaDieta fila, EtiquetaEnfermera? etiqueta, string filtro)
    {
        var normalizado = filtro.Trim().ToLowerInvariant();
        if (normalizado == "en_preparacion")
            return OrdenEnGestion(fila);
        if (normalizado == "salida_clinica")
        {
            return fila.Estado == EstadoDieta.Cancelada
                && DietasReglasNegocio.EsObservacionSalidaClinica(fila.Observaciones);
        }
        if (normalizado == "cancelada")
        {
            return fila.Estado == EstadoDieta.Cancelada
                && !DietasReglasNegocio.EsObservacionSalidaClinica(fila.Observaciones);
        }

        return ResolverEstadoCocina(fila) == normalizado;
    }

    private static bool CoincideSeguimiento(FilaDieta fila, EtiquetaEnfermera? etiqueta, string filtro)
    {
        var normalizado = filtro.Trim().ToLowerInvariant();
        var logistica = etiqueta?.EstadoLogistica.Trim().ToLowerInvariant();

        return normalizado switch
        {
            "en_transito" => OrdenEnTransito(fila, etiqueta),
            "pre_entregada" => logistica == "pre_entregada",
            "entregada" => logistica == "entregada",
            "devuelta" => logistica == "devuelta" && etiqueta != null && EsRechazo(etiqueta),
            "recogida" => logistica == "devuelta" && etiqueta != null && !EsRechazo(etiqueta),
            _ => true,
        };
    }

    private static bool EsRechazo(EtiquetaEnfermera etiqueta) =>
        MotivosEtiquetasCatalogo.EsRechazoAntesEntrega(
            etiqueta.MotivoDevolucion,
            etiqueta.EntregadaEn.HasValue);
}
