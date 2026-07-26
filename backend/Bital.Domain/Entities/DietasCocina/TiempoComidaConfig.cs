using Bital.Domain.Common;
using Bital.Domain.Enums;

namespace Bital.Domain.Entities.DietasCocina;

/// <summary>
/// Configuración de ventanas horarias para cada tiempo de comida
/// </summary>
public class TiempoComidaConfig : EntityBase
{
    /// <summary>
    /// Tiempo de comida (Desayuno, Almuerzo, Cena, Merienda)
    /// </summary>
    public required TiempoComida Comida { get; set; }

    /// <summary>
    /// Hora de inicio de preparación en cocina
    /// </summary>
    public required TimeSpan HoraPreparacion { get; set; }

    /// <summary>
    /// Hora límite para solicitar dietas
    /// </summary>
    public required TimeSpan HoraCierre { get; set; }

    /// <summary>
    /// Hora programada de entrega
    /// </summary>
    public required TimeSpan HoraEntrega { get; set; }

    /// <summary>
    /// Indica si está activo este tiempo de comida
    /// </summary>
    public bool Activo { get; set; } = true;

    /// <summary>
    /// Tiempo en minutos antes del cierre para mostrar alertas
    /// </summary>
    public int MinutosAlertaCierre { get; set; } = 30;

    /// <summary>
    /// Observaciones adicionales
    /// </summary>
    public string? Observaciones { get; set; }

    /// <summary>
    /// Usuario que realizó la última modificación
    /// </summary>
    public string ModificadoPor { get; set; } = string.Empty;

    /// <summary>
    /// Fecha de última modificación
    /// </summary>
    public DateTime ModificadoEn { get; set; } = DateTime.UtcNow;
}
