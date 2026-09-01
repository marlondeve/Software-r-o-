using System;

namespace Bital.Application.DTOs.DietasCocina;

public class FilaConciliacionDto
{
    public Guid Id { get; set; }
    public DateTime PeriodoDesde { get; set; }
    public DateTime PeriodoHasta { get; set; }
    public string Periodo { get; set; } = string.Empty;
    public string Comida { get; set; } = string.Empty;
    public string LineaFcr { get; set; } = string.Empty;
    public string EtiquetaPlanilla { get; set; } = string.Empty;
    public decimal Tarifa { get; set; }
    public int CantidadSistema { get; set; }
    public int? CantidadCocina { get; set; }
    public decimal ValorSistema { get; set; }
    public decimal? ValorCocina { get; set; }
    public int DiferenciaCantidad { get; set; }
    public decimal? DiferenciaEconomica { get; set; }
    public int SinEtiqueta { get; set; }
    public int Huerfanas { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string? Motivo { get; set; }
    public string? Observaciones { get; set; }
    public string? ResueltoPor { get; set; }
    public DateTime? ResueltaEn { get; set; }
    public string? NumeroFactura { get; set; }
    public string? FacturaDocumentoUrl { get; set; }
}

public class MarcarConciliadoDto
{
    public string Motivo { get; set; } = string.Empty;
    public string Observaciones { get; set; } = string.Empty;
}

public class MarcarPendienteRevisionDto
{
    public string Motivo { get; set; } = string.Empty;
    public string? Observaciones { get; set; }
}

public class RegistroBandejaConciliacionDto
{
    public Guid? FilaDietaId { get; set; }
    public string Fecha { get; set; } = string.Empty;
    public string Paciente { get; set; } = string.Empty;
    public string Cedula { get; set; } = string.Empty;
    public string Pabellon { get; set; } = string.Empty;
    public string Habitacion { get; set; } = string.Empty;
    public string TipoClinico { get; set; } = string.Empty;
    public string LineaFcr { get; set; } = string.Empty;
    public string EstadoDieta { get; set; } = string.Empty;
    public string? EstadoOrden { get; set; }
    public bool TieneEtiqueta { get; set; }
    public bool EsHuerfana { get; set; }
    public string[] Alertas { get; set; } = [];
}

public class DetalleConciliacionDto
{
    public FilaConciliacionDto Linea { get; set; } = new();
    public RegistroBandejaConciliacionDto[] Registros { get; set; } = [];
    public string[] Alertas { get; set; } = [];
    public string[] Recomendaciones { get; set; } = [];
}

public class KpiConciliacionDto
{
    public string Clave { get; set; } = string.Empty;
    public string Etiqueta { get; set; } = string.Empty;
    public decimal Valor { get; set; }
    public string Formato { get; set; } = "numero";
    public string? Tendencia { get; set; }
    public string? Comparacion { get; set; }
}

public class ListaConciliacionDto
{
    public List<FilaConciliacionDto> Data { get; set; } = new();
    public MetaPaginacionDto Meta { get; set; } = new();
}

public class LineaPlanillaCocinaDto
{
    public string? Comida { get; set; }
    public string? LineaFcr { get; set; }
    public string? Linea { get; set; }
    public string? Etiqueta { get; set; }
    public int Cantidad { get; set; }
}

public class CargarPlanillaCocinaDto
{
    public DateTime? Desde { get; set; }
    public DateTime? Hasta { get; set; }
    public string? Periodo { get; set; }
    public string? NumeroFactura { get; set; }
    public List<LineaPlanillaCocinaDto> Lineas { get; set; } = new();
}
