namespace Bital.Infrastructure.DietasCocina;

using Bital.Domain.Enums;

/// <summary>
/// Reglas de devolución/rechazo/recogida alineadas con devolucionConfig.ts.
/// </summary>
public static class EtiquetasReglasNegocio
{
    public static string NormalizarMotivoDevolucion(string motivo) =>
        MotivosEtiquetasCatalogo.NormalizarMotivoDevolucion(motivo);

    public static void ValidarDevolucion(string estadoLogistica, string motivo, string estadoDieta)
    {
        var motivoNormalizado = NormalizarMotivoDevolucion(motivo);

        if (string.IsNullOrWhiteSpace(motivoNormalizado))
            throw new InvalidOperationException("El motivo de devolución es obligatorio.");

        var esAntesEntrega = estadoLogistica == "pre_entregada";
        var esPostEntrega = estadoLogistica == "entregada";

        if (!esAntesEntrega && !esPostEntrega)
        {
            throw new InvalidOperationException(
                "Solo se pueden devolver etiquetas pre-entregadas o entregadas.");
        }

        if (esAntesEntrega)
        {
            if (!MotivosEtiquetasCatalogo.EsMotivoAntesEntrega(motivoNormalizado))
            {
                throw new InvalidOperationException(
                    "El motivo no corresponde a un rechazo antes de entrega al paciente.");
            }

            if (!string.Equals(estadoDieta, "No entregada", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    "Para rechazo antes de entrega, el estado de la dieta debe ser «No entregada».");
            }

            return;
        }

        if (!MotivosEtiquetasCatalogo.EsMotivoPostEntrega(motivoNormalizado))
        {
            throw new InvalidOperationException(
                "El motivo no corresponde a una recogida post-entrega.");
        }

        var estadoEsperado = EstadoDietaDevolucionPorMotivo(motivoNormalizado);
        if (!string.Equals(estadoDieta, estadoEsperado, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                $"El estado de la dieta «{estadoDieta}» no coincide con el motivo «{motivoNormalizado}».");
        }
    }

    public static string EstadoDietaDevolucionPorMotivo(string motivoNormalizado) =>
        motivoNormalizado switch
        {
            "Se consumió" => "Consumida",
            "Consumo parcial" => "Consumida parcialmente",
            "No se consumió" or "Bandeja sin abrir" => "No consumida",
            _ => "Recogida",
        };

    public static RutaDietas PermisoDevolucionPorEstado(string estadoLogistica) =>
        estadoLogistica switch
        {
            "pre_entregada" => RutaDietas.RechazoAntesEntrega,
            "entregada" => RutaDietas.RecogidaBandeja,
            _ => throw new InvalidOperationException("Estado logístico no válido para devolución."),
        };
}
