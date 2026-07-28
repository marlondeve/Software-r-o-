using Bital.Application.DTOs.DietasCocina;
using Bital.Application.Interfaces;
using Bital.Domain.Entities.DietasCocina;
using Bital.Domain.Enums;
using Bital.Infrastructure.Data;
using Bital.Infrastructure.DietasCocina;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace Bital.Infrastructure.Services;

public class UsuariosPermisosService : IUsuariosPermisosService
{
    private readonly BitalNegocioDbContext _context;

    public UsuariosPermisosService(BitalNegocioDbContext context)
    {
        _context = context;
    }

    public async Task<ListaUsuariosDto> ObtenerUsuariosAsync(FiltrosUsuariosDto filtros)
    {
        var query = _context.UsuariosModulo
            .Include(u => u.RolModulo)
            .AsQueryable();

        if (filtros.RolModuloId.HasValue)
            query = query.Where(u => u.RolModuloId == filtros.RolModuloId.Value);

        if (filtros.Activo.HasValue)
            query = query.Where(u => u.Activo == filtros.Activo.Value);

        var total = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(total / (double)filtros.PageSize);

        var usuarios = await query
            .OrderBy(u => u.NombreCompleto)
            .Skip((filtros.Page - 1) * filtros.PageSize)
            .Take(filtros.PageSize)
            .Select(u => MapUsuarioToDto(u))
            .ToListAsync();

        return new ListaUsuariosDto
        {
            Data = usuarios,
            Meta = new MetaPaginacionDto
            {
                Total = total,
                Page = filtros.Page,
                PageSize = filtros.PageSize,
                TotalPages = totalPages
            }
        };
    }

    public async Task<UsuarioModuloDto> CrearUsuarioAsync(CrearUsuarioDto dto, string creadoPor)
    {
        var existeEmail = await _context.UsuariosModulo.AnyAsync(u => u.Email == dto.Email);
        if (existeEmail)
            throw new InvalidOperationException($"Ya existe un usuario con el email {dto.Email}");

        var identificacion = dto.Identificacion?.Trim();
        if (string.IsNullOrEmpty(identificacion))
            throw new InvalidOperationException("El nombre de usuario es obligatorio.");

        var existeUsuario = await _context.UsuariosModulo
            .AnyAsync(u => u.Identificacion != null && u.Identificacion.ToLower() == identificacion.ToLower());
        if (existeUsuario)
            throw new InvalidOperationException($"Ya existe un usuario con el nombre {identificacion}");

        var rol = await _context.RolesModulo.FirstOrDefaultAsync(r => r.Id == dto.RolModuloId && r.Activo)
            ?? throw new InvalidOperationException("El rol seleccionado no existe o está inactivo.");

        var usuario = new UsuarioModulo
        {
            Id = Guid.NewGuid(),
            NombreCompleto = dto.NombreCompleto,
            Email = dto.Email,
            Identificacion = identificacion,
            RolModuloId = rol.Id,
            Activo = true,
            Observaciones = dto.Observaciones,
            CreadoEn = DateTime.UtcNow,
            CreadoPor = creadoPor
        };

        _context.UsuariosModulo.Add(usuario);
        await _context.SaveChangesAsync();

        usuario.RolModulo = rol;
        return MapUsuarioToDto(usuario);
    }

    public async Task<UsuarioModuloDto> EditarUsuarioAsync(Guid id, EditarUsuarioDto dto)
    {
        var usuario = await _context.UsuariosModulo
            .Include(u => u.RolModulo)
            .FirstOrDefaultAsync(u => u.Id == id)
            ?? throw new KeyNotFoundException($"Usuario con ID {id} no encontrado");

        var existeEmail = await _context.UsuariosModulo
            .AnyAsync(u => u.Email == dto.Email && u.Id != id);
        if (existeEmail)
            throw new InvalidOperationException($"Ya existe otro usuario con el email {dto.Email}");

        var identificacion = dto.Identificacion?.Trim();
        if (string.IsNullOrEmpty(identificacion))
            throw new InvalidOperationException("El nombre de usuario es obligatorio.");

        var existeUsuario = await _context.UsuariosModulo
            .AnyAsync(u =>
                u.Identificacion != null &&
                u.Identificacion.ToLower() == identificacion.ToLower() &&
                u.Id != id);
        if (existeUsuario)
            throw new InvalidOperationException($"Ya existe otro usuario con el nombre {identificacion}");

        usuario.NombreCompleto = dto.NombreCompleto;
        usuario.Email = dto.Email;
        usuario.Identificacion = identificacion;
        usuario.Observaciones = dto.Observaciones;

        await _context.SaveChangesAsync();
        return MapUsuarioToDto(usuario);
    }

