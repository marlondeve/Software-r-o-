using Bital.Domain.Common;
using Bital.Domain.Enums;

namespace Bital.Domain.Entities.DietasCocina;

public class PermisoRol : EntityBase
{
    public RolDietas Rol { get; set; }
    public RutaDietas Ruta { get; set; }
    public bool Permitido { get; set; } = true;
}
