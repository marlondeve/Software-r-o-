using System.Security.Claims;
using Bital.Application.DTOs.DietasCocina;

namespace Bital.ApiNegocio.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static string GetUsuarioIdentificacion(this ClaimsPrincipal user)
    {
        var identificacion = user.FindFirst("usuario")?.Value;
        if (!string.IsNullOrWhiteSpace(identificacion))
        {
            return identificacion;
        }

        throw new UnauthorizedAccessException("Usuario no autenticado.");
    }

    public static LoginModuloResponseDto ToLoginModuloResponse(this ClaimsPrincipal user)
    {
        var idClaim = user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException("Usuario no autenticado.");
        var rolModuloIdClaim = user.FindFirstValue("rol_modulo_id")
            ?? throw new UnauthorizedAccessException("Rol no disponible en la sesión.");

        return new LoginModuloResponseDto
        {
            Id = Guid.Parse(idClaim),
            Usuario = user.FindFirstValue("usuario") ?? string.Empty,
            Email = user.FindFirstValue(ClaimTypes.Email) ?? string.Empty,
            NombreCompleto = user.FindFirstValue(ClaimTypes.Name) ?? string.Empty,
            RolModuloId = Guid.Parse(rolModuloIdClaim),
            RolNombre = user.FindFirstValue("rol_nombre") ?? string.Empty,
            DebeCambiarPassword = user.FindFirstValue("debe_cambiar_password") == "true",
        };
    }
}
