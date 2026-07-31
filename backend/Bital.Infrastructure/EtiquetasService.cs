using Bital.Application.DTOs.DietasCocina;
using Bital.Application.Interfaces;
using Bital.Domain.Entities.DietasCocina;
using Bital.Domain.Enums;
using Bital.Infrastructure.Data;
using Bital.Infrastructure.DietasCocina;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Bital.Infrastructure.Services;

/// <summary>
/// Implementación del servicio de etiquetas y logística de enfermería
/// </summary>
public class EtiquetasService : IEtiquetasService
{
    private readonly BitalNegocioDbContext _context;
    private readonly IAuditoriaService _auditoria;
    private readonly IAuditoriaContextoRequest _contextoAuditoria;
    private readonly ILogger<EtiquetasService> _logger;

    public EtiquetasService(
        BitalNegocioDbContext context,
        IAuditoriaService auditoria,
        IAuditoriaContextoRequest contextoAuditoria,
        ILogger<EtiquetasService> logger)
    {
        _context = context;
        _auditoria = auditoria;
        _contextoAuditoria = contextoAuditoria;
        _logger = logger;
    }

    public async Task<List<EtiquetaEnfermeraDto>> ObtenerEtiquetasAsync(
        string? comida = null,
        string? estadoLogistica = null,
        string? pabellon = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.EtiquetasEnfermeria
            .Include(e => e.OrdenCocina)
            .Include(e => e.FilaDieta)
            .AsQueryable();

        if (!string.IsNullOrEmpty(comida))
        {
            if (Enum.TryParse<TiempoComida>(comida, ignoreCase: true, out var tiempoComida))
                query = query.Where(e => e.Comida == tiempoComida);
        }

        if (!string.IsNullOrEmpty(estadoLogistica))
            query = query.Where(e => e.EstadoLogistica == estadoLogistica);

        if (!string.IsNullOrEmpty(pabellon))
            query = query.Where(e => e.FilaDieta!.Pabellon.Contains(pabellon));

        var etiquetas = await query
            .OrderByDescending(e => e.GeneradaEn)
            .ToListAsync(cancellationToken);

        return etiquetas.Select(MapearADto).ToList();
    }

    public async Task<EtiquetaEnfermeraDto?> BuscarEtiquetaPorCodigoAsync(
        string codigo,
        CancellationToken cancellationToken = default)
    {
        var normalizado = EtiquetasCodigoHelper.Normalizar(codigo);
        if (string.IsNullOrEmpty(normalizado))
            return null;

        var etiqueta = await _context.EtiquetasEnfermeria
            .Include(e => e.OrdenCocina)
            .Include(e => e.FilaDieta)
            .FirstOrDefaultAsync(
                e => e.Codigo.ToUpper() == normalizado,
                cancellationToken);

        return etiqueta == null ? null : MapearADto(etiqueta);
    }

