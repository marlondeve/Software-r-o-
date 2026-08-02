namespace Bital.Application.DTOs.DietasCocina;

// ===== Filtros =====

public record FiltrosAuditoriaDto
{
    public string? Modulo { get; init; }
    public string? Accion { get; init; }
    public string? Actor { get; init; }
    public string? Resultado { get; init; }
    public DateTime? Desde { get; init; }
    public DateTime? Hasta { get; init; }
    public string? Usuario { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 24;
}

// ===== Lista de eventos =====

public record EventoAuditoriaDto
{
    public Guid Id { get; init; }
    public required string Modulo { get; init; }
    public required string Accion { get; init; }
    public required string Resultado { get; init; }
    public required string Usuario { get; init; }
    public DateTime FechaEvento { get; init; }
    public string? TipoEntidad { get; init; }
    public Guid? EntidadId { get; init; }
    public string? DireccionIp { get; init; }
    public int? DuracionMs { get; init; }
    public string? DatosAntes { get; init; }
    public string? DatosDespues { get; init; }
}

public record ListaEventosAuditoriaDto
{
    public required List<EventoAuditoriaDto> Data { get; init; }
    public required MetaPaginacionDto Meta { get; init; }
}

public record MetaPaginacionDto
{
    public int Total { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
    public int TotalPages { get; init; }
}

// ===== Detalle de evento =====

public record DetalleAuditoriaDto
{
    public Guid Id { get; init; }
    public required string Modulo { get; init; }
    public required string Accion { get; init; }
    public required string Resultado { get; init; }
    public required string Usuario { get; init; }
    public DateTime FechaEvento { get; init; }
    public string? TipoEntidad { get; init; }
    public Guid? EntidadId { get; init; }
    public string? DireccionIp { get; init; }
    public string? DatosAntes { get; init; }
    public string? DatosDespues { get; init; }
    public string? Metadata { get; init; }
    public string? MensajeError { get; init; }
    public int? DuracionMs { get; init; }
}
