using Bital.Domain.Entities.DietasCocina;
using Bital.Domain.Enums;
using System.Globalization;

namespace Bital.Infrastructure.DietasCocina;

/// <summary>
/// Tipo de cancelación manual: la tardía factura y exige rol Administrador.
/// </summary>
internal enum TipoCancelacionDieta
{
    Normal,
    Tardia,
}

/// <summary>
/// Reglas de negocio alineadas con el frontend (solicitudDieta.ts).
/// </summary>
internal static class DietasReglasNegocio
{
    private static readonly HashSet<EstadoDieta> EstadosNovedad =
    [
        EstadoDieta.Guardado,
        EstadoDieta.Solicitada,
        EstadoDieta.Confirmada,
        EstadoDieta.EnPreparacion,
        EstadoDieta.Devuelta,
    ];

    private static readonly HashSet<EstadoDieta> EstadosCancelarNormal =
    [
        EstadoDieta.Guardado,
        EstadoDieta.Solicitada,
    ];

    private static readonly HashSet<EstadoDieta> EstadosCancelarTardia =
    [
        EstadoDieta.Confirmada,
        EstadoDieta.EnPreparacion,
        EstadoDieta.ListaEnvio,
    ];

    private static readonly HashSet<string> RolesCancelarTardia =
    [
        RolModuloSeed.NombreAdministrador,
    ];

    /// <summary>
    /// Dieta ya comprometida con cocina: se solicitó y aún no salió en bandeja.
    /// </summary>
    private static readonly HashSet<EstadoDieta> EstadosSolicitados =
    [
        .. EstadosCancelarNormal,
        .. EstadosCancelarTardia,
    ];

    internal static bool PermiteRegistrarNovedad(EstadoDieta estado) =>
        EstadosNovedad.Contains(estado);

    internal static bool EsCancelacionNormal(EstadoDieta estado) =>
        EstadosCancelarNormal.Contains(estado);

    internal static bool EsDietaSolicitada(EstadoDieta estado) =>
        EstadosSolicitados.Contains(estado);

    internal static bool PuedeCancelarTardia(string? rolUsuario) =>
        !string.IsNullOrWhiteSpace(rolUsuario)
        && RolesCancelarTardia.Contains(NormalizarRol(rolUsuario));

    /// <summary>
    /// Tipo de cancelación manual aplicable, o <c>null</c> si no se permite cancelar.
    /// Pasado el límite de novedades cocina ya inició la producción aunque el proveedor
    /// no haya movido el estado: toda dieta solicitada pasa a cancelación tardía y queda
    /// reservada al Administrador con aceptación de facturación.
    /// </summary>
    internal static TipoCancelacionDieta? ResolverTipoCancelacion(
        EstadoDieta estado,
        string? rolUsuario,
        bool ventanaNovedadesAbierta)
    {
        if (ventanaNovedadesAbierta && EsCancelacionNormal(estado))
            return TipoCancelacionDieta.Normal;

        if (!EsDietaSolicitada(estado))
            return null;

        return PuedeCancelarTardia(rolUsuario)
            ? TipoCancelacionDieta.Tardia
            : null;
    }

    /// <summary>
    /// Estados cancelables por salida clínica (INGRESOS.IngInSlC = 'S'), nunca por
    /// ausencia en el snapshot de censo. Se limita a lo que sigue en cocina: desde
    /// EnRuta la bandeja ya salió y debe cerrarse por devolución, no por cancelación.
    /// </summary>
    private static readonly HashSet<EstadoDieta> EstadosCancelarPorEgreso =
    [
        EstadoDieta.Pendiente,
        .. EstadosSolicitados,
    ];

