using Bital.Domain.Common;

namespace Bital.Domain.Entities.DietasCocina;

/// <summary>
/// Categoría de edad para clasificación de pacientes y cálculo de porciones
/// </summary>
public class CategoriaEdad : EntityBase
{
    /// <summary>
    /// Nombre de la categoría (ej: Lactante, Niño, Adolescente, Adulto, Adulto Mayor)
    /// </summary>
    public required string Nombre { get; set; }

    /// <summary>
    /// Edad mínima en años (inclusivo)
    /// </summary>
    public required int EdadMinima { get; set; }

    /// <summary>
    /// Edad máxima en años (inclusivo)
    /// </summary>
    public required int EdadMaxima { get; set; }

    /// <summary>
    /// Factor de ajuste de porción (1.0 = porción estándar)
    /// </summary>
    public decimal FactorPorcion { get; set; } = 1.0m;

    /// <summary>
    /// Descripción adicional de la categoría
    /// </summary>
    public string? Descripcion { get; set; }

    /// <summary>
    /// Indica si está activa esta categoría
    /// </summary>
    public bool Activa { get; set; } = true;

    /// <summary>
    /// Orden de visualización
    /// </summary>
    public int Orden { get; set; }

    /// <summary>
    /// Usuario que realizó la última modificación
    /// </summary>
    public string ModificadoPor { get; set; } = string.Empty;

    /// <summary>
    /// Fecha de última modificación
    /// </summary>
    public DateTime ModificadoEn { get; set; } = DateTime.UtcNow;
}
