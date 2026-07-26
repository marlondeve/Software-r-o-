namespace Bital.Domain.Common;

/// <summary>
/// Clase base para entidades con auditoría de creación y modificación
/// </summary>
public abstract class EntityBase
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;
    public string CreadoPor { get; set; } = string.Empty;
    public DateTime? ModificadoEn { get; set; }
    public string? ModificadoPor { get; set; }
}
