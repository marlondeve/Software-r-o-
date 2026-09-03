using Bital.Application;
using Bital.Application.DTOs.DietasCocina;
using Bital.Application.Interfaces;
using Bital.Application.Options;
using Bital.Domain.Entities.DietasCocina;
using Bital.Domain.Enums;
using Bital.Infrastructure.Data;
using Bital.Infrastructure.DietasCocina;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

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
    private readonly IDietasCocinaRealtime _realtime;
    private readonly string _frontendPublicUrl;

    public EtiquetasService(
        BitalNegocioDbContext context,
        IAuditoriaService auditoria,
        IAuditoriaContextoRequest contextoAuditoria,
        ILogger<EtiquetasService> logger,
        IOptions<DietasCocinaOptions> dietasCocinaOptions,
        IDietasCocinaRealtime? realtime = null)
    {
        _context = context;
        _auditoria = auditoria;
        _contextoAuditoria = contextoAuditoria;
        _logger = logger;
        _frontendPublicUrl = dietasCocinaOptions.Value.FrontendPublicUrl ?? "";
        _realtime = realtime ?? NullDietasCocinaRealtime.Instance;
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

        // Validar / filtrar órdenes aptas (no tumbar todo el lote por una inválida)
        var ordenesAptas = ordenes
            .Where(o =>
                string.Equals(o.Estado, "Completada", StringComparison.OrdinalIgnoreCase)
                && o.Dietas.Any()
                && o.Dietas.All(d => DietasReglasNegocio.PermiteGenerarEtiqueta(d.Estado)))
            .ToList();

        if (!ordenesAptas.Any())
        {
            var invalidas = ordenes
                .Where(o => !string.Equals(o.Estado, "Completada", StringComparison.OrdinalIgnoreCase))
                .Select(o => o.NumeroOrden)
                .ToList();
            if (invalidas.Count > 0)
            {
                throw new InvalidOperationException(
                    $"Solo se pueden generar etiquetas de órdenes completadas. Órdenes inválidas: {string.Join(", ", invalidas)}");
            }

            throw new InvalidOperationException(
                "No se pueden generar etiquetas: ninguna dieta del lote está activa para etiquetado.");
        }

        if (ordenesAptas.Count < ordenes.Count)
        {
            _logger.LogWarning(
                "Generación parcial de etiquetas: {Aptas}/{Total} órdenes aptas",
                ordenesAptas.Count, ordenes.Count);
        }

        var etiquetasIds = new List<Guid>();
        var ahora = DateTime.UtcNow;

        foreach (var orden in ordenesAptas)
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

        var generadas = await _context.EtiquetasEnfermeria
            .Include(e => e.OrdenCocina)
            .Include(e => e.FilaDieta)
            .Where(e => etiquetasIds.Contains(e.Id))
            .ToListAsync(cancellationToken);
        await _realtime.NotificarEtiquetasAsync(generadas.Select(MapearADto).ToList(), cancellationToken);
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

        var aptas = etiquetas.Where(e => e.EstadoLogistica == "generada").ToList();
        if (aptas.Count == 0)
        {
            if (etiquetas.All(e =>
                    string.Equals(e.EstadoLogistica, "impresa", StringComparison.OrdinalIgnoreCase)))
            {
                throw new ConflictoEstadoOperativoException(
                    "Las etiquetas ya están impresas.",
                    etiquetas.Select(MapearADto).ToList());
            }

            throw new InvalidOperationException(
                "Solo se pueden marcar como impresas las etiquetas en estado 'generada'");
        }

        var ahora = DateTime.UtcNow;

        foreach (var etiqueta in aptas)
        {
            etiqueta.EstadoLogistica = "impresa";
            etiqueta.ImpresaEn = ahora;
        }

        await _context.SaveChangesAsync(cancellationToken);

        Auditar(AuditoriaCatalogo.Modulos.Etiquetas, AuditoriaCatalogo.Acciones.Imprimir, "system",
            AuditoriaCatalogo.Entidades.EtiquetaEnfermera, null, null,
            new { count = aptas.Count, ids = aptas.Select(e => e.Id) });

        _logger.LogInformation("Marcadas {Count} etiquetas como impresas", aptas.Count);

        var impresas = aptas.Select(MapearADto).ToList();
        await _realtime.NotificarEtiquetasAsync(impresas, cancellationToken);
        return impresas;
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
                ? $"Reimpresa: {HorarioOperativoHelper.MarcaTiempoColombia()}"
                : $"{etiqueta.Observaciones}\n{HorarioOperativoHelper.MarcaTiempoColombia()} Reimpresa";
        }

        await _context.SaveChangesAsync(cancellationToken);

        Auditar(AuditoriaCatalogo.Modulos.Etiquetas, AuditoriaCatalogo.Acciones.Reimprimir, "system",
            AuditoriaCatalogo.Entidades.EtiquetaEnfermera, null, null,
            new { count = etiquetas.Count, ids = datos.EtiquetaIds });

        _logger.LogInformation("Reimpresas {Count} etiquetas", etiquetas.Count);

        var reimpresas = etiquetas.Select(MapearADto).ToList();
        await _realtime.NotificarEtiquetasAsync(reimpresas, cancellationToken);
        return reimpresas;
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
        if (string.Equals(etiqueta.EstadoLogistica, "pre_entregada", StringComparison.OrdinalIgnoreCase)
            || string.Equals(etiqueta.EstadoLogistica, "entregada", StringComparison.OrdinalIgnoreCase))
        {
            throw new ConflictoEstadoOperativoException(
                "La pre-entrega ya fue confirmada.", MapearADto(etiqueta));
        }
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

        await NotificarEtiquetaYFila(etiqueta, cancellationToken);
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
        if (string.Equals(etiqueta.EstadoLogistica, "entregada", StringComparison.OrdinalIgnoreCase))
        {
            throw new ConflictoEstadoOperativoException(
                "La entrega ya fue confirmada.", MapearADto(etiqueta));
        }
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

        await NotificarEtiquetaYFila(etiqueta, cancellationToken);
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
        if (string.Equals(etiqueta.EstadoLogistica, "devuelta", StringComparison.OrdinalIgnoreCase))
        {
            throw new ConflictoEstadoOperativoException(
                "La devolución ya fue registrada.", MapearADto(etiqueta));
        }
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

        await NotificarEtiquetaYFila(etiqueta, cancellationToken);
        return MapearADto(etiqueta);
    }

    public async Task<string> SubirFotoDevolucionAsync(
        Guid etiquetaId,
        Stream fotoStream,
        string nombreArchivo,
        CancellationToken cancellationToken = default)
    {
        var etiqueta = await _context.EtiquetasEnfermeria
            .Include(e => e.OrdenCocina)
            .Include(e => e.FilaDieta)
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

        Auditar(AuditoriaCatalogo.Modulos.Etiquetas, AuditoriaCatalogo.Acciones.Devolucion, "system",
            AuditoriaCatalogo.Entidades.EtiquetaEnfermera, etiquetaId, null,
            new { fotoDevolucionUrl = url, etiqueta.Codigo });

        _logger.LogInformation(
            "Foto de devolución subida para etiqueta {EtiquetaId}: {Url}",
            etiquetaId, url);

        await NotificarEtiquetaYFila(etiqueta, cancellationToken);
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

        var porId = etiquetas.ToDictionary(e => e.Id);
        var modelos = ids
            .Where(porId.ContainsKey)
            .Select(id => MapearPdf(porId[id]))
            .ToList();

        return PdfEtiquetasHelper.Generar(modelos);
    }

    public Task<byte[]> GenerarPdfEtiquetaPruebaAsync(
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var pdf = PdfEtiquetasHelper.Generar(
            [PdfEtiquetasHelper.CrearEtiquetaPrueba(_frontendPublicUrl)]);
        return Task.FromResult(pdf);
    }

    private static bool ResolverAisladoFila(FilaDieta? fila)
    {
        if (fila == null) return false;
        if (fila.Aislado) return true;
        return !string.IsNullOrWhiteSpace(fila.Aislamiento)
            && !fila.Aislamiento.Equals("Ninguno", StringComparison.OrdinalIgnoreCase);
    }

    private EtiquetaPdfModelo MapearPdf(EtiquetaEnfermera etiqueta)
    {
        var fila = etiqueta.FilaDieta;
        var aislado = ResolverAisladoFila(fila);
        var ingreso = fila?.IdIngreso is > 0 ? fila.IdIngreso.Value.ToString() : null;
        var tipoDoc = string.IsNullOrWhiteSpace(fila?.TipoDocumento) ? "CC" : fila.TipoDocumento.Trim();
        var docValor = string.IsNullOrWhiteSpace(fila?.Cedula) ? "—" : fila.Cedula.Trim();
        var pabellon = fila?.Pabellon ?? "";
        var habitacion = fila?.Habitacion ?? "";
        // GeneradaEn es UTC; en etiqueta se muestra hora Colombia (America/Bogota).
        var fecha = etiqueta.GeneradaEn != default
            ? PdfEtiquetasHelper.AHoraColombia(etiqueta.GeneradaEn)
            : etiqueta.FechaOperativa.Date;

        return new EtiquetaPdfModelo
        {
            Codigo = etiqueta.Codigo,
            QrPayload = PdfEtiquetasHelper.ConstruirQrPayload(etiqueta.Codigo, _frontendPublicUrl),
            Comida = PdfEtiquetasHelper.EtiquetaComida(etiqueta.Comida),
            FechaHora = PdfEtiquetasHelper.FormatearFechaHora(fecha),
            Paciente = string.IsNullOrWhiteSpace(fila?.Paciente) ? "—" : fila.Paciente,
            Ingreso = ingreso,
            Edad = fila?.Edad ?? 0,
            DocumentoTitulo = tipoDoc,
            DocumentoValor = docValor,
            Ubicacion = PdfEtiquetasHelper.FormatearUbicacion(pabellon, habitacion),
            Aislamiento = aislado,
            TipoDieta = fila?.DescripcionDieta ?? "",
            Consistencia = fila?.Consistencia ?? "",
            Observaciones = ResolverObservacionesEtiqueta(etiqueta, fila),
        };
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
            IdIngreso = fila?.IdIngreso,
            TipoDocumento = fila?.TipoDocumento,
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

    private async Task NotificarEtiquetaYFila(EtiquetaEnfermera etiqueta, CancellationToken cancellationToken)
    {
        await _realtime.NotificarEtiquetasAsync([MapearADto(etiqueta)], cancellationToken);
        if (etiqueta.FilaDieta != null)
            await _realtime.NotificarFilaAsync(DietasService.MapearADto(etiqueta.FilaDieta), cancellationToken);
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
