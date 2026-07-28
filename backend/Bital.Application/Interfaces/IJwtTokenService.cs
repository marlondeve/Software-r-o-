using Bital.Application.DTOs.DietasCocina;

namespace Bital.Application.Interfaces;

public interface IJwtTokenService
{
    string GenerateToken(LoginModuloResponseDto usuario);
}
