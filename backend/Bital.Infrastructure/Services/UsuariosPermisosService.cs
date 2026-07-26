using Bital.Application.DTOs.DietasCocina;
using Bital.Application.Interfaces;
using Bital.Domain.Entities.DietasCocina;
using Bital.Domain.Enums;
using Bital.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

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

        var usuario = new UsuarioModulo
        {
            Id = Guid.NewGuid(),
            NombreCompleto = dto.NombreCompleto,
            Email = dto.Email,
            Identificacion = dto.Identificacion,
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

        usuario.NombreCompleto = dto.NombreCompleto;
        usuario.Email = dto.Email;
        usuario.Identificacion = dto.Identificacion;
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
}
