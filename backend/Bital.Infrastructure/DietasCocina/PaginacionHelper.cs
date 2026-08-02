using Bital.Application.DTOs.DietasCocina;

namespace Bital.Infrastructure.DietasCocina;

/// <summary>
/// Normaliza parámetros de paginación con tope máximo de 24 registros por página.
/// </summary>
public static class PaginacionHelper
{
    public const int DefaultPageSize = 24;
    public const int MaxPageSize = 24;

    public static (int Page, int PageSize) Normalizar(int page, int pageSize)
    {
        var pagina = page < 1 ? 1 : page;
        var tamano = pageSize < 1 ? DefaultPageSize : Math.Min(pageSize, MaxPageSize);
        return (pagina, tamano);
    }

    public static MetaPaginacionDto CrearMeta(int total, int page, int pageSize)
    {
        var totalPages = pageSize <= 0 ? 0 : (int)Math.Ceiling(total / (double)pageSize);
        return new MetaPaginacionDto
        {
            Total = total,
            Page = page,
            PageSize = pageSize,
            TotalPages = totalPages
        };
    }
}
