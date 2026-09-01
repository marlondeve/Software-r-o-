using Bital.Application.DTOs.DietasCocina;
using Bital.Application.Interfaces;
using Bital.Domain.Entities.DietasCocina;
using Bital.Domain.Enums;
using Bital.Infrastructure.Data;
using Bital.Infrastructure.DietasCocina;
using Bital.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;

namespace Bital.UnitTests;

public class CorteConciliacionFcrTests
{
    private static readonly DateTime Desde = new(2026, 8, 24);
    private static readonly DateTime Hasta = new(2026, 8, 30);

    [Fact]
    public void DesayunoCanceladoSinEtiqueta_NoCuenta()
    {
        var dieta = Dieta(TiempoComida.Desayuno, EstadoDieta.Cancelada, "Normales y derivadas");
        var corte = CorteConciliacionFcr.Construir(
            Desde, Hasta, [dieta], [], [], []);
        Assert.Equal(0, TotalComida(corte, TiempoComida.Desayuno));
    }

    [Fact]
    public void CenaCanceladaSinEtiqueta_SiCuenta()
    {
        var dieta = Dieta(TiempoComida.Cena, EstadoDieta.Cancelada, "Normales y derivadas");
        var orden = Orden(TiempoComida.Cena, "Cancelada");
        dieta.OrdenCocinaId = orden.Id;
        var corte = CorteConciliacionFcr.Construir(
            Desde, Hasta, [dieta], [orden], [], []);
        Assert.Equal(1, TotalComida(corte, TiempoComida.Cena));
    }

    [Fact]
    public void MeriendaSinEtiqueta_NoCuenta()
    {
        var dieta = Dieta(TiempoComida.Onces, EstadoDieta.Confirmada, "Merienda tarde");
        var corte = CorteConciliacionFcr.Construir(
            Desde, Hasta, [dieta], [], [], []);
        Assert.Equal(0, TotalComida(corte, TiempoComida.Onces));
        Assert.Equal(0, TotalComida(corte, TiempoComida.MediaNueve));
        Assert.Equal(0, TotalComida(corte, TiempoComida.MediaNoche));
    }

    [Fact]
    public void AgrupaHiposodicaComoNormalesYDerivadas()
    {
        var dieta = Dieta(TiempoComida.Almuerzo, EstadoDieta.ListaEnvio, "Hiposódica");
        var etiqueta = Etiqueta(dieta);
        var corte = CorteConciliacionFcr.Construir(
            Desde, Hasta, [dieta], [], [etiqueta], []);
        var grupo = corte.Single(g =>
            g.Comida == TiempoComida.Almuerzo && g.LineaFcr == ContratoCocinaHelper.LineaNormalesYDerivadas);
        Assert.Equal(1, grupo.CantidadSistema);
        Assert.Equal("Almuerzos normales y derivadas", grupo.EtiquetaPlanilla);
    }

    [Fact]
    public void Semana2430_Almuerzo44_Cena42_Merienda0()
    {
        var (dietas, ordenes, etiquetas) = Semana(
            desayunos: 64,
            almuerzos: 44,
            cenas: 42,
            meriendas: 0);
        var corte = CorteConciliacionFcr.Construir(
            Desde, Hasta, dietas, ordenes, etiquetas, []);

        Assert.Equal(44, TotalComida(corte, TiempoComida.Almuerzo));
        Assert.Equal(42, TotalComida(corte, TiempoComida.Cena));
        Assert.Equal(0, TotalComida(corte, TiempoComida.MediaNueve)
            + TotalComida(corte, TiempoComida.Onces)
            + TotalComida(corte, TiempoComida.MediaNoche));
        Assert.NotEqual(63, TotalComida(corte, TiempoComida.Desayuno));
        Assert.Equal(64, TotalComida(corte, TiempoComida.Desayuno));
        Assert.NotEqual(149, corte.Sum(g => g.CantidadSistema));
    }

    [Fact]
    public void PlantillaIncluyeLas28LineasAunqueVayanEnCero()
    {
        var corte = CorteConciliacionFcr.Construir(Desde, Hasta, [], [], [], []);
        Assert.Equal(ContratoCocinaHelper.PlantillaFcr.Length, corte.Count);
        Assert.All(corte, g => Assert.Equal(0, g.CantidadSistema));
    }

    [Fact]
    public void EstadoPendiente_SinPlanilla()
    {
        Assert.Equal(
            CorteConciliacionFcr.EstadoPendiente,
            CorteConciliacionFcr.EstadoAutomatico(10, null, 0, 0, 1000m, false));
    }

    [Fact]
    public void EstadoDifCantidad_CuandoCocinaNoCuadra()
    {
        Assert.Equal(
            CorteConciliacionFcr.EstadoDifCantidad,
            CorteConciliacionFcr.EstadoAutomatico(64, 63, 0, 0, 1000m, false));
    }

    [Fact]
    public void EstadoManualNoPisar_Conciliado()
    {
        Assert.True(CorteConciliacionFcr.EstadoManualNoPisar("conciliado"));
        Assert.False(CorteConciliacionFcr.EstadoManualNoPisar("pendiente"));
    }

