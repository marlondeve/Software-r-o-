using Bital.Domain.Common;
using Bital.Domain.Enums;

namespace Bital.Domain.Entities.DietasCocina;

public class PermisoRol : EntityBase
{
    public Guid RolModuloId { get; set; }
    public RolModulo RolModulo { get; set; } = null!;
    public RutaDietas Ruta { get; set; }
    public bool Permitido { get; set; } = true;
}
