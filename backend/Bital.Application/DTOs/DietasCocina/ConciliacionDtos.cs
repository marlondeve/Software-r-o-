using System;

namespace Bital.Application.DTOs.DietasCocina;

/// <summary>
/// DTO para línea de conciliación
/// </summary>
public class FilaConciliacionDto
{
    public Guid Id { get; set; }
    public string NumeroFactura { get; set; } = string.Empty;
    public string Proveedor { get; set; } = string.Empty;
    public string Periodo { get; set; } = string.Empty;
    public DateTime FechaOperativa { get; set; }
    public string Comida { get; set; } = string.Empty;
    public string PacienteId { get; set; } = string.Empty;
    public string Paciente { get; set; } = string.Empty;
    public string Cedula { get; set; } = string.Empty;
    public string Pabellon { get; set; } = string.Empty;
    public string Habitacion { get; set; } = string.Empty;
    public string TipoDieta { get; set; } = string.Empty;
    public string Consistencia { get; set; } = string.Empty;
    public int CantidadSolicitada { get; set; }
    public int CantidadEntregada { get; set; }
    public int CantidadFacturada { get; set; }
    public int Diferencia { get; set; }
    public decimal ValorUnitario { get; set; }
    public decimal ValorTotal { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string? Motivo { get; set; }
    public string? Observaciones { get; set; }
    public string? ResueltoPor { get; set; }
    public DateTime? ResueltaEn { get; set; }
    public Guid? FilaDietaId { get; set; }
    public Guid? EtiquetaId { get; set; }
}

/// <summary>
/// DTO para marcar línea como conciliada
/// </summary>
public class MarcarConciliadoDto
{
    public string Motivo { get; set; } = string.Empty;
    public string Observaciones { get; set; } = string.Empty;
}

/// <summary>
/// DTO para marcar línea como pendiente revisión
/// </summary>
public class MarcarPendienteRevisionDto
{
    public string Motivo { get; set; } = string.Empty;
    public string? Observaciones { get; set; }
}

/// <summary>
/// DTO para detalle de conciliación
/// </summary>
public class DetalleConciliacionDto
{
    public FilaConciliacionDto Linea { get; set; } = new();
    public EventoTrazabilidadDto[] EventosDieta { get; set; } = Array.Empty<EventoTrazabilidadDto>();
    public EtiquetaEnfermeraDto? Etiqueta { get; set; }
    public string[] Alertas { get; set; } = Array.Empty<string>();
    public string[] Recomendaciones { get; set; } = Array.Empty<string>();
}

/// <summary>
/// DTO para KPIs de conciliación
/// </summary>
public class KpiConciliacionDto
{
    public string Clave { get; set; } = string.Empty;
    public string Etiqueta { get; set; } = string.Empty;
    public decimal Valor { get; set; }
    public string Formato { get; set; } = "numero"; // numero, porcentaje, moneda
    public string? Tendencia { get; set; } // alza, baja, estable
    public string? Comparacion { get; set; }
}

/// <summary>
/// Lista paginada de líneas de conciliación
/// </summary>
public class ListaConciliacionDto
{
    public List<FilaConciliacionDto> Data { get; set; } = new();
    public MetaPaginacionDto Meta { get; set; } = new();
}