    [Fact]
    public async Task CargarPlanilla_634442_DejaDesayunoEnDifYAlmuerzoCenaCoinciden()
    {
        await using var db = CrearDb();
        var (dietas, ordenes, etiquetas) = Semana(64, 44, 42, 0);
        db.DietasCatalogo.Add(dietas[0].TipoDieta!);
        db.FilasDietas.AddRange(dietas);
        db.OrdenesCocina.AddRange(ordenes);
        db.EtiquetasEnfermeria.AddRange(etiquetas);
        db.TarifasHistorico.AddRange(TarifasFcr(dietas[0].TipoDieta!));
        await db.SaveChangesAsync();

        var servicio = CrearServicio(db);
        await servicio.CargarPlanillaAsync(
            new CargarPlanillaCocinaDto
            {
                Desde = Desde,
                Hasta = Hasta,
                Lineas =
                [
                    new() { Comida = "Desayuno", LineaFcr = "Normales y derivadas", Cantidad = 63 },
                    new() { Comida = "Almuerzo", LineaFcr = "Normales y derivadas", Cantidad = 44 },
                    new() { Comida = "Cena", LineaFcr = "Normales y derivadas", Cantidad = 42 },
                ],
            },
            "nutricionista");

        var lista = await servicio.ObtenerConciliacionAsync(Desde, Hasta, sinPaginar: true);
        var desayuno = lineaNormal(lista, "Desayuno");
        var almuerzo = lineaNormal(lista, "Almuerzo");
        var cena = lineaNormal(lista, "Cena");

        Assert.Equal(64, desayuno.CantidadSistema);
        Assert.Equal(63, desayuno.CantidadCocina);
        Assert.Equal(CorteConciliacionFcr.EstadoDifCantidad, desayuno.Estado);
        Assert.Equal(CorteConciliacionFcr.EstadoCoincide, almuerzo.Estado);
        Assert.Equal(CorteConciliacionFcr.EstadoCoincide, cena.Estado);
    }

    [Fact]
    public async Task RegenerarCorte_NoPisaConciliado()
    {
        await using var db = CrearDb();
        var (dietas, ordenes, etiquetas) = Semana(2, 2, 2, 0);
        db.DietasCatalogo.Add(dietas[0].TipoDieta!);
        db.FilasDietas.AddRange(dietas);
        db.OrdenesCocina.AddRange(ordenes);
        db.EtiquetasEnfermeria.AddRange(etiquetas);
        db.TarifasHistorico.AddRange(TarifasFcr(dietas[0].TipoDieta!));
        await db.SaveChangesAsync();

        var servicio = CrearServicio(db);
        var lista = await servicio.ObtenerConciliacionAsync(Desde, Hasta, sinPaginar: true);
        var almuerzo = lineaNormal(lista, "Almuerzo");

        await servicio.MarcarConciliadoAsync(
            almuerzo.Id,
            new MarcarConciliadoDto
            {
                Motivo = "ajuste-cantidad",
                Observaciones = "Validado con planilla de cocina",
            },
            "nutricionista");

        await servicio.CargarPlanillaAsync(
            new CargarPlanillaCocinaDto
            {
                Desde = Desde,
                Hasta = Hasta,
                Lineas = [new() { Comida = "Almuerzo", LineaFcr = "Normales y derivadas", Cantidad = 99 }],
            },
            "nutricionista");

        var otraVez = await servicio.ObtenerConciliacionAsync(Desde, Hasta, sinPaginar: true);
        var conciliada = lineaNormal(otraVez, "Almuerzo");
        Assert.Equal(CorteConciliacionFcr.EstadoConciliado, conciliada.Estado);
        Assert.NotEqual(99, conciliada.CantidadCocina);
    }

    private static FilaConciliacionDto lineaNormal(ListaConciliacionDto lista, string comida) =>
        lista.Data.Single(l =>
            l.Comida == comida && l.LineaFcr == ContratoCocinaHelper.LineaNormalesYDerivadas);

    private static int TotalComida(IReadOnlyList<CorteConciliacionFcr.GrupoCorte> corte, TiempoComida comida) =>
        corte.Where(g => g.Comida == comida).Sum(g => g.CantidadSistema);

    private static (List<FilaDieta> Dietas, List<OrdenCocina> Ordenes, List<EtiquetaEnfermera> Etiquetas) Semana(
        int desayunos,
        int almuerzos,
        int cenas,
        int meriendas)
    {
        var catalogo = new DietaCatalogo
        {
            Id = ContratoCocinaHelper.CatalogoNormalesId,
            Nombre = "Normales y derivadas",
            Codigo = "D-001",
        };
        var dietas = new List<FilaDieta>();
        var ordenes = new List<OrdenCocina>();
        var etiquetas = new List<EtiquetaEnfermera>();
        Agregar(desayunos, TiempoComida.Desayuno, catalogo, dietas, ordenes, etiquetas);
        Agregar(almuerzos, TiempoComida.Almuerzo, catalogo, dietas, ordenes, etiquetas);
        Agregar(cenas, TiempoComida.Cena, catalogo, dietas, ordenes, etiquetas);
        Agregar(meriendas, TiempoComida.Onces, catalogo, dietas, ordenes, etiquetas);
        return (dietas, ordenes, etiquetas);
    }