    /// <summary>
    /// Salida clínica (IngInSlC=S) y límite de novedades:
    /// <list type="bullet">
    /// <item>Dentro del límite: cancelar también dietas ya solicitadas para que el
    /// proveedor no prepare y no se desperdicie comida.</item>
    /// <item>Fuera del límite: solo cancelar <see cref="EstadoDieta.Pendiente"/>; las
    /// solicitadas se sostienen (<see cref="DebeSostenerPorEgreso"/>).</item>
    /// </list>
    /// </summary>
    internal static bool DebeCancelarPorEgreso(EstadoDieta estado, bool ventanaNovedadesAbierta)
    {
        if (!EstadosCancelarPorEgreso.Contains(estado)) return false;

        return ventanaNovedadesAbierta || !EsDietaSolicitada(estado);
    }

    /// <summary>
    /// Salida clínica sobre una dieta solicitada fuera de la ventana: no se cancela,
    /// se sostiene marcada para que el proveedor la envíe y se pueda conciliar.
    /// </summary>
    internal static bool DebeSostenerPorEgreso(EstadoDieta estado, bool ventanaNovedadesAbierta) =>
        !ventanaNovedadesAbierta && EsDietaSolicitada(estado);

    /// <summary>
    /// La salida clínica sobre una dieta ya comprometida con el proveedor factura
    /// igual que una cancelación tardía manual.
    /// </summary>
    internal static bool EsCancelacionTardiaPorEgreso(EstadoDieta estado) =>
        EstadosCancelarTardia.Contains(estado);

    /// <summary>
    /// Texto visible en observaciones / UI. Conserva la marca HIS para detección.
    /// </summary>
    internal const string MotivoCancelacionSalidaClinica =
        "Paciente con salida clínica";

    internal const string MotivoSalidaClinicaSostenida =
        "Salida clínica fuera del límite de novedades: la dieta se mantiene y el proveedor la envía";

    internal const string TipoEventoSalidaClinicaSostenida = "dieta_sostenida_salida_clinica";

    internal const string MotivoReactivacionReingreso =
        "Reactivada por reingreso: paciente de nuevo en censo";

    internal const string MotivoReactivacionReingresoFueraVentana =
        "Reactivada por reingreso fuera del límite de novedades: queda sin solicitud; cocina ya cerró el turno";

    internal const string MotivoReactivacionManual =
        "Reactivada manualmente: vuelve a sin solicitud";

    internal const string MotivoReactivacionAlSolicitar =
        "Reactivada al solicitar de nuevo tras cancelación";

    internal const string TipoEventoReactivacionManual = "dieta_reactivada_manual";

    internal const string TipoEventoCancelacionPorEgreso = "dieta_cancelada_egreso";

    internal const string TipoEventoReactivacionPorReingreso = "dieta_reactivada_reingreso";

    internal static bool EsSalidaClinicaSostenida(FilaDieta fila) =>
        fila.SalidaClinicaSostenida && fila.Estado != EstadoDieta.Cancelada;

    private static readonly HashSet<EstadoDieta> EstadosActivosEnCocina =
    [
        EstadoDieta.Confirmada,
        EstadoDieta.EnPreparacion,
        EstadoDieta.ListaEnvio,
        EstadoDieta.EnRuta,
        EstadoDieta.Entregada,
        EstadoDieta.Consumida,
        EstadoDieta.NoConsumida,
        EstadoDieta.Devuelta,
    ];

    /// <summary>
    /// Dieta visible en cocina (pantalla y reporte del proveedor): solo las que llegaron
    /// a Confirmada y generaron orden. Una cancelada entra solo si alguna vez estuvo
    /// comprometida (orden creada o cancelación tardía); Guardado/Solicitada canceladas
    /// nunca aparecen porque nunca salieron del flujo clínico.
    /// </summary>
    internal static bool EstuvoComprometidaConCocina(FilaDieta fila) =>
        fila.Estado == EstadoDieta.Cancelada
            ? fila.OrdenCocinaId.HasValue || fila.CancelacionTardia
            : EstadosActivosEnCocina.Contains(fila.Estado);

