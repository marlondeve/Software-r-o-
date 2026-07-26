namespace Bital.Domain.Enums;

/// <summary>
/// Estados del ciclo de vida de una dieta
/// </summary>
public enum EstadoDieta
{
    /// <summary>
    /// Sin solicitud
    /// </summary>
    Pendiente = 1,

    /// <summary>
    /// Guardado temporal sin confirmar
    /// </summary>
    Guardado = 2,

    /// <summary>
    /// Solicitada por nutrición (esperando confirmación final)
    /// </summary>
    Solicitada = 3,

    /// <summary>
    /// Confirmada y enviada a cocina
    /// </summary>
    Confirmada = 4,

    /// <summary>
    /// En preparación en cocina
    /// </summary>
    EnPreparacion = 5,

    /// <summary>
    /// Lista para envío
    /// </summary>
    ListaEnvio = 6,

    /// <summary>
    /// En ruta a pabellón
    /// </summary>
    EnRuta = 7,

    /// <summary>
    /// Entregada al paciente
    /// </summary>
    Entregada = 8,

    /// <summary>
    /// Consumida por el paciente
    /// </summary>
    Consumida = 9,

    /// <summary>
    /// Cancelada antes o después de confirmación
    /// </summary>
    Cancelada = 10,

    /// <summary>
    /// No consumida (rechazada por paciente)
    /// </summary>
    NoConsumida = 11,

    /// <summary>
    /// Devuelta (devolución registrada por enfermería)
    /// </summary>
    Devuelta = 12
}
