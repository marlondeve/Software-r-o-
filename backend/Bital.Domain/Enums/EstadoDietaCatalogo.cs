namespace Bital.Domain.Enums;

/// <summary>
/// Estado de vigencia de una tarifa de dieta
/// </summary>
public enum EstadoDietaCatalogo
{
    /// <summary>
    /// Vigente en la fecha actual
    /// </summary>
    Vigente = 1,

    /// <summary>
    /// Programada para el futuro
    /// </summary>
    Programada = 2,

    /// <summary>
    /// Fecha de vigencia ya pasó
    /// </summary>
    Vencida = 3
}
