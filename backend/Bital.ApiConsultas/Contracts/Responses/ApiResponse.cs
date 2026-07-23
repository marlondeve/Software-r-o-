namespace Bital.ApiConsultas.Contracts.Responses;

/// <summary>
/// Wrapper genérico para respuestas exitosas de la API
/// </summary>
public class ApiResponse<T>
{
    /// <summary>
    /// Datos de la respuesta
    /// </summary>
    public T Data { get; set; } = default!;

    /// <summary>
    /// Timestamp de la respuesta en UTC
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Versión de la API
    /// </summary>
    public string Version { get; set; } = "v1";

    /// <summary>
    /// Constructor con datos
    /// </summary>
    public ApiResponse(T data)
    {
        Data = data;
    }

    /// <summary>
    /// Constructor vacío
    /// </summary>
    public ApiResponse() { }
}

/// <summary>
/// Respuesta con paginación
/// </summary>
public class PagedApiResponse<T> : ApiResponse<T>
{
    /// <summary>
    /// Información de paginación
    /// </summary>
    public PaginationMetadata Pagination { get; set; } = null!;

    public PagedApiResponse(T data, PaginationMetadata pagination) : base(data)
    {
        Pagination = pagination;
    }

    public PagedApiResponse() { }
}

/// <summary>
/// Metadata de paginación
/// </summary>
public class PaginationMetadata
{
    public int CurrentPage { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
    public int TotalItems { get; set; }
    public bool HasPrevious => CurrentPage > 1;
    public bool HasNext => CurrentPage < TotalPages;
}
