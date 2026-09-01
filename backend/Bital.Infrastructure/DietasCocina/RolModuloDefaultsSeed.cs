using Bital.Domain.Entities.DietasCocina;
using Bital.Domain.Enums;
using Bital.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Bital.Infrastructure.DietasCocina;

/// <summary>
/// Garantiza los roles de sistema del módulo Dietas y Cocina al iniciar la API.
/// </summary>
public static class RolModuloDefaultsSeed
{
    private const string UsuarioSeed = "seed-roles-modulo";

    public static async Task EnsureDefaultRolesAsync(
        BitalNegocioDbContext context,
        CancellationToken cancellationToken = default)
    {
        var ahora = DateTime.UtcNow;

        foreach (var (id, nombre) in RolModuloSeed.RolesPorDefecto)
        {
            var rol = await context.RolesModulo
                .FirstOrDefaultAsync(r => r.Id == id, cancellationToken)
                ?? await context.RolesModulo
                    .FirstOrDefaultAsync(r => r.Nombre == nombre, cancellationToken);

            if (rol is null)
            {
                context.RolesModulo.Add(new RolModulo
                {
                    Id = id,
                    Nombre = nombre,
                    EsSistema = true,
                    Activo = true,
                    CreadoEn = ahora,
                    CreadoPor = UsuarioSeed,
                });
                continue;
            }

            if (!string.Equals(rol.Nombre, nombre, StringComparison.Ordinal)
                || !rol.EsSistema
                || !rol.Activo)
            {
                rol.Nombre = nombre;
                rol.EsSistema = true;
                rol.Activo = true;
                rol.ModificadoEn = ahora;
                rol.ModificadoPor = UsuarioSeed;
            }
        }

        var doctor = await context.RolesModulo
            .FirstOrDefaultAsync(r => r.Id == RolModuloSeed.Doctor, cancellationToken);

        if (doctor is not null && doctor.Activo)
        {
            doctor.Activo = false;
            doctor.ModificadoEn = ahora;
            doctor.ModificadoPor = UsuarioSeed;
        }

        await context.SaveChangesAsync(cancellationToken);
        await EnsurePermisosPorDefectoAsync(context, ahora, cancellationToken);
    }

    /// <summary>
    /// Inserta permisos faltantes del seed (no quita personalizaciones del admin).
    /// </summary>
    private static async Task EnsurePermisosPorDefectoAsync(
        BitalNegocioDbContext context,
        DateTime ahora,
        CancellationToken cancellationToken)
    {
        foreach (var (rolIdCanonico, rutas) in RolModuloSeed.PermisosPorRolSistema)
        {
            if (rolIdCanonico == RolModuloSeed.Administrador)
                continue; // Admin se gestiona aparte; no forzar todo el enum

            var nombreRol = RolModuloSeed.RolesPorDefecto
                .First(r => r.Id == rolIdCanonico).Nombre;
            var rolId = await context.RolesModulo
                .Where(r => r.Id == rolIdCanonico || r.Nombre == nombreRol)
                .Select(r => r.Id)
                .FirstOrDefaultAsync(cancellationToken);
            if (rolId == Guid.Empty)
                continue;

            var existentes = await context.PermisosRol
                .Where(p => p.RolModuloId == rolId)
                .Select(p => p.Ruta)
                .ToListAsync(cancellationToken);
            var set = existentes.ToHashSet();

            foreach (var ruta in rutas)
            {
                if (set.Contains(ruta)) continue;
                context.PermisosRol.Add(new PermisoRol
                {
                    Id = Guid.NewGuid(),
                    RolModuloId = rolId,
                    Ruta = ruta,
                    Permitido = true,
                    CreadoEn = ahora,
                    CreadoPor = UsuarioSeed,
                });
            }
        }

        await context.SaveChangesAsync(cancellationToken);
    }
}
