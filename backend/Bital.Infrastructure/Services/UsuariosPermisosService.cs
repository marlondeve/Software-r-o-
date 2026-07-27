using Bital.Application.DTOs.DietasCocina;
using Bital.Application.Interfaces;
using Bital.Domain.Entities.DietasCocina;
using Bital.Domain.Enums;
using Bital.Infrastructure.Data;
using Bital.Infrastructure.DietasCocina;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
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
        var query = _context.UsuariosModulo.AsQueryable();

        if (filtros.Rol.HasValue)
            query = query.Where(u => u.Rol == filtros.Rol.Value);

        if (filtros.Activo.HasValue)
            query = query.Where(u => u.Activo == filtros.Activo.Value);

        var total = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(total / (double)filtros.PageSize);

        var usuarios = await query
            .OrderBy(u => u.NombreCompleto)
            .Skip((filtros.Page - 1) * filtros.PageSize)
            .Take(filtros.PageSize)
            .Select(u => new UsuarioModuloDto
            {
                Id = u.Id,
                NombreCompleto = u.NombreCompleto,
                Email = u.Email,
                Identificacion = u.Identificacion,
                Rol = u.Rol,
                RolNombre = u.Rol.ToString(),
                Activo = u.Activo,
                UltimoAcceso = u.UltimoAcceso,
                CreadoEn = u.CreadoEn
            })
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
        // Validar email único
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

        var usuario = new UsuarioModulo
        {
            Id = Guid.NewGuid(),
            NombreCompleto = dto.NombreCompleto,
            Email = dto.Email,
            Identificacion = identificacion,
            Rol = dto.Rol,
            Activo = true,
            Observaciones = dto.Observaciones,
            CreadoEn = DateTime.UtcNow,
            CreadoPor = creadoPor
        };

        _context.UsuariosModulo.Add(usuario);
        await _context.SaveChangesAsync();

        return new UsuarioModuloDto
        {
            Id = usuario.Id,
            NombreCompleto = usuario.NombreCompleto,
            Email = usuario.Email,
            Identificacion = usuario.Identificacion,
            Rol = usuario.Rol,
            RolNombre = usuario.Rol.ToString(),
            Activo = usuario.Activo,
            UltimoAcceso = usuario.UltimoAcceso,
            CreadoEn = usuario.CreadoEn
        };
    }

    public async Task<UsuarioModuloDto> EditarUsuarioAsync(Guid id, EditarUsuarioDto dto)
    {
        var usuario = await _context.UsuariosModulo.FindAsync(id);
        if (usuario == null)
            throw new KeyNotFoundException($"Usuario con ID {id} no encontrado");

        // Validar email único (excepto el actual)
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

        return new UsuarioModuloDto
        {
            Id = usuario.Id,
            NombreCompleto = usuario.NombreCompleto,
            Email = usuario.Email,
            Identificacion = usuario.Identificacion,
            Rol = usuario.Rol,
            RolNombre = usuario.Rol.ToString(),
            Activo = usuario.Activo,
            UltimoAcceso = usuario.UltimoAcceso,
            CreadoEn = usuario.CreadoEn
        };
    }

    public async Task<UsuarioModuloDto> CambiarRolAsync(Guid id, CambiarRolDto dto)
    {
        var usuario = await _context.UsuariosModulo.FindAsync(id);
        if (usuario == null)
            throw new KeyNotFoundException($"Usuario con ID {id} no encontrado");

        usuario.Rol = dto.Rol;
        await _context.SaveChangesAsync();

        return new UsuarioModuloDto
        {
            Id = usuario.Id,
            NombreCompleto = usuario.NombreCompleto,
            Email = usuario.Email,
            Identificacion = usuario.Identificacion,
            Rol = usuario.Rol,
            RolNombre = usuario.Rol.ToString(),
            Activo = usuario.Activo,
            UltimoAcceso = usuario.UltimoAcceso,
            CreadoEn = usuario.CreadoEn
        };
    }

    public async Task<UsuarioModuloDto> CambiarEstadoAsync(Guid id, CambiarEstadoDto dto)
    {
        var usuario = await _context.UsuariosModulo.FindAsync(id);
        if (usuario == null)
            throw new KeyNotFoundException($"Usuario con ID {id} no encontrado");

        usuario.Activo = dto.Activo;
        await _context.SaveChangesAsync();

        return new UsuarioModuloDto
        {
            Id = usuario.Id,
            NombreCompleto = usuario.NombreCompleto,
            Email = usuario.Email,
            Identificacion = usuario.Identificacion,
            Rol = usuario.Rol,
            RolNombre = usuario.Rol.ToString(),
            Activo = usuario.Activo,
            UltimoAcceso = usuario.UltimoAcceso,
            CreadoEn = usuario.CreadoEn
        };
    }

    public async Task<MatrizPermisosDto> ObtenerMatrizPermisosAsync()
    {
        var permisos = await _context.PermisosRol
            .Where(p => p.Permitido)
            .ToListAsync();

        var matriz = new Dictionary<RolDietas, List<RutaDietas>>();

        foreach (RolDietas rol in Enum.GetValues(typeof(RolDietas)))
        {
            matriz[rol] = permisos
                .Where(p => p.Rol == rol)
                .Select(p => p.Ruta)
                .OrderBy(r => r)
                .ToList();
        }

        return new MatrizPermisosDto { Data = matriz };
    }

    public async Task ActualizarPermisosRolAsync(RolDietas rol, ActualizarPermisosRolDto dto)
    {
        // Eliminar permisos anteriores del rol
        var permisosAnteriores = await _context.PermisosRol
            .Where(p => p.Rol == rol)
            .ToListAsync();

        _context.PermisosRol.RemoveRange(permisosAnteriores);

        // Crear nuevos permisos
        var nuevosPermisos = dto.Rutas.Select(ruta => new PermisoRol
        {
            Id = Guid.NewGuid(),
            Rol = rol,
            Ruta = ruta,
            Permitido = true,
            CreadoEn = DateTime.UtcNow,
            CreadoPor = "system"
        }).ToList();

        _context.PermisosRol.AddRange(nuevosPermisos);
        await _context.SaveChangesAsync();
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
            Rol = usuario.Rol,
            RolNombre = usuario.Rol.ToString(),
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