    /// <summary>
    /// Detecta cancelación automática por salida clínica / egreso (texto actual o legado).
    /// Excluye observaciones de dietas sostenidas fuera del límite de novedades.
    /// </summary>
    internal static bool EsObservacionSalidaClinicaSostenida(string? observaciones) =>
        !string.IsNullOrWhiteSpace(observaciones)
        && (observaciones.Contains(MotivoSalidaClinicaSostenida, StringComparison.OrdinalIgnoreCase)
            || observaciones.Contains("fuera del límite de novedades", StringComparison.OrdinalIgnoreCase)
            || observaciones.Contains("fuera del limite de novedades", StringComparison.OrdinalIgnoreCase));

    internal static bool EsObservacionSalidaClinica(string? observaciones)
    {
        if (string.IsNullOrWhiteSpace(observaciones)) return false;

        // Texto de sostenida también contiene «salida clínica» pero la dieta sigue activa.
        if (EsObservacionSalidaClinicaSostenida(observaciones))
            return false;

        // Textos actuales y legados del cancelado automático por HIS / censo.
        return observaciones.Contains("salida clínica", StringComparison.OrdinalIgnoreCase)
            || observaciones.Contains("IngInSlC = S", StringComparison.OrdinalIgnoreCase)
            || observaciones.Contains("IngInSlC=S", StringComparison.OrdinalIgnoreCase)
            || observaciones.Contains("egreso del paciente", StringComparison.OrdinalIgnoreCase)
            || observaciones.Contains("egresado del censo", StringComparison.OrdinalIgnoreCase)
            || observaciones.Contains("paciente egresado", StringComparison.OrdinalIgnoreCase)
            || (observaciones.Contains("cancelada automáticamente", StringComparison.OrdinalIgnoreCase)
                && observaciones.Contains("egreso", StringComparison.OrdinalIgnoreCase));
    }

    /// <summary>
    /// Estado operativo al volver al censo tras salida clínica.
    /// Dentro del límite: si ya estaba en cocina, vuelve a Confirmada.
    /// Fuera del límite: Pendiente — cocina ya cerró; no reabrir «En gestión».
    /// </summary>
    internal static EstadoDieta EstadoTrasReingresoTrasSalidaClinica(
        EstadoDieta estadoAlCancelar,
        bool ventanaNovedadesAbierta)
    {
        if (!ventanaNovedadesAbierta)
            return EstadoDieta.Pendiente;

        return estadoAlCancelar switch
        {
            EstadoDieta.Confirmada
                or EstadoDieta.EnPreparacion
                or EstadoDieta.ListaEnvio => EstadoDieta.Confirmada,
            EstadoDieta.Guardado or EstadoDieta.Solicitada => estadoAlCancelar,
            _ => EstadoDieta.Pendiente,
        };
    }