    public async Task<UsuarioModuloDto> CambiarRolAsync(Guid id, CambiarRolDto dto)
    {
        var usuario = await _context.UsuariosModulo
            .Include(u => u.RolModulo)
            .FirstOrDefaultAsync(u => u.Id == id)
            ?? throw new KeyNotFoundException($"Usuario con ID {id} no encontrado");

        var rol = await _context.RolesModulo.FirstOrDefaultAsync(r => r.Id == dto.RolModuloId && r.Activo)
            ?? throw new InvalidOperationException("El rol seleccionado no existe o está inactivo.");

        usuario.RolModuloId = rol.Id;
        usuario.RolModulo = rol;
        await _context.SaveChangesAsync();

        return MapUsuarioToDto(usuario);
    }

    public async Task<UsuarioModuloDto> CambiarEstadoAsync(Guid id, CambiarEstadoDto dto)
    {
        var usuario = await _context.UsuariosModulo
            .Include(u => u.RolModulo)
            .FirstOrDefaultAsync(u => u.Id == id)
            ?? throw new KeyNotFoundException($"Usuario con ID {id} no encontrado");

        usuario.Activo = dto.Activo;
        await _context.SaveChangesAsync();

        return MapUsuarioToDto(usuario);
    }

    public async Task<List<RolModuloDto>> ListarRolesAsync()
    {
        var roles = await _context.RolesModulo
            .Where(r => r.Activo)
            .OrderBy(r => r.Nombre)
            .ToListAsync();

        var permisos = await _context.PermisosRol
            .Where(p => p.Permitido)
            .ToListAsync();

        return roles.Select(rol => new RolModuloDto
        {
            Id = rol.Id,
            Nombre = rol.Nombre,
            EsSistema = rol.EsSistema,
            Activo = rol.Activo,
            TotalPermisos = permisos.Count(p => p.RolModuloId == rol.Id),
        }).ToList();
    }

    public async Task<RolModuloDto> CrearRolAsync(CrearRolDto dto, string creadoPor)
    {
        var nombre = dto.Nombre.Trim();
        if (nombre.Length < 3)
            throw new InvalidOperationException("El nombre del rol debe tener al menos 3 caracteres.");

        var existe = await _context.RolesModulo
            .AnyAsync(r => r.Nombre.ToLower() == nombre.ToLower());
        if (existe)
            throw new InvalidOperationException($"Ya existe un rol con el nombre {nombre}.");

        var rutas = NormalizarRutasPermiso(dto.Rutas);

        var rol = new RolModulo
        {
            Id = Guid.NewGuid(),
            Nombre = nombre,
            EsSistema = false,
            Activo = true,
            CreadoEn = DateTime.UtcNow,
            CreadoPor = creadoPor,
        };

        _context.RolesModulo.Add(rol);
        _context.PermisosRol.AddRange(rutas.Select(ruta => new PermisoRol
        {
            Id = Guid.NewGuid(),
            RolModuloId = rol.Id,
            Ruta = ruta,
            Permitido = true,
            CreadoEn = DateTime.UtcNow,
            CreadoPor = creadoPor,
        }));

        await _context.SaveChangesAsync();

        return new RolModuloDto
        {
            Id = rol.Id,
            Nombre = rol.Nombre,
            EsSistema = rol.EsSistema,
            Activo = rol.Activo,
            TotalPermisos = rutas.Count,
        };
    }