    public async Task<List<Guid>> GenerarEtiquetasAsync(
        GenerarEtiquetasDto datos,
        string usuario,
        CancellationToken cancellationToken = default)
    {
        var ordenes = await _context.OrdenesCocina
            .Include(o => o.Dietas)
            .Where(o => datos.OrdenIds.Contains(o.Id))
            .ToListAsync(cancellationToken);

        if (!ordenes.Any())
            throw new KeyNotFoundException("No se encontraron las órdenes especificadas");

        // Validar que todas las órdenes estén completadas
        var ordenesInvalidas = ordenes.Where(o => o.Estado != "Completada").ToList();
        if (ordenesInvalidas.Any())
        {
            throw new InvalidOperationException(
                $"Solo se pueden generar etiquetas de órdenes completadas. Órdenes inválidas: {string.Join(", ", ordenesInvalidas.Select(o => o.NumeroOrden))}");
        }

        var etiquetasIds = new List<Guid>();
        var ahora = DateTime.UtcNow;

        foreach (var orden in ordenes)
        {
            foreach (var dieta in orden.Dietas)
            {
                // Verificar que no exista ya una etiqueta para esta dieta
                var existente = await _context.EtiquetasEnfermeria
                    .Where(e => e.FilaDietaId == dieta.Id && e.OrdenCocinaId == orden.Id)
                    .OrderByDescending(e => e.GeneradaEn)
                    .FirstOrDefaultAsync(cancellationToken);

                if (existente != null)
                {
                    etiquetasIds.Add(existente.Id);
                    continue;
                }

                var etiqueta = new EtiquetaEnfermera
                {
                    Id = Guid.NewGuid(),
                    Codigo = EtiquetasCodigoHelper.Generar(ahora),
                    OrdenCocinaId = orden.Id,
                    FilaDietaId = dieta.Id,
                    EstadoLogistica = "generada",
                    Comida = dieta.Comida,
                    FechaOperativa = dieta.FechaOperativa,
                    GeneradaPor = usuario,
                    GeneradaEn = ahora
                };

                _context.EtiquetasEnfermeria.Add(etiqueta);
                etiquetasIds.Add(etiqueta.Id);

                // Registrar evento de trazabilidad
                var evento = new EventoTrazabilidad
                {
                    Id = Guid.NewGuid(),
                    FilaDietaId = dieta.Id,
                    TipoEvento = "etiqueta_generada",
                    Descripcion = $"Etiqueta {etiqueta.Codigo} generada para orden #{orden.NumeroOrden}",
                    EstadoAnterior = dieta.Estado,
                    EstadoNuevo = dieta.Estado,
                    Usuario = usuario,
                    FechaEvento = ahora,
                    DatosAdicionales = $"Codigo: {etiqueta.Codigo}"
                };

                _context.EventosTrazabilidad.Add(evento);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        Auditar(AuditoriaCatalogo.Modulos.Etiquetas, AuditoriaCatalogo.Acciones.Generar, usuario,
            AuditoriaCatalogo.Entidades.EtiquetaEnfermera, null, null,
            new { count = etiquetasIds.Count, ordenIds = datos.OrdenIds, etiquetasIds });

        _logger.LogInformation(
            "Generadas {Count} etiquetas por {Usuario}",
            etiquetasIds.Count, usuario);

        return etiquetasIds;
    }

    public async Task<List<EtiquetaEnfermeraDto>> MarcarEtiquetasImpresasAsync(
        MarcarImpresasDto datos,
        CancellationToken cancellationToken = default)
    {
        var etiquetas = await _context.EtiquetasEnfermeria
            .Include(e => e.OrdenCocina)
            .Include(e => e.FilaDieta)
            .Where(e => datos.EtiquetaIds.Contains(e.Id))
            .ToListAsync(cancellationToken);

        if (!etiquetas.Any())
            throw new KeyNotFoundException("No se encontraron las etiquetas especificadas");

        // Validar que estén en estado "generada"
        var etiquetasInvalidas = etiquetas.Where(e => e.EstadoLogistica != "generada").ToList();
        if (etiquetasInvalidas.Any())
        {
            throw new InvalidOperationException(
                $"Solo se pueden marcar como impresas las etiquetas en estado 'generada'");
        }

        var ahora = DateTime.UtcNow;

        foreach (var etiqueta in etiquetas)
        {
            etiqueta.EstadoLogistica = "impresa";
            etiqueta.ImpresaEn = ahora;
        }

        await _context.SaveChangesAsync(cancellationToken);

        Auditar(AuditoriaCatalogo.Modulos.Etiquetas, AuditoriaCatalogo.Acciones.Imprimir, "system",
            AuditoriaCatalogo.Entidades.EtiquetaEnfermera, null, null,
            new { count = etiquetas.Count, ids = datos.EtiquetaIds });

        _logger.LogInformation("Marcadas {Count} etiquetas como impresas", etiquetas.Count);

        return etiquetas.Select(MapearADto).ToList();
    }

    public async Task<List<EtiquetaEnfermeraDto>> ReimprimirEtiquetasAsync(
        MarcarImpresasDto datos,
        CancellationToken cancellationToken = default)
    {
        var etiquetas = await _context.EtiquetasEnfermeria
            .Include(e => e.OrdenCocina)
            .Include(e => e.FilaDieta)
            .Where(e => datos.EtiquetaIds.Contains(e.Id))
            .ToListAsync(cancellationToken);

        if (!etiquetas.Any())
            throw new KeyNotFoundException("No se encontraron las etiquetas especificadas");

        // Las etiquetas que ya fueron impresas pueden reimprimirse
        var ahora = DateTime.UtcNow;

        foreach (var etiqueta in etiquetas)
        {
            etiqueta.ImpresaEn = ahora;
            etiqueta.Observaciones = string.IsNullOrEmpty(etiqueta.Observaciones)
                ? $"Reimpresa: {ahora:yyyy-MM-dd HH:mm}"
                : $"{etiqueta.Observaciones}\n[{ahora:yyyy-MM-dd HH:mm}] Reimpresa";
        }

        await _context.SaveChangesAsync(cancellationToken);

        Auditar(AuditoriaCatalogo.Modulos.Etiquetas, AuditoriaCatalogo.Acciones.Reimprimir, "system",
            AuditoriaCatalogo.Entidades.EtiquetaEnfermera, null, null,
            new { count = etiquetas.Count, ids = datos.EtiquetaIds });

        _logger.LogInformation("Reimpresas {Count} etiquetas", etiquetas.Count);

        return etiquetas.Select(MapearADto).ToList();
    }

    public async Task<EtiquetaEnfermeraDto> ConfirmarPreEntregaAsync(
        Guid etiquetaId,
        ConfirmarPreEntregaDto datos,
        string usuario,
        CancellationToken cancellationToken = default)
    {
        var etiqueta = await _context.EtiquetasEnfermeria
            .Include(e => e.OrdenCocina)
            .Include(e => e.FilaDieta)
            .FirstOrDefaultAsync(e => e.Id == etiquetaId, cancellationToken)
            ?? throw new KeyNotFoundException($"Etiqueta {etiquetaId} no encontrada");

        // Validar estado
        if (etiqueta.EstadoLogistica != "impresa")
            throw new InvalidOperationException("Solo se pueden confirmar pre-entregas de etiquetas impresas");

        // Validar que la orden esté despachada
        if (etiqueta.OrdenCocina?.Estado != "Completada")
            throw new InvalidOperationException("La orden debe estar completada para confirmar pre-entrega");

        var ahora = DateTime.UtcNow;

        etiqueta.EstadoLogistica = "pre_entregada";
        etiqueta.RecibidoPor = datos.RecibidoPor ?? usuario;
        etiqueta.PreEntregadaEn = ahora;

        // Registrar evento
        var evento = new EventoTrazabilidad
        {
            Id = Guid.NewGuid(),
            FilaDietaId = etiqueta.FilaDietaId,
            TipoEvento = "pre_entrega_confirmada",
            Descripcion = $"Etiqueta {etiqueta.Codigo} recibida en enfermería",
            EstadoAnterior = etiqueta.FilaDieta?.Estado ?? EstadoDieta.ListaEnvio,
            EstadoNuevo = etiqueta.FilaDieta?.Estado ?? EstadoDieta.ListaEnvio,
            Usuario = usuario,
            FechaEvento = ahora,
            DatosAdicionales = $"RecibidoPor: {etiqueta.RecibidoPor}"
        };

        _context.EventosTrazabilidad.Add(evento);

        await _context.SaveChangesAsync(cancellationToken);

        Auditar(AuditoriaCatalogo.Modulos.Etiquetas, AuditoriaCatalogo.Acciones.PreEntrega, usuario,
            AuditoriaCatalogo.Entidades.EtiquetaEnfermera, etiquetaId,
            new { estadoLogistica = "impresa" },
            new { estadoLogistica = etiqueta.EstadoLogistica, etiqueta.RecibidoPor, etiqueta.Codigo });

        _logger.LogInformation(
            "Pre-entrega confirmada para etiqueta {Codigo} por {Usuario}",
            etiqueta.Codigo, usuario);

        return MapearADto(etiqueta);
    }

    public async Task<EtiquetaEnfermeraDto> ConfirmarEntregaAsync(
        Guid etiquetaId,
        string usuario,
        CancellationToken cancellationToken = default)
    {
        var etiqueta = await _context.EtiquetasEnfermeria
            .Include(e => e.OrdenCocina)
            .Include(e => e.FilaDieta)
            .FirstOrDefaultAsync(e => e.Id == etiquetaId, cancellationToken)
            ?? throw new KeyNotFoundException($"Etiqueta {etiquetaId} no encontrada");

        // Validar estado
        if (etiqueta.EstadoLogistica != "pre_entregada")
            throw new InvalidOperationException("Solo se pueden confirmar entregas de etiquetas pre-entregadas");

        var ahora = DateTime.UtcNow;

        etiqueta.EstadoLogistica = "entregada";
        etiqueta.EntregadoPor = usuario;
        etiqueta.EntregadaEn = ahora;

        // Registrar evento
        var evento = new EventoTrazabilidad
        {
            Id = Guid.NewGuid(),
            FilaDietaId = etiqueta.FilaDietaId,
            TipoEvento = "entrega_confirmada",
            Descripcion = $"Dieta entregada al paciente - Etiqueta {etiqueta.Codigo}",
            EstadoAnterior = etiqueta.FilaDieta?.Estado ?? EstadoDieta.ListaEnvio,
            EstadoNuevo = EstadoDieta.Entregada,
            Usuario = usuario,
            FechaEvento = ahora,
            DatosAdicionales = $"EntregadoPor: {usuario}"
        };

        _context.EventosTrazabilidad.Add(evento);

        // Actualizar estado de la dieta
        if (etiqueta.FilaDieta != null)
        {
            etiqueta.FilaDieta.Estado = EstadoDieta.Entregada;
        }

        await _context.SaveChangesAsync(cancellationToken);

        Auditar(AuditoriaCatalogo.Modulos.Etiquetas, AuditoriaCatalogo.Acciones.Entrega, usuario,
            AuditoriaCatalogo.Entidades.EtiquetaEnfermera, etiquetaId,
            new { estadoLogistica = "pre_entregada" },
            new { estadoLogistica = etiqueta.EstadoLogistica, etiqueta.EntregadoPor, etiqueta.Codigo });

        _logger.LogInformation(
            "Entrega confirmada para etiqueta {Codigo} por {Usuario}",
            etiqueta.Codigo, usuario);

        return MapearADto(etiqueta);
    }

    public async Task<EtiquetaEnfermeraDto> ConfirmarDevolucionAsync(
        Guid etiquetaId,
        ConfirmarDevolucionDto datos,
        string usuario,
        CancellationToken cancellationToken = default)
    {
        var etiqueta = await _context.EtiquetasEnfermeria
            .Include(e => e.OrdenCocina)
            .Include(e => e.FilaDieta)
            .FirstOrDefaultAsync(e => e.Id == etiquetaId, cancellationToken)
            ?? throw new KeyNotFoundException($"Etiqueta {etiquetaId} no encontrada");

        // Validar estado - puede devolverse desde pre_entregada o entregada
        if (etiqueta.EstadoLogistica != "pre_entregada" && etiqueta.EstadoLogistica != "entregada")
            throw new InvalidOperationException("Solo se pueden devolver etiquetas pre-entregadas o entregadas");

        var motivoNormalizado = EtiquetasReglasNegocio.NormalizarMotivoDevolucion(datos.Motivo);
        EtiquetasReglasNegocio.ValidarDevolucion(
            etiqueta.EstadoLogistica,
            motivoNormalizado,
            datos.EstadoDieta);

        var ahora = DateTime.UtcNow;
        var estadoLogisticaAnterior = etiqueta.EstadoLogistica;

        etiqueta.EstadoLogistica = "devuelta";
        etiqueta.MotivoDevolucion = motivoNormalizado;
        etiqueta.EstadoDietaDevolucion = datos.EstadoDieta;
        etiqueta.ObservacionesDevolucion = datos.Observaciones;
        etiqueta.FotoDevolucionUrl = datos.FotoUrl;
        etiqueta.DevueltaEn = ahora;

        // Registrar evento
        var evento = new EventoTrazabilidad
        {
            Id = Guid.NewGuid(),
            FilaDietaId = etiqueta.FilaDietaId,
            TipoEvento = "devolucion_registrada",
            Descripcion = $"Dieta devuelta - {motivoNormalizado}",
            EstadoAnterior = etiqueta.FilaDieta?.Estado ?? EstadoDieta.Entregada,
            EstadoNuevo = EstadoDieta.Devuelta,
            Usuario = usuario,
            FechaEvento = ahora,
            DatosAdicionales = $"Motivo: {motivoNormalizado}, EstadoDieta: {datos.EstadoDieta}"
        };

        _context.EventosTrazabilidad.Add(evento);

        // Actualizar estado de la dieta
        if (etiqueta.FilaDieta != null)
        {
            etiqueta.FilaDieta.Estado = EstadoDieta.Devuelta;
        }

        await _context.SaveChangesAsync(cancellationToken);

        Auditar(AuditoriaCatalogo.Modulos.Etiquetas, AuditoriaCatalogo.Acciones.Devolucion, usuario,
            AuditoriaCatalogo.Entidades.EtiquetaEnfermera, etiquetaId,
            new { estadoLogistica = estadoLogisticaAnterior },
            new { motivo = motivoNormalizado, datos.EstadoDieta, etiqueta.Codigo });

        _logger.LogInformation(
            "Devolución confirmada para etiqueta {Codigo} - Motivo: {Motivo}",
            etiqueta.Codigo, motivoNormalizado);

        return MapearADto(etiqueta);
    }

    public async Task<string> SubirFotoDevolucionAsync(
        Guid etiquetaId,
        Stream fotoStream,
        string nombreArchivo,
        CancellationToken cancellationToken = default)
    {
        var etiqueta = await _context.EtiquetasEnfermeria
            .FirstOrDefaultAsync(e => e.Id == etiquetaId, cancellationToken)
            ?? throw new KeyNotFoundException($"Etiqueta {etiquetaId} no encontrada");

        // Almacenamiento en filesystem bajo wwwroot/uploads
        var url = await ArchivosUploadHelper.GuardarAsync(
            fotoStream,
            "devoluciones",
            nombreArchivo,
            cancellationToken);

        etiqueta.FotoDevolucionUrl = url;
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Foto de devolución subida para etiqueta {EtiquetaId}: {Url}",
            etiquetaId, url);

        return url;
    }

    public async Task<byte[]> GenerarPdfEtiquetasAsync(
        IEnumerable<Guid> etiquetaIds,
        CancellationToken cancellationToken = default)
    {
        var ids = etiquetaIds.Distinct().ToList();
        var etiquetas = await _context.EtiquetasEnfermeria
            .Include(e => e.FilaDieta)
            .Include(e => e.OrdenCocina)
            .Where(e => ids.Contains(e.Id))
            .ToListAsync(cancellationToken);

        if (etiquetas.Count == 0)
        {
            throw new KeyNotFoundException("No se encontraron etiquetas para generar PDF");
        }

        var lineas = new List<string> { "Etiquetas de dieta - Bital" };
        foreach (var etiqueta in etiquetas)
        {
            lineas.Add($"Codigo: {etiqueta.Codigo}");
            lineas.Add($"Paciente: {etiqueta.FilaDieta?.Paciente ?? "—"}");
            lineas.Add($"Dieta: {etiqueta.FilaDieta?.DescripcionDieta ?? "—"}");
            lineas.Add($"Comida: {etiqueta.Comida}");
            lineas.Add("---");
        }

        return PdfEtiquetasHelper.Generar(lineas);
    }

    private static bool ResolverAisladoFila(FilaDieta? fila)
    {
        if (fila == null) return false;
        if (fila.Aislado) return true;
        return !string.IsNullOrWhiteSpace(fila.Aislamiento)
            && !fila.Aislamiento.Equals("Ninguno", StringComparison.OrdinalIgnoreCase);
    }

    private static EtiquetaEnfermeraDto MapearADto(EtiquetaEnfermera etiqueta)
    {
        var fila = etiqueta.FilaDieta;
        var aislado = ResolverAisladoFila(fila);
        return new EtiquetaEnfermeraDto
        {
            Id = etiqueta.Id,
            Codigo = etiqueta.Codigo,
            OrdenCocinaId = etiqueta.OrdenCocinaId,
            NumeroOrden = etiqueta.OrdenCocina?.NumeroOrden ?? 0,
            FilaDietaId = etiqueta.FilaDietaId,
            PacienteId = fila?.PacienteId ?? "",
            Paciente = fila?.Paciente ?? "",
            Cedula = fila?.Cedula ?? "",
            Edad = fila?.Edad ?? 0,
            Aislado = aislado,
            ObservacionAislamiento = fila?.ObservacionAislamiento,
            Alergico = fila?.Alergico ?? false,
            Alergias = string.IsNullOrWhiteSpace(fila?.Alergias) ? null : fila.Alergias,
            Pabellon = fila?.Pabellon ?? "",
            Habitacion = fila?.Habitacion ?? "",
            Comida = etiqueta.Comida.ToString(),
            TipoDieta = fila?.DescripcionDieta ?? "",
            Consistencia = fila?.Consistencia ?? "",
            EstadoLogistica = etiqueta.EstadoLogistica,
            FechaOperativa = etiqueta.FechaOperativa,
            GeneradaPor = etiqueta.GeneradaPor,
            GeneradaEn = etiqueta.GeneradaEn,
            ImpresaEn = etiqueta.ImpresaEn,
            RecibidoPor = etiqueta.RecibidoPor,
            PreEntregadaEn = etiqueta.PreEntregadaEn,
            EntregadoPor = etiqueta.EntregadoPor,
            EntregadaEn = etiqueta.EntregadaEn,
            MotivoDevolucion = etiqueta.MotivoDevolucion,
            EstadoDietaDevolucion = etiqueta.EstadoDietaDevolucion,
            ObservacionesDevolucion = etiqueta.ObservacionesDevolucion,
            FotoDevolucionUrl = etiqueta.FotoDevolucionUrl,
            DevueltaEn = etiqueta.DevueltaEn,
            Observaciones = ResolverObservacionesEtiqueta(etiqueta, fila)
        };
    }

    private static string? ResolverObservacionesEtiqueta(
        EtiquetaEnfermera etiqueta,
        FilaDieta? fila)
    {
        var partes = new List<string>();

        if (!string.IsNullOrWhiteSpace(fila?.Observaciones))
            partes.Add(fila.Observaciones.Trim());

        if (ResolverAisladoFila(fila) && !string.IsNullOrWhiteSpace(fila?.ObservacionAislamiento))
            partes.Add(fila.ObservacionAislamiento.Trim());

        if (fila?.Alergico == true && !string.IsNullOrWhiteSpace(fila.Alergias))
            partes.Add($"Alergias: {fila.Alergias.Trim()}");

        if (!string.IsNullOrWhiteSpace(etiqueta.Observaciones))
            partes.Add(etiqueta.Observaciones.Trim());

        if (partes.Count == 0)
            return null;

        return string.Join(" · ", partes.Distinct(StringComparer.OrdinalIgnoreCase));
    }

    private void Auditar(
        string modulo,
        string accion,
        string usuario,
        string entidad,
        Guid? entidadId,
        object? antes = null,
        object? despues = null)
    {
        AuditoriaOperativaHelper.RegistrarSilencioso(
            _auditoria,
            _logger,
            modulo,
            accion,
            usuario,
            entidad,
            entidadId,
            AuditoriaSnapshot.Json(antes),
            AuditoriaSnapshot.Json(despues),
            contexto: _contextoAuditoria);
    }
}
