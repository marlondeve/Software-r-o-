namespace Bital.Application.DTOs.DietasCocina;

/// <summary>
/// DTO para filtros avanzados de búsqueda de dietas
/// </summary>
public class FiltrosDietasDto
{
    /// <summary>
    /// Fecha operativa
    /// </summary>
    public DateTime? Fecha { get; set; }

    /// <summary>
    /// Tiempo de comida
    /// </summary>
    public string? Comida { get; set; }

    /// <summary>
    /// Servicio hospitalario
    /// </summary>
    public string? Servicio { get; set; }

    /// <summary>
    /// Pabellón
    /// </summary>
    public string? Pabellon { get; set; }

    /// <summary>
    /// Estado de la dieta
    /// </summary>
    public string? Estado { get; set; }

    /// <summary>
    /// Búsqueda por nombre paciente o cédula
    /// </summary>
    public string? Busqueda { get; set; }

    /// <summary>
    /// Solo pendientes de confirmar
    /// </summary>
    public bool SoloPendientes { get; set; }

    /// <summary>
    /// Solo con novedades
    /// </summary>
    public bool SoloConNovedades { get; set; }
}