    public async Task<MatrizPermisosDto> ObtenerMatrizPermisosAsync()
    {
        var roles = await _context.RolesModulo
            .Where(r => r.Activo)
            .OrderBy(r => r.Nombre)
            .ToListAsync();

        var permisos = await _context.PermisosRol
            .Where(p => p.Permitido)
            .ToListAsync();

        return new MatrizPermisosDto
        {
            Data = roles.Select(rol => new RolPermisosDetalleDto
            {
                Id = rol.Id,
                Nombre = rol.Nombre,
                EsSistema = rol.EsSistema,
                Rutas = permisos
                    .Where(p => p.RolModuloId == rol.Id)
                    .Select(p => p.Ruta)
                    .OrderBy(r => r)
                    .ToList(),
            }).ToList(),
        };
    }

    public async Task ActualizarPermisosRolAsync(Guid rolModuloId, ActualizarPermisosRolDto dto)
    {
        var rol = await _context.RolesModulo.FindAsync(rolModuloId)
            ?? throw new KeyNotFoundException($"Rol con ID {rolModuloId} no encontrado");

        var rutas = NormalizarRutasPermiso(dto.Rutas);

        var permisosAnteriores = await _context.PermisosRol
            .Where(p => p.RolModuloId == rol.Id)
            .ToListAsync();

        _context.PermisosRol.RemoveRange(permisosAnteriores);

        _context.PermisosRol.AddRange(rutas.Select(ruta => new PermisoRol
        {
            Id = Guid.NewGuid(),
            RolModuloId = rol.Id,
            Ruta = ruta,
            Permitido = true,
            CreadoEn = DateTime.UtcNow,
            CreadoPor = "system",
        }));

        await _context.SaveChangesAsync();
    }

    public async Task EliminarRolAsync(Guid rolModuloId)
    {
        var rol = await _context.RolesModulo.FindAsync(rolModuloId)
            ?? throw new KeyNotFoundException($"Rol con ID {rolModuloId} no encontrado");

        if (rol.EsSistema)
            throw new InvalidOperationException("No se pueden eliminar roles del sistema.");

        var tieneUsuarios = await _context.UsuariosModulo.AnyAsync(u => u.RolModuloId == rolModuloId);
        if (tieneUsuarios)
            throw new InvalidOperationException("No se puede eliminar un rol con usuarios asignados.");

        var permisos = await _context.PermisosRol.Where(p => p.RolModuloId == rolModuloId).ToListAsync();
        _context.PermisosRol.RemoveRange(permisos);
        _context.RolesModulo.Remove(rol);
        await _context.SaveChangesAsync();
    }

    public async Task<Guid?> ResolverRolModuloIdPorNombreAsync(string nombreRol)
    {
        var nombre = nombreRol.Trim();
        if (string.IsNullOrEmpty(nombre)) return null;

        var rol = await _context.RolesModulo
            .FirstOrDefaultAsync(r => r.Activo && r.Nombre.ToLower() == nombre.ToLower());

        return rol?.Id;
    }

    public async Task<RestablecerPasswordResponseDto> RestablecerPasswordAsync(Guid id, string solicitadoPor)
    {
        var usuario = await _context.UsuariosModulo.FirstOrDefaultAsync(u => u.Id == id)
            ?? throw new KeyNotFoundException($"Usuario {id} no encontrado");

        var passwordTemporal = GenerarPasswordTemporal();
        usuario.PasswordHash = HashPassword(passwordTemporal);
        usuario.ModificadoEn = DateTime.UtcNow;
        usuario.ModificadoPor = solicitadoPor;
        await _context.SaveChangesAsync();

        return new RestablecerPasswordResponseDto
        {
            PasswordTemporal = passwordTemporal,
            Mensaje = "Contraseña restablecida. Comuníquela al usuario por un canal seguro.",
        };
    }

