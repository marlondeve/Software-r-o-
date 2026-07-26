using Bital.Domain.Entities.DietasCocina;
using Bital.Domain.Entities.Encuestas;
using Microsoft.EntityFrameworkCore;

namespace Bital.Infrastructure.Data;

/// <summary>
/// Contexto de base de datos para el sistema Bital (lógica de negocio)
/// </summary>
public class BitalNegocioDbContext : DbContext
{
    public BitalNegocioDbContext(DbContextOptions<BitalNegocioDbContext> options)
        : base(options)
    {
    }

    // ============================================================================
    // DbSets - Dietas y Cocina
    // ============================================================================

    public DbSet<FilaDieta> FilasDietas { get; set; }
    public DbSet<DietaCatalogo> DietasCatalogo { get; set; }
    public DbSet<TarifaHistorico> TarifasHistorico { get; set; }
    public DbSet<EventoTrazabilidad> EventosTrazabilidad { get; set; }
    public DbSet<OrdenCocina> OrdenesCocina { get; set; }
    public DbSet<EtiquetaEnfermera> EtiquetasEnfermeria { get; set; }
    public DbSet<FilaConciliacion> FilasConciliacion { get; set; }
    public DbSet<TiempoComidaConfig> TiemposComida { get; set; }
    public DbSet<CategoriaEdad> CategoriasEdad { get; set; }
    public DbSet<EventoAuditoria> EventosAuditoria { get; set; }
    public DbSet<UsuarioModulo> UsuariosModulo { get; set; }
    public DbSet<PermisoRol> PermisosRol { get; set; }

    // ============================================================================
    // DbSets - Encuestas
    // ============================================================================

    public DbSet<IdentificacionPaciente> IdentificacionesPacientes { get; set; }
    public DbSet<CuestionarioEncuesta> CuestionariosEncuesta { get; set; }
    public DbSet<SeccionCuestionario> SeccionesCuestionario { get; set; }
    public DbSet<PreguntaCuestionario> PreguntasCuestionario { get; set; }
    public DbSet<OpcionPreguntaCuestionario> OpcionesPreguntaCuestionario { get; set; }
    public DbSet<LogicaPreguntaCuestionario> LogicasPreguntaCuestionario { get; set; }
    public DbSet<ReglaCondicionalEncuesta> ReglasCondicionalesEncuesta { get; set; }
    public DbSet<ConfiguracionEncuesta> ConfiguracionesEncuesta { get; set; }
    public DbSet<CapturaEncuesta> CapturasEncuesta { get; set; }
    public DbSet<RespuestaCapturaEncuesta> RespuestasCapturaEncuesta { get; set; }
    public DbSet<IntentoLlamadaEncuesta> IntentosLlamadaEncuesta { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Aplicar configuraciones desde el assembly actual
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(BitalNegocioDbContext).Assembly);

        // Configuración de esquemas
        modelBuilder.HasDefaultSchema("bital");
    }
}