    private static List<TarifaHistorico> TarifasFcr(DietaCatalogo catalogo) =>
    [
        Tarifa(catalogo, TiempoComida.Desayuno),
        Tarifa(catalogo, TiempoComida.Almuerzo),
        Tarifa(catalogo, TiempoComida.Cena),
        Tarifa(catalogo, TiempoComida.Onces),
    ];

    private static TarifaHistorico Tarifa(DietaCatalogo catalogo, TiempoComida comida) =>
        new()
        {
            Id = Guid.NewGuid(),
            DietaCatalogoId = catalogo.Id,
            DietaCatalogo = catalogo,
            Anio = 2026,
            TiempoComida = comida,
            Monto = 12_345m,
            VigenciaDesde = new DateTime(2026, 1, 1),
            VigenciaHasta = new DateTime(2026, 12, 31),
            Activa = true,
            CreadoPor = "test",
        };

    private static void Agregar(
        int cantidad,
        TiempoComida comida,
        DietaCatalogo catalogo,
        List<FilaDieta> dietas,
        List<OrdenCocina> ordenes,
        List<EtiquetaEnfermera> etiquetas)
    {
        for (var i = 0; i < cantidad; i++)
        {
            var orden = Orden(comida, "Completada", Desde.AddDays(i % 7));
            var dieta = Dieta(comida, EstadoDieta.Entregada, catalogo.Nombre, Desde.AddDays(i % 7));
            dieta.TipoDieta = catalogo;
            dieta.TipoDietaId = catalogo.Id;
            dieta.OrdenCocinaId = orden.Id;
            dieta.PacienteId = $"P-{comida}-{i}";
            dieta.Cedula = $"{(int)comida}{i:000000}";
            dietas.Add(dieta);
            ordenes.Add(orden);
            etiquetas.Add(Etiqueta(dieta, orden.Id));
        }
    }

    private static FilaDieta Dieta(
        TiempoComida comida,
        EstadoDieta estado,
        string tipo,
        DateTime? fecha = null) =>
        new()
        {
            Id = Guid.NewGuid(),
            Comida = comida,
            Estado = estado,
            Paciente = "Paciente prueba",
            PacienteId = Guid.NewGuid().ToString("N")[..8],
            Servicio = "Hospitalización",
            Pabellon = "P3",
            Habitacion = "101",
            FechaOperativa = fecha ?? Desde,
            TipoDieta = new DietaCatalogo { Id = Guid.NewGuid(), Nombre = tipo, Codigo = "X" },
        };

    private static OrdenCocina Orden(TiempoComida comida, string estado, DateTime? fecha = null) =>
        new()
        {
            Id = Guid.NewGuid(),
            Comida = comida,
            Estado = estado,
            FechaOperativa = fecha ?? Desde,
        };

    private static EtiquetaEnfermera Etiqueta(FilaDieta dieta, Guid? ordenId = null) =>
        new()
        {
            Id = Guid.NewGuid(),
            Codigo = $"E-{dieta.Id:N}"[..12],
            EstadoLogistica = "impresa",
            GeneradaPor = "test",
            GeneradaEn = DateTime.UtcNow,
            FilaDietaId = dieta.Id,
            OrdenCocinaId = ordenId ?? Guid.NewGuid(),
            Comida = dieta.Comida,
            FechaOperativa = dieta.FechaOperativa,
        };

    private static BitalNegocioDbContext CrearDb()
    {
        var options = new DbContextOptionsBuilder<BitalNegocioDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new BitalNegocioDbContext(options);
    }

    private static ConciliacionService CrearServicio(BitalNegocioDbContext db) =>
        new(
            db,
            new NoopAuditoria(),
            new NoopContexto(),
            NullLogger<ConciliacionService>.Instance);

    private sealed class NoopAuditoria : IAuditoriaService
    {
        public Task<ListaEventosAuditoriaDto> ObtenerEventosAsync(FiltrosAuditoriaDto filtros) =>
            Task.FromResult(new ListaEventosAuditoriaDto
            {
                Data = [],
                Meta = new MetaPaginacionDto(),
            });

        public Task<DetalleAuditoriaDto?> ObtenerDetalleEventoAsync(Guid id) =>
            Task.FromResult<DetalleAuditoriaDto?>(null);

        public Task RegistrarEventoAsync(
            string modulo,
            string accion,
            string resultado,
            string usuario,
            string? tipoEntidad = null,
            Guid? entidadId = null,
            string? datosAntes = null,
            string? datosDespues = null,
            string? metadata = null,
            string? mensajeError = null,
            int? duracionMs = null,
            string? direccionIp = null) =>
            Task.CompletedTask;
    }

    private sealed class NoopContexto : IAuditoriaContextoRequest
    {
        public string? ObtenerDireccionIp() => null;
        public string? ObtenerUserAgent() => null;
        public string? ConstruirMetadataCliente() => null;
    }
}
