using Bital.Domain.Common;

namespace Bital.Domain.Entities.Encuestas;

public class ConfiguracionEncuesta : EntityBase
{
    public string Clave { get; set; } = string.Empty;
    public string Valor { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public bool Activo { get; set; } = true;
}