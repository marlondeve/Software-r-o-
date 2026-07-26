using System;
using System.Collections.Generic;

namespace Bital.Application.DTOs.DietasCocina;

// ===== Filtros =====
public record FiltrosReportesDto
{
    public DateTime? Desde { get; init; }
    public DateTime? Hasta { get; init; }
    public string? Servicio { get; init; }
    public string? Horario { get; init; }
    public string? Comida { get; init; }
}

// ===== KPIs base =====
public record KpiDto
{
    public required string Clave { get; init; }
    public required string Etiqueta { get; init; }
    public required decimal Valor { get; init; }
    public required string Formato { get; init; } // "numero", "porcentaje", "moneda"
    public string? Tendencia { get; init; } // "subiendo", "bajando", "estable"
    public string? Comparacion { get; init; }
}

// ===== Distribución =====
public record DistribucionItemDto
{
    public required string Categoria { get; init; }
    public required int Cantidad { get; init; }
    public required decimal Porcentaje { get; init; }
}

public record DistribucionDto
{
    public required string Tipo { get; init; } // "dietas", "servicios", "estados"
    public required List<DistribucionItemDto> Items { get; init; } = new();
}

// ===== Actividad reciente =====
public record ActividadDto
{
    public required DateTime Timestamp { get; init; }
    public required string Tipo { get; init; } // "orden", "etiqueta", "conciliacion"
    public required string Usuario { get; init; }
    public required string Descripcion { get; init; }
    public string? Entidad { get; init; }
    public string? EntidadId { get; init; }
}

// ===== Alertas =====
public record AlertaDto
{
    public required string Nivel { get; init; } // "critica", "alta", "media", "baja"
    public required string Tipo { get; init; }
    public required string Mensaje { get; init; }
    public required DateTime GeneradaEn { get; init; }
    public string? EntidadId { get; init; }
    public string? Accion { get; init; }
}

// ===== Dashboards =====
public record DashboardNutricionistaDto
{
    public required List<KpiDto> Kpis { get; init; } = new();
    public required List<DistribucionDto> Distribuciones { get; init; } = new();
    public required List<ActividadDto> ActividadReciente { get; init; } = new();
    public DateTime? FechaOperativa { get; init; }
    public string? Comida { get; init; }
}

public record DashboardProveedorDto
{
    public required List<KpiDto> Kpis { get; init; } = new();
    public required List<AlertaDto> Alertas { get; init; } = new();
    public string? Comida { get; init; }
    public required decimal ProgresoEntregas { get; init; }
}

public record DashboardEnfermeraDto
{
    public required List<KpiDto> Kpis { get; init; } = new();
    public required List<AlertaDto> Alertas { get; init; } = new();
    public string? Comida { get; init; }
    public string? Pabellon { get; init; }
}

// ===== Reportes =====
public record HitoReporteDto
{
    public required DateTime Fecha { get; init; }
    public required string Evento { get; init; }
    public required string Detalle { get; init; }
}

public record GraficoSerieDto
{
    public required string Etiqueta { get; init; }
    public required List<decimal> Valores { get; init; } = new();
}

public record GraficoDto
{
    public required string Tipo { get; init; } // "linea", "barra", "pie"
    public required string Titulo { get; init; }
    public required List<string> Categorias { get; init; } = new();
    public required List<GraficoSerieDto> Series { get; init; } = new();
}

public record HallazgoDto
{
    public required string Tipo { get; init; }
    public required string Descripcion { get; init; }
    public required string Severidad { get; init; }
    public required int Cantidad { get; init; }
}

public record ReporteNutricionistaDto
{
    public required List<KpiDto> Kpis { get; init; } = new();
    public required List<HitoReporteDto> Hitos { get; init; } = new();
    public required List<GraficoDto> Graficos { get; init; } = new();
    public required FiltrosReportesDto Filtros { get; init; }
}

public record ReporteProveedorDto
{
    public required List<KpiDto> Kpis { get; init; } = new();
    public required List<HallazgoDto> Hallazgos { get; init; } = new();
    public required List<GraficoDto> Graficos { get; init; } = new();
    public required FiltrosReportesDto Filtros { get; init; }
}
