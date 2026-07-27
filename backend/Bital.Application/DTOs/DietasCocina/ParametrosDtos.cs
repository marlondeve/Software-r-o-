using System;
using System.Collections.Generic;

namespace Bital.Application.DTOs.DietasCocina;

// ===== Tiempos de comida =====

public record TiemposComidaConfiguracionDto
{
    public required List<TiempoComidaDto> Tiempos { get; init; }
    public string ModoCarga { get; init; } = "por-comida";
}

public record TiempoComidaDto
{
    public Guid Id { get; init; }
    public required string Comida { get; init; }
    public required string HoraPreparacion { get; init; } // "HH:mm"
    public required string HoraCierre { get; init; } // "HH:mm"
    public required string HoraEntrega { get; init; } // "HH:mm"
    public bool Activo { get; init; }
    public int MinutosAlertaCierre { get; init; }
    public string? Observaciones { get; init; }
    public required string ModificadoPor { get; init; }
    public DateTime ModificadoEn { get; init; }
}

public record ActualizarTiemposComidaDto
{
    public required List<TiempoComidaItemDto> Tiempos { get; init; }
    public required string Usuario { get; init; }
    public string? ModoCarga { get; init; }
}

public record TiempoComidaItemDto
{
    public required string Comida { get; init; }
    public required string HoraPreparacion { get; init; }
    public required string HoraCierre { get; init; }
    public required string HoraEntrega { get; init; }
    public bool Activo { get; init; }
    public int MinutosAlertaCierre { get; init; }
    public string? Observaciones { get; init; }
}

// ===== Categorías de edad =====

public record CategoriaEdadDto
{
    public Guid Id { get; init; }
    public required string Nombre { get; init; }
    public int EdadMinima { get; init; }
    public int EdadMaxima { get; init; }
    public decimal FactorPorcion { get; init; }
    public string? Descripcion { get; init; }
    public bool Activa { get; init; }
    public int Orden { get; init; }
    public required string ModificadoPor { get; init; }
    public DateTime ModificadoEn { get; init; }
}

public record ActualizarCategoriasEdadDto
{
    public required List<CategoriaEdadItemDto> Categorias { get; init; }
    public required string Usuario { get; init; }
}

public record CategoriaEdadItemDto
{
    public required string Nombre { get; init; }
    public int EdadMinima { get; init; }
    public int EdadMaxima { get; init; }
    public decimal FactorPorcion { get; init; }
    public string? Descripcion { get; init; }
    public bool Activa { get; init; }
    public int Orden { get; init; }
}

// ===== Clasificación de edad =====

public record ClasificarEdadRequestDto
{
    public required int Edad { get; init; }
}

public record ClasificarEdadResponseDto
{
    public required string Categoria { get; init; }
    public required int EdadMinima { get; init; }
    public required int EdadMaxima { get; init; }
    public required decimal FactorPorcion { get; init; }
}
