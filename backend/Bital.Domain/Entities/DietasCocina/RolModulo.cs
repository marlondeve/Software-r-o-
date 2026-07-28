using Bital.Domain.Common;

namespace Bital.Domain.Entities.DietasCocina;

public class RolModulo : EntityBase
{
    public string Nombre { get; set; } = string.Empty;
    public bool EsSistema { get; set; }
    public bool Activo { get; set; } = true;

    public ICollection<UsuarioModulo> Usuarios { get; set; } = new List<UsuarioModulo>();
    public ICollection<PermisoRol> Permisos { get; set; } = new List<PermisoRol>();
}