    /// <summary>
    /// Dieta reactivada por reingreso pero fuera de ventana: no debe seguir en cocina.
    /// </summary>
    internal static bool DebeCorregirReingresoFueraVentana(FilaDieta fila, bool ventanaNovedadesAbierta)
    {
        if (ventanaNovedadesAbierta) return false;
        if (fila.Estado is EstadoDieta.Pendiente or EstadoDieta.Cancelada) return false;

        if (EsSalidaClinicaSostenida(fila) || EsObservacionSalidaClinicaSostenida(fila.Observaciones))
            return false;

        return !string.IsNullOrWhiteSpace(fila.Observaciones)
               && fila.Observaciones.Contains(MotivoReactivacionReingreso, StringComparison.OrdinalIgnoreCase)
               && !fila.Observaciones.Contains(
                   MotivoReactivacionReingresoFueraVentana,
                   StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Solo dietas activas en censo (no canceladas / no terminales de consumo) pueden generar etiqueta.
    /// </summary>
    private static readonly HashSet<EstadoDieta> EstadosAptosParaEtiqueta =
    [
        EstadoDieta.Confirmada,
        EstadoDieta.EnPreparacion,
        EstadoDieta.ListaEnvio,
        EstadoDieta.EnRuta,
        EstadoDieta.Entregada,
    ];

    internal static bool PermiteGenerarEtiqueta(EstadoDieta estado) =>
        EstadosAptosParaEtiqueta.Contains(estado);

    internal static bool EsMerienda(TiempoComida comida) =>
        comida is TiempoComida.MediaNueve or TiempoComida.Onces or TiempoComida.MediaNoche;

    internal static bool RequiereConsistencia(TiempoComida comida) =>
        !EsMerienda(comida);

    internal static void ValidarCamposClinicosPorComida(FilaDieta fila)
    {
        if (!fila.TipoDietaId.HasValue && string.IsNullOrWhiteSpace(fila.DescripcionDieta))
        {
            throw new InvalidOperationException(
                "El tipo de dieta es obligatorio para esta comida.");
        }

        if (RequiereConsistencia(fila.Comida) && string.IsNullOrEmpty(fila.Consistencia))
        {
            throw new InvalidOperationException(
                "La consistencia es obligatoria para esta comida.");
        }
    }

    internal static void ValidarTarifaTipoDietaParaComida(
        FilaDieta fila,
        IEnumerable<TarifaHistorico> tarifasCatalogo,
        DateTime hoy)
    {
        if (!fila.TipoDietaId.HasValue)
        {
            return;
        }

        if (!TarifasCatalogoHelper.TieneTarifaVigenteParaComida(
                tarifasCatalogo.Where(t => t.DietaCatalogoId == fila.TipoDietaId),
                fila.Comida,
                hoy))
        {
            throw new InvalidOperationException(
                $"El tipo de dieta seleccionado no tiene tarifa vigente para {fila.Comida}.");
        }
    }

    /// <summary>
    /// Salida clínica sobre dieta solicitada cuando la ventana ya estaba cerrada:
    /// debió sostenerse, no cancelarse.
    /// </summary>
    internal static bool EgresoDebióSostenerse(
        EstadoDieta estadoAlEgreso,
        TiempoComidaConfig? config,
        DateTime fechaOperativa,
        DateTime momentoEgresoLocal) =>
        DebeSostenerPorEgreso(
            estadoAlEgreso,
            VentanaNovedadesAbiertaParaFecha(config, fechaOperativa, momentoEgresoLocal));

    internal static bool VentanaNovedadesAbierta(TiempoComidaConfig? config, DateTime ahoraLocal)
    {
        if (config is null || !config.Activo)
            return false;

        return EstaEnRangoHorario(
            ahoraLocal.TimeOfDay,
            config.HoraPreparacion,
            config.HoraCierre);
    }

    /// <summary>
    /// Ventana de novedades relativa a la fecha operativa de la dieta: una fecha futura
    /// (carga anticipada) todavía no entra en producción y una pasada ya cerró.
    /// El corte es siempre el límite de novedades, aun con carga anticipada: ese modo
    /// extiende la solicitud, no el momento en que cocina empieza a producir.
    /// </summary>
    internal static bool VentanaNovedadesAbiertaParaFecha(
        TiempoComidaConfig? config,
        DateTime fechaOperativa,
        DateTime ahoraLocal)
    {
        if (fechaOperativa.Date > ahoraLocal.Date) return true;
        if (fechaOperativa.Date < ahoraLocal.Date) return false;

        return VentanaNovedadesAbierta(config, ahoraLocal);
    }

    /// <summary>
    /// Ventana de solicitud ordinaria: entre apertura (HoraPreparacion) y
    /// límite de novedades (HoraCierre). Soporta rangos que cruzan medianoche.
    /// </summary>
    internal static bool VentanaSolicitudAbierta(TiempoComidaConfig? config, DateTime ahoraLocal)
        => VentanaNovedadesAbierta(config, ahoraLocal);

    /// <summary>
    /// Con carga anticipada, la solicitud de una comida permanece abierta desde su
    /// hora de solicitud hasta la entrega programada (proxy de fin de distribución).
    /// </summary>
    internal static bool VentanaSolicitudAbiertaConModo(
        TiempoComidaConfig? config,
        string? modoCarga,
        DateTime ahoraLocal)
    {
        if (config is null || !config.Activo)
            return false;

        var fin = string.Equals(
            modoCarga,
            ParametrosOperativosHelper.ModoCargaTodasDesdeManana,
            StringComparison.OrdinalIgnoreCase)
            ? config.HoraEntrega
            : config.HoraCierre;

        return EstaEnRangoHorario(ahoraLocal.TimeOfDay, config.HoraPreparacion, fin);
    }

    private static bool EstaEnRangoHorario(TimeSpan ahora, TimeSpan inicio, TimeSpan fin)
    {
        if (inicio <= fin)
            return ahora >= inicio && ahora <= fin;

        // Cruza medianoche: p. ej. 22:00 → 06:00
        return ahora >= inicio || ahora <= fin;
    }

    internal static void ValidarCondicionesClinicas(
        bool aislado,
        string? observacionAislamiento,
        bool alergico,
        string? alergias)
    {
        if (aislado && string.IsNullOrWhiteSpace(observacionAislamiento))
        {
            throw new InvalidOperationException(
                "Debe indicar la observación de aislamiento cuando el paciente está aislado.");
        }

        if (alergico && string.IsNullOrWhiteSpace(alergias))
        {
            throw new InvalidOperationException(
                "Debe indicar las alergias del paciente cuando está marcado como alérgico.");
        }
    }

    private static string NormalizarRol(string rol) =>
        rol.Trim() switch
        {
            "admin" or "Admin" => RolModuloSeed.NombreAdministrador,
            _ => rol.Trim(),
        };

    /// <summary>
    /// Resuelve el servicio clínico desde Vital (ClaPro) o infiere desde el pabellón.
    /// ClaPro suele ser un código (ej. "2", "3"); si no es descriptivo, se usa el pabellón.
    /// </summary>
    internal static string ResolverServicioClinico(string? servicioHIS, string pabellon)
    {
        // UCI ADULTO / UCI PEDIÁTRICA, etc.: el pabellón manda sobre un servicio genérico del HIS.
        var especialidad = EspecialidadDesdePabellon(pabellon);
        if (especialidad != null)
            return especialidad;

        if (EsServicioDescriptivo(servicioHIS))
            return servicioHIS!.Trim();

        return InferirServicioDesdePabellon(pabellon);
    }

    private static string? EspecialidadDesdePabellon(string pabellon)
    {
        if (string.IsNullOrWhiteSpace(pabellon))
            return null;

        var normalizado = pabellon.ToUpperInvariant();
        if (normalizado.Contains("UCI")) return "UCI";
        if (normalizado.Contains("URGENCI")) return "Urgencias";
        if (normalizado.Contains("NEONATAL")) return "Neonatal";
        return null;
    }

    internal static bool EsServicioDescriptivo(string? servicioHIS)
    {
        if (string.IsNullOrWhiteSpace(servicioHIS))
            return false;

        var valor = servicioHIS.Trim();

        if (valor.Equals("Sin información", StringComparison.OrdinalIgnoreCase) ||
            valor.Equals("Sin servicio", StringComparison.OrdinalIgnoreCase))
            return false;

        // ClaPro numérico (ej. "2", "3") no es una etiqueta legible para el usuario.
        if (valor.All(char.IsDigit))
            return false;

        // Códigos cortos sin letras (ej. "03") tampoco se muestran como servicio.
        if (valor.Length <= 2 && !valor.Any(char.IsLetter))
            return false;

        return true;
    }

    internal static string InferirServicioDesdePabellon(string pabellon)
    {
        if (string.IsNullOrWhiteSpace(pabellon))
            return "Sin servicio";

        var normalizado = pabellon.ToUpperInvariant();
        if (normalizado.Contains("UCI")) return "UCI";
        if (normalizado.Contains("URGENCI")) return "Urgencias";
        if (normalizado.Contains("NEONATAL")) return "Neonatal";
        if (normalizado.Contains("HOSPITALIZ") || normalizado.Contains("PISO"))
            return "Hospitalización";

        return CultureInfo.CurrentCulture.TextInfo.ToTitleCase(pabellon.ToLowerInvariant());
    }
}