    public async Task<LoginModuloResponseDto> LoginAsync(LoginModuloDto dto)
    {
        var usuarioLogin = dto.Usuario.Trim().ToLowerInvariant();
        if (string.IsNullOrEmpty(usuarioLogin))
            throw new UnauthorizedAccessException("Credenciales inválidas.");

        var usuario = await _context.UsuariosModulo
            .Include(u => u.RolModulo)
            .FirstOrDefaultAsync(u =>
                u.Identificacion != null &&
                u.Identificacion.ToLower() == usuarioLogin)
            ?? throw new UnauthorizedAccessException("Credenciales inválidas.");

        if (!usuario.Activo)
            throw new UnauthorizedAccessException("El usuario está inactivo.");

        if (string.IsNullOrEmpty(usuario.PasswordHash))
            throw new UnauthorizedAccessException("Debe solicitar un restablecimiento de contraseña al administrador.");

        if (!VerificarPassword(dto.Password, usuario.PasswordHash))
            throw new UnauthorizedAccessException("Credenciales inválidas.");

        usuario.UltimoAcceso = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return new LoginModuloResponseDto
        {
            Id = usuario.Id,
            Usuario = usuario.Identificacion ?? string.Empty,
            Email = usuario.Email,
            NombreCompleto = usuario.NombreCompleto,
            RolModuloId = usuario.RolModuloId,
            RolNombre = usuario.RolModulo.Nombre,
        };
    }

    public async Task<CambiarPasswordResponseDto> CambiarPasswordAsync(CambiarPasswordDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.PasswordNueva) || dto.PasswordNueva.Length < 8)
            throw new InvalidOperationException("La nueva contraseña debe tener al menos 8 caracteres.");

        if (dto.PasswordActual == dto.PasswordNueva)
            throw new InvalidOperationException("La nueva contraseña debe ser diferente a la actual.");

        var usuarioLogin = dto.Usuario.Trim().ToLowerInvariant();
        if (string.IsNullOrEmpty(usuarioLogin))
            throw new UnauthorizedAccessException("Credenciales inválidas.");

        var usuario = await _context.UsuariosModulo
            .FirstOrDefaultAsync(u =>
                u.Identificacion != null &&
                u.Identificacion.ToLower() == usuarioLogin)
            ?? throw new UnauthorizedAccessException("Credenciales inválidas.");

        if (!usuario.Activo)
            throw new UnauthorizedAccessException("El usuario está inactivo.");

        if (string.IsNullOrEmpty(usuario.PasswordHash) || !VerificarPassword(dto.PasswordActual, usuario.PasswordHash))
            throw new UnauthorizedAccessException("La contraseña actual es incorrecta.");

        usuario.PasswordHash = HashPassword(dto.PasswordNueva);
        usuario.ModificadoEn = DateTime.UtcNow;
        usuario.ModificadoPor = usuario.Identificacion ?? usuario.Email;
        await _context.SaveChangesAsync();

        return new CambiarPasswordResponseDto
        {
            Mensaje = "Contraseña actualizada correctamente. Ya puede iniciar sesión.",
        };
    }

    private static UsuarioModuloDto MapUsuarioToDto(UsuarioModulo usuario) => new()
    {
        Id = usuario.Id,
        NombreCompleto = usuario.NombreCompleto,
        Email = usuario.Email,
        Identificacion = usuario.Identificacion,
        RolModuloId = usuario.RolModuloId,
        RolNombre = usuario.RolModulo?.Nombre ?? string.Empty,
        Activo = usuario.Activo,
        UltimoAcceso = usuario.UltimoAcceso,
        CreadoEn = usuario.CreadoEn,
    };

    private static List<RutaDietas> NormalizarRutasPermiso(IEnumerable<RutaDietas> rutas)
    {
        var set = new HashSet<RutaDietas>(rutas);
        set.Add(RutaDietas.VerDashboard);
        return set.OrderBy(r => r).ToList();
    }

    private static bool VerificarPassword(string password, string hash)
    {
        return HashPassword(password) == hash;
    }

    private static string GenerarPasswordTemporal()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
        var bytes = RandomNumberGenerator.GetBytes(10);
        var sb = new StringBuilder(10);
        foreach (var b in bytes)
        {
            sb.Append(chars[b % chars.Length]);
        }

        return sb.ToString();
    }

    private static string HashPassword(string password)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
        return Convert.ToHexString(bytes);
    }
}
