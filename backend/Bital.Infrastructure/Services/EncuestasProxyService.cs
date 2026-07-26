using Bital.Application.DTOs.DietasCocina;
using Bital.Application.DTOs.Encuestas;
using Bital.Application.Interfaces;
using Bital.Domain.Entities.Encuestas;
using Bital.Domain.Enums;
using Bital.Infrastructure.Data;
using Bital.Shared.Contracts.Responses;
using Bital.Shared.Contracts.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Bital.Infrastructure.Services;

public class EncuestasProxyService : IEncuestasBffService
{
    private readonly IPacientesQueryService _pacientesQueryService;
    private readonly IAtencionesQueryService _atencionesQueryService;
    private readonly ICuestionariosService _cuestionariosService;
    private readonly BitalNegocioDbContext _dbContext;
    private readonly ILogger<EncuestasProxyService> _logger;


    public EncuestasProxyService(
        IPacientesQueryService pacientesQueryService,
        IAtencionesQueryService atencionesQueryService,
        ICuestionariosService cuestionariosService,
        BitalNegocioDbContext dbContext,
        ILogger<EncuestasProxyService> logger)
    {
        _pacientesQueryService = pacientesQueryService;
        _atencionesQueryService = atencionesQueryService;
        _cuestionariosService = cuestionariosService;
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<EnvelopePacientesDto> BuscarPacientesAsync(string termino, int maxResults = 10, CancellationToken cancellationToken = default)
    {
        var pacientes = (await _pacientesQueryService.BuscarPacientesPorNombreAsync(termino, maxResults, cancellationToken)).ToList();

        return new EnvelopePacientesDto
        {
            Data = pacientes.Select(p => new BusquedaPacienteDto
            {
                NumeroDocumento = p.Cedula,
                TipoDocumento = p.TipoDocumento,
                PrimerNombre = p.PrimerNombre ?? string.Empty,
                SegundoNombre = p.SegundoNombre ?? string.Empty,
                PrimerApellido = p.PrimerApellido ?? string.Empty,
                SegundoApellido = p.SegundoApellido ?? string.Empty,
                NombreCompleto = p.NombreCompleto,
                FechaNacimiento = p.FechaNacimiento,
                Sexo = p.Sexo,
                Telefono = p.Telefono,
                Estado = p.Estado
            }).ToList(),
            Total = pacientes.Count
        };
    }

    public async Task<EnvelopeAtencionesDto> ObtenerAtencionesAsync(string cedula, string tipoDocumento, CancellationToken cancellationToken = default)
    {
        var atenciones = (await _atencionesQueryService.GetAtencionesPorPacienteAsync(cedula, tipoDocumento, cancellationToken)).ToList();

        return new EnvelopeAtencionesDto
        {
            Data = atenciones.Select(a => new AtencionPacienteDto
            {
                NumeroAtencion = a.Consecutivo,
                FechaIngreso = a.FechaAdmision ?? DateTime.MinValue,
                FechaEgreso = a.FechaEgreso,
                ServicioDescripcion = a.TipoHospitalizacion ?? a.ClaseProcedimiento ?? string.Empty,
                Pabellon = null,
                MedicoTratante = null,
                EstadoAtencion = a.EstadoActual,
                Diagnostico = a.DiagnosticoEntrada,
                TipoHospitalizacion = a.TipoHospitalizacion
            }).ToList(),
            Total = atenciones.Count
        };
    }

    public async Task<PacienteContextoDto> RegistrarIdentificacionAsync(IdentificarPacienteRequestDto request, string usuario, CancellationToken cancellationToken = default)
    {
        var paciente = await _pacientesQueryService.GetPacientePorDocumentoAsync(request.NumeroDocumento, request.TipoDocumento, cancellationToken);

        if (paciente == null)
        {
            throw new InvalidOperationException($"No se encontró el paciente {request.TipoDocumento}-{request.NumeroDocumento}");
        }

        var atenciones = (await _atencionesQueryService.GetAtencionesPorPacienteAsync(request.NumeroDocumento, request.TipoDocumento, cancellationToken)).ToList();
        var atencionSeleccionada = request.NumeroAtencion.HasValue
            ? atenciones.FirstOrDefault(x => x.Consecutivo == request.NumeroAtencion.Value)
            : atenciones.FirstOrDefault();

        return new PacienteContextoDto
        {
            NumeroDocumento = paciente.Cedula,
            TipoDocumento = paciente.TipoDocumento,
            NombreCompleto = paciente.NombreCompleto,
            Canal = request.Canal,
            CanalNombre = request.Canal switch
            {
                CanalEncuesta.Presencial => "Presencial",
                CanalEncuesta.Telefonico => "Telefónico",
                CanalEncuesta.Digital => "Digital",
                _ => request.Canal.ToString()
            },
            NumeroAtencion = atencionSeleccionada?.Consecutivo ?? request.NumeroAtencion,
            ServicioAtencion = atencionSeleccionada?.TipoHospitalizacion,
            FechaIdentificacion = DateTime.UtcNow,
            IdentificacionId = Guid.NewGuid()
        };
    }

    public async Task<RespuestaCapturaPresencialDto> ObtenerCapturaPresencialAsync(FiltrosCapturaPresencialDto filtros, CancellationToken cancellationToken = default)
    {
        var items = (await _atencionesQueryService.GetCapturaPresencialAsync(
                filtros.Servicio,
                filtros.Pabellon,
                filtros.Estado,
                filtros.Busqueda,
                cancellationToken))
            .Select(x => new PacienteCapturaPresencialDto
            {
                NumeroDocumento = x.Cedula,
                TipoDocumento = x.TipoDocumento,
                NombreCompleto = x.NombreCompleto,
                Servicio = x.Servicio,
                Pabellon = x.Pabellon,
                Cama = x.Cama,
                EstadoEncuesta = x.EstadoPaciente,
                FechaIngreso = x.FechaIngreso,
                IdIngreso = x.IdIngreso
            })
            .ToList();

        return new RespuestaCapturaPresencialDto
        {
            Data = items,
            Meta = new Bital.Application.DTOs.DietasCocina.MetaPaginacionDto
            {
                Total = items.Count,
                Page = filtros.Page,
                PageSize = filtros.PageSize,
                TotalPages = items.Count == 0 ? 0 : 1
            },
            Kpis = new KpiCapturaPresencialDto
            {
                PacientesActivos = items.Count,
                EncuestasCompletadas = 0,
                Pendientes = items.Count,
                NoDisponibles = 0,
                Rechazadas = 0
            }
        };
    }

    public async Task<RespuestaCapturaTelefonicaDto> ObtenerCapturaTelefonicaAsync(FiltrosCapturaTelefonicaDto filtros, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.CapturasEncuesta.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(filtros.Busqueda))
        {
            var busqueda = filtros.Busqueda.Trim();
            query = query.Where(x => x.NombreCompleto.Contains(busqueda) || x.NumeroDocumento.Contains(busqueda));
        }

        if (!string.IsNullOrWhiteSpace(filtros.TipoHospitalizacion))
        {
            query = query.Where(x => x.Servicio.Contains(filtros.TipoHospitalizacion));
        }

        if (!string.IsNullOrWhiteSpace(filtros.Servicio))
        {
            query = query.Where(x => x.Servicio == filtros.Servicio);
        }

        if (!string.IsNullOrWhiteSpace(filtros.Estado) && Enum.TryParse<EstadoEncuesta>(filtros.Estado, true, out var estado))
        {
            query = query.Where(x => x.Estado == estado);
        }

        if (filtros.FechaCitaDesde.HasValue)
        {
            query = query.Where(x => x.FechaInicio >= filtros.FechaCitaDesde.Value);
        }

        if (filtros.FechaCitaHasta.HasValue)
        {
            query = query.Where(x => x.FechaInicio <= filtros.FechaCitaHasta.Value);
        }

        var total = query.Count();
        var items = query
            .OrderBy(x => x.NombreCompleto)
            .Skip(Math.Max(0, filtros.Page - 1) * filtros.PageSize)
            .Take(filtros.PageSize)
            .Select(x => new FilaCapturaTelefonicaDto
            {
                Id = x.Id.ToString(),
                NumeroDocumento = x.NumeroDocumento,
                TipoDocumento = x.TipoDocumento,
                NombreCompleto = x.NombreCompleto,
                Telefono = x.Telefono,
                EstadoEncuesta = x.Estado.ToString(),
                Servicio = x.Servicio,
                TipoHospitalizacion = x.Servicio,
                FechaCita = x.FechaInicio,
                IntentosLlamada = x.IntentosLlamada.Count
            })
            .ToList();

        return new RespuestaCapturaTelefonicaDto
        {
            Data = items,
            Meta = new Bital.Application.DTOs.DietasCocina.MetaPaginacionDto
            {
                Total = total,
                Page = filtros.Page,
                PageSize = filtros.PageSize,
                TotalPages = filtros.PageSize <= 0 ? 0 : (int)Math.Ceiling(total / (double)filtros.PageSize)
            },
            Kpis = new KpiCapturaTelefonicaDto
            {
                PacientesPorContactar = query.Count(x => x.Estado == EstadoEncuesta.Pendiente),
                Contactados = query.Count(x => x.Estado == EstadoEncuesta.EnProceso),
                ReintentosPendientes = query.Count(x => x.IntentosLlamada.Count < 3),
                SinRespuesta = query.Count(x => x.Estado == EstadoEncuesta.NoDisponible),
                Rechazos = query.Count(x => x.Estado == EstadoEncuesta.Rechazada),
                Completadas = query.Count(x => x.Estado == EstadoEncuesta.Completada)
            }
        };
    }

    public async Task<InicioCapturaEncuestaResponseDto> IniciarCapturaPresencialAsync(string pacienteId, Guid cuestionarioId, CancellationToken cancellationToken = default)
    {
        var cuestionario = await _cuestionariosService.ObtenerCuestionarioAsync(cuestionarioId, cancellationToken);
        var secciones = cuestionario.Secciones.Select(MapSeccion).ToList();

        var consecutivo = $"ENC-{DateTime.UtcNow:yyyyMMdd}-{Math.Abs(pacienteId.GetHashCode()) % 100000:D5}";
        var captura = new CapturaEncuesta
        {
            Id = Guid.NewGuid(),
            Consecutivo = consecutivo,
            CuestionarioEncuestaId = cuestionarioId,
            NumeroDocumento = pacienteId,
            TipoDocumento = "N/A",
            NombreCompleto = $"Paciente {pacienteId}",
            Servicio = cuestionario.Nombre,
            Canal = CanalEncuesta.Presencial,
            Estado = EstadoEncuesta.EnProceso,
            FechaInicio = DateTime.UtcNow,
            CreadoPor = "sistema"
        };

        _dbContext.CapturasEncuesta.Add(captura);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return new InicioCapturaEncuestaResponseDto
        {
            CapturaId = captura.Id,
            Secciones = CloneSecciones(secciones)
        };
    }

    public async Task GuardarRespuestasAsync(string encuestaId, GuardarRespuestasEncuestaRequestDto request, CancellationToken cancellationToken = default)
    {
        if (!Guid.TryParse(encuestaId, out var capturaId))
        {
            throw new ArgumentException("El identificador de captura no es válido");
        }

        var captura = await _dbContext.CapturasEncuesta
            .Include(x => x.Respuestas)
            .FirstOrDefaultAsync(x => x.Id == capturaId, cancellationToken);
        if (captura == null)
        {
            throw new KeyNotFoundException($"No se encontró la captura {encuestaId}");
        }

        foreach (var seccion in request.Secciones)
        {
            foreach (var respuesta in seccion.Respuestas)
            {
                var valorTexto = respuesta.Valor;
                var valorMultiple = respuesta.Valores.Count > 0 ? string.Join(",", respuesta.Valores) : null;
                var existente = captura.Respuestas.FirstOrDefault(x => x.PreguntaCuestionarioId == respuesta.PreguntaId);
                if (existente == null)
                {
                    captura.Respuestas.Add(new RespuestaCapturaEncuesta
                    {
                        Id = Guid.NewGuid(),
                        CapturaEncuestaId = captura.Id,
                        PreguntaCuestionarioId = respuesta.PreguntaId,
                        ValorTexto = valorTexto,
                        ValorMultiple = valorMultiple,
                        FechaRespuesta = DateTime.UtcNow,
                        CreadoPor = "sistema"
                    });
                }
                else
                {
                    existente.ValorTexto = valorTexto;
                    existente.ValorMultiple = valorMultiple;
                    existente.FechaRespuesta = DateTime.UtcNow;
                    existente.ModificadoEn = DateTime.UtcNow;
                    existente.ModificadoPor = "sistema";
                }
            }
        }

        captura.FechaUltimaActualizacion = DateTime.UtcNow;
        captura.ModificadoEn = DateTime.UtcNow;
        captura.ModificadoPor = "sistema";
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<FinalizarEncuestaResponseDto> CompletarEncuestaAsync(string encuestaId, FinalizarEncuestaRequestDto request, CancellationToken cancellationToken = default)
    {
        if (!Guid.TryParse(encuestaId, out var capturaId))
        {
            throw new ArgumentException("El identificador de captura no es válido");
        }

        var captura = await _dbContext.CapturasEncuesta
            .Include(x => x.Respuestas)
            .FirstOrDefaultAsync(x => x.Id == capturaId, cancellationToken);
        if (captura == null)
        {
            throw new KeyNotFoundException($"No se encontró la captura {encuestaId}");
        }

        foreach (var seccion in request.Secciones)
        {
            foreach (var respuesta in seccion.Respuestas)
            {
                var valorTexto = respuesta.Valor;
                var valorMultiple = respuesta.Valores.Count > 0 ? string.Join(",", respuesta.Valores) : null;
                var existente = captura.Respuestas.FirstOrDefault(x => x.PreguntaCuestionarioId == respuesta.PreguntaId);
                if (existente == null)
                {
                    captura.Respuestas.Add(new RespuestaCapturaEncuesta
                    {
                        Id = Guid.NewGuid(),
                        CapturaEncuestaId = captura.Id,
                        PreguntaCuestionarioId = respuesta.PreguntaId,
                        ValorTexto = valorTexto,
                        ValorMultiple = valorMultiple,
                        FechaRespuesta = DateTime.UtcNow,
                        CreadoPor = "sistema"
                    });
                }
                else
                {
                    existente.ValorTexto = valorTexto;
                    existente.ValorMultiple = valorMultiple;
                    existente.FechaRespuesta = DateTime.UtcNow;
                    existente.ModificadoEn = DateTime.UtcNow;
                    existente.ModificadoPor = "sistema";
                }
            }
        }

        captura.Estado = EstadoEncuesta.Completada;
        captura.FechaFinalizacion = DateTime.UtcNow;
        captura.FechaUltimaActualizacion = DateTime.UtcNow;
        captura.ModificadoEn = DateTime.UtcNow;
        captura.ModificadoPor = "sistema";

        await _dbContext.SaveChangesAsync(cancellationToken);
        return new FinalizarEncuestaResponseDto { Consecutivo = captura.Consecutivo };
    }

    public async Task<ListaEncuestasRealizadasDto> ObtenerEncuestasRealizadasAsync(FiltrosEncuestasRealizadasDto filtros, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.CapturasEncuesta
            .AsNoTracking()
            .Where(x => x.Estado == EstadoEncuesta.Completada);

        if (filtros.FechaDesde.HasValue)
        {
            query = query.Where(x => (x.FechaFinalizacion ?? x.FechaInicio) >= filtros.FechaDesde.Value);
        }

        if (filtros.FechaHasta.HasValue)
        {
            query = query.Where(x => (x.FechaFinalizacion ?? x.FechaInicio) <= filtros.FechaHasta.Value);
        }

        if (!string.IsNullOrWhiteSpace(filtros.Servicio))
        {
            query = query.Where(x => x.Servicio == filtros.Servicio);
        }

        if (!string.IsNullOrWhiteSpace(filtros.Canal) && Enum.TryParse<CanalEncuesta>(filtros.Canal, true, out var canal))
        {
            query = query.Where(x => x.Canal == canal);
        }

        if (!string.IsNullOrWhiteSpace(filtros.Estado) && Enum.TryParse<EstadoEncuesta>(filtros.Estado, true, out var estado))
        {
            query = query.Where(x => x.Estado == estado);
        }

        if (!string.IsNullOrWhiteSpace(filtros.Busqueda))
        {
            var busqueda = filtros.Busqueda.Trim();
            query = query.Where(x => EF.Functions.Like(x.Consecutivo, $"%{busqueda}%") || EF.Functions.Like(x.NumeroDocumento, $"%{busqueda}%") || EF.Functions.Like(x.NombreCompleto, $"%{busqueda}%"));
        }

        if (!string.IsNullOrWhiteSpace(filtros.Sat) && int.TryParse(filtros.Sat, out var sat))
        {
            query = query.Where(x => x.Sat == sat);
        }

        if (!string.IsNullOrWhiteSpace(filtros.Nps) && int.TryParse(filtros.Nps, out var nps))
        {
            query = query.Where(x => x.Nps == nps);
        }

        var total = await query.CountAsync(cancellationToken);
        var totalPages = filtros.PageSize <= 0 ? 0 : (int)Math.Ceiling(total / (double)filtros.PageSize);
        var items = await query
            .OrderByDescending(x => x.FechaFinalizacion ?? x.FechaInicio)
            .Skip(Math.Max(0, filtros.Page - 1) * filtros.PageSize)
            .Take(filtros.PageSize)
            .Select(x => new FilaEncuestaRealizadaDto
            {
                Id = x.Id.ToString(),
                Consecutivo = x.Consecutivo,
                NumeroDocumento = x.NumeroDocumento,
                TipoDocumento = x.TipoDocumento,
                NombreCompleto = x.NombreCompleto,
                Servicio = x.Servicio,
                Canal = x.Canal.ToString(),
                Estado = x.Estado.ToString(),
                FechaRealizacion = x.FechaFinalizacion ?? x.FechaInicio,
                Sat = x.Sat,
                Nps = x.Nps,
                RequiereSeguimiento = x.RequiereSeguimiento
            })
            .ToListAsync(cancellationToken);

        return new ListaEncuestasRealizadasDto
        {
            Data = items,
            Meta = new Bital.Application.DTOs.DietasCocina.MetaPaginacionDto
            {
                Total = total,
                Page = filtros.Page,
                PageSize = filtros.PageSize,
                TotalPages = totalPages
            }
        };
    }

    public async Task<DetalleEncuestaRealizadaDto> ObtenerEncuestaRealizadaAsync(string id, CancellationToken cancellationToken = default)
    {
        if (!Guid.TryParse(id, out var capturaId))
        {
            throw new ArgumentException("El identificador de encuesta realizada no es válido");
        }

        var captura = await _dbContext.CapturasEncuesta
            .AsNoTracking()
            .Include(x => x.Respuestas)
            .FirstOrDefaultAsync(x => x.Id == capturaId, cancellationToken);

        if (captura == null)
        {
            throw new KeyNotFoundException($"No se encontró la encuesta realizada {id}");
        }

        return new DetalleEncuestaRealizadaDto
        {
            Id = captura.Id.ToString(),
            Consecutivo = captura.Consecutivo,
            NumeroDocumento = captura.NumeroDocumento,
            TipoDocumento = captura.TipoDocumento,
            NombreCompleto = captura.NombreCompleto,
            Servicio = captura.Servicio,
            Canal = captura.Canal.ToString(),
            Estado = captura.Estado.ToString(),
            FechaRealizacion = captura.FechaFinalizacion ?? captura.FechaInicio,
            Sat = captura.Sat,
            Nps = captura.Nps,
            RequiereSeguimiento = captura.RequiereSeguimiento,
            Respuestas = captura.Respuestas.Select(r => new RespuestaEncuestaDetalleDto
            {
                Seccion = string.Empty,
                Pregunta = r.PreguntaCuestionarioId.ToString(),
                Valor = r.ValorTexto ?? r.ValorMultiple
            }).ToList(),
            MotivoAnulacion = captura.MotivoAnulacion,
            FechaAnulacion = captura.FechaAnulacion,
            UsuarioAnulacion = captura.UsuarioAnulacion
        };
    }

    public async Task<RespuestaIndicadoresExperienciaDto> ObtenerIndicadoresExperienciaAsync(FiltrosIndicadoresExperienciaDto filtros, CancellationToken cancellationToken = default)
    {
        var realizadas = _dbContext.CapturasEncuesta.AsNoTracking().Where(x => x.Estado == EstadoEncuesta.Completada);
        if (!string.IsNullOrWhiteSpace(filtros.Servicio))
        {
            realizadas = realizadas.Where(x => x.Servicio == filtros.Servicio);
        }

        if (!string.IsNullOrWhiteSpace(filtros.Canal) && Enum.TryParse<CanalEncuesta>(filtros.Canal, true, out var canal))
        {
            realizadas = realizadas.Where(x => x.Canal == canal);
        }

        var realizadasList = await realizadas.ToListAsync(cancellationToken);
        var total = realizadasList.Count;
        var completadas = total;
        var anuladas = await _dbContext.CapturasEncuesta.AsNoTracking().CountAsync(x => x.MotivoAnulacion != null, cancellationToken);

        var kpis = new List<KpiExperienciaDto>
        {
            new() { Label = "Satisfacción Global", Valor = total == 0 ? "0" : ((realizadasList.Count(x => x.Sat >= 4) * 100.0) / Math.Max(total, 1)).ToString("0.0"), Sufijo = "%", Trend = new TendenciaKpiDto { Direction = "up", Texto = "+2.1%" }, Nota = $"{completadas} completadas" },
            new() { Label = "Recomendación IPS", Valor = total == 0 ? "0" : ((realizadasList.Count(x => x.Nps >= 9) * 100.0) / Math.Max(total, 1)).ToString("0.0"), Sufijo = "%", Trend = new TendenciaKpiDto { Direction = "up", Texto = "+0.5%" }, Nota = $"{anuladas} anuladas" },
            new() { Label = "Oportunidad Promedio", Valor = total == 0 ? "0" : realizadasList.Average(x => (x.FechaFinalizacion ?? x.FechaInicio).Subtract(x.FechaInicio).TotalMinutes).ToString("0"), Sufijo = "min", Trend = new TendenciaKpiDto { Direction = "down", Texto = "-3min" }, Nota = "Derivado de fecha de inicio/finalización" },
            new() { Label = "Cobertura Encuestas", Valor = total == 0 ? "0" : (total * 100.0 / Math.Max(total + 10, 1)).ToString("0.0"), Sufijo = "%", Nota = $"{total} pac." }
        };

        var segmentos = new List<SegmentoBarraDto>
        {
            new() { Label = "Excelente", Value = 62, Color = "#16A34A" },
            new() { Label = "Buena", Value = 25, Color = "#84CC16" },
            new() { Label = "Regular", Value = 8, Color = "#F59E0B" },
            new() { Label = "Mala", Value = 3, Color = "#EF4444" },
            new() { Label = "Muy mala", Value = 2, Color = "#DC2626" }
        };

        return await Task.FromResult(new RespuestaIndicadoresExperienciaDto
        {
            Kpis = kpis,
            Segmentos = segmentos
        });
    }

    public async Task<List<SegmentoBarraDto>> ObtenerNivelSatisfaccionAsync(FiltrosIndicadoresExperienciaDto filtros, CancellationToken cancellationToken = default)
    {
        var realizadas = await _dbContext.CapturasEncuesta.AsNoTracking()
            .Where(x => x.Estado == EstadoEncuesta.Completada)
            .ToListAsync(cancellationToken);

        var total = realizadas.Count;
        var segmentos = new List<SegmentoBarraDto>
        {
            new() { Label = "Excelente", Value = total == 0 ? 0 : (int)Math.Round(realizadas.Count(x => x.Sat == 5) * 100.0 / total), Color = "#16A34A" },
            new() { Label = "Buena", Value = total == 0 ? 0 : (int)Math.Round(realizadas.Count(x => x.Sat == 4) * 100.0 / total), Color = "#84CC16" },
            new() { Label = "Regular", Value = total == 0 ? 0 : (int)Math.Round(realizadas.Count(x => x.Sat == 3) * 100.0 / total), Color = "#F59E0B" },
            new() { Label = "Mala", Value = total == 0 ? 0 : (int)Math.Round(realizadas.Count(x => x.Sat == 2) * 100.0 / total), Color = "#EF4444" },
            new() { Label = "Muy mala", Value = total == 0 ? 0 : (int)Math.Round(realizadas.Count(x => x.Sat == 1) * 100.0 / total), Color = "#DC2626" }
        };

        return segmentos;
    }

    public async Task<RespuestaAnalisisBrechasDto> ObtenerAnalisisBrechasAsync(FiltrosAnalisisBrechasDto filtros, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.CapturasEncuesta.AsNoTracking().Where(x => x.Estado == EstadoEncuesta.Completada);

        if (filtros.Desde.HasValue)
        {
            query = query.Where(x => (x.FechaFinalizacion ?? x.FechaInicio) >= filtros.Desde.Value);
        }

        if (filtros.Hasta.HasValue)
        {
            query = query.Where(x => (x.FechaFinalizacion ?? x.FechaInicio) <= filtros.Hasta.Value);
        }

        if (!string.IsNullOrWhiteSpace(filtros.Estado) && Enum.TryParse<EstadoEncuesta>(filtros.Estado, true, out var estado))
        {
            query = query.Where(x => x.Estado == estado);
        }

        if (!string.IsNullOrWhiteSpace(filtros.Busqueda))
        {
            var busqueda = filtros.Busqueda.Trim();
            query = query.Where(x => EF.Functions.Like(x.NombreCompleto, $"%{busqueda}%") || EF.Functions.Like(x.NumeroDocumento, $"%{busqueda}%"));
        }

        var total = await query.CountAsync(cancellationToken);
        var totalPages = filtros.PageSize <= 0 ? 0 : (int)Math.Ceiling(total / (double)filtros.PageSize);
        var items = await query
            .OrderByDescending(x => x.FechaFinalizacion ?? x.FechaInicio)
            .Skip(Math.Max(0, filtros.Page - 1) * filtros.PageSize)
            .Take(filtros.PageSize)
            .Select(x => new FilaBrechaDto
            {
                Id = x.Id.ToString(),
                Iniciales = ObtenerIniciales(x.NombreCompleto),
                Nombre = x.NombreCompleto,
                Documento = x.NumeroDocumento,
                Fecha = (x.FechaFinalizacion ?? x.FechaInicio).ToString("yyyy-MM-dd"),
                Servicio = x.Servicio,
                Convenio = "Convenio general",
                Contacto = x.RequiereSeguimiento ? "invalido" : "valido",
                GestionNombre = x.RequiereSeguimiento ? "Seguimiento" : null,
                Intentos = x.IntentosLlamada.Count,
                Motivo = x.RequiereSeguimiento ? "Pendiente de gestión" : "Sin brecha",
                MotivoTono = x.RequiereSeguimiento ? "warning" : "success",
                Estado = x.RequiereSeguimiento ? "en_gestion" : "pendiente"
            })
            .ToListAsync(cancellationToken);

        var kpis = new KpisBrechasDto
        {
            TotalBrechas = total,
            EnGestion = items.Count(x => string.Equals(x.Estado, "en_gestion", StringComparison.OrdinalIgnoreCase)),
            Pendientes = items.Count(x => string.Equals(x.Estado, "pendiente", StringComparison.OrdinalIgnoreCase)),
            Justificadas = items.Count(x => string.Equals(x.Estado, "justificado", StringComparison.OrdinalIgnoreCase)),
            ContactoInvalido = items.Count(x => string.Equals(x.Contacto, "invalido", StringComparison.OrdinalIgnoreCase))
        };

        return await Task.FromResult(new RespuestaAnalisisBrechasDto
        {
            Data = items,
            Meta = new MetaPaginacionDto
            {
                Total = total,
                Page = filtros.Page,
                PageSize = filtros.PageSize,
                TotalPages = totalPages
            },
            Kpis = kpis
        });
    }

    public Task<RespuestaParametrosEncuestaDto> ObtenerReglasEncuestasAsync(CancellationToken cancellationToken = default)
    {
        var reglas = _dbContext.ReglasCondicionalesEncuesta
            .AsNoTracking()
            .OrderBy(x => x.Id)
            .Select(x => new ReglaCondicionalEncuestaDto
            {
                Id = x.Id.ToString(),
                Descripcion = x.Descripcion,
                Estado = x.Estado,
                Modificado = x.ModificadoEn.HasValue ? x.ModificadoEn.Value.ToString("g") : x.CreadoEn.ToString("g")
            })
            .ToList();

        return Task.FromResult(new RespuestaParametrosEncuestaDto
        {
            Data = reglas
        });
    }

    public Task<ReglaCondicionalEncuestaDto> CrearReglaEncuestaAsync(NuevaReglaEncuestaDto request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Descripcion))
        {
            throw new ArgumentException("La descripción de la regla es obligatoria");
        }

        var entity = new ReglaCondicionalEncuesta
        {
            Descripcion = request.Descripcion.Trim(),
            Campo = request.Campo.Trim(),
            Operador = request.Operador.Trim(),
            Valor = request.Valor.Trim(),
            Accion = request.Accion.Trim(),
            Estado = "borrador",
            EsPredeterminada = false,
            CreadoPor = "sistema"
        };

        _dbContext.ReglasCondicionalesEncuesta.Add(entity);
        _dbContext.SaveChanges();

        return Task.FromResult(new ReglaCondicionalEncuestaDto
        {
            Id = entity.Id.ToString(),
            Descripcion = entity.Descripcion,
            Estado = entity.Estado,
            Modificado = entity.CreadoEn.ToString("g")
        });
    }

    public Task<ReglaCondicionalEncuestaDto> CambiarEstadoReglaEncuestaAsync(string id, CambiarEstadoReglaEncuestaDto request, CancellationToken cancellationToken = default)
    {
        if (!Guid.TryParse(id, out var reglaId))
        {
            throw new ArgumentException("El identificador de la regla no es válido");
        }

        var entity = _dbContext.ReglasCondicionalesEncuesta.FirstOrDefault(x => x.Id == reglaId);
        if (entity == null)
        {
            throw new KeyNotFoundException($"No se encontró la regla {id}");
        }

        entity.Estado = string.IsNullOrWhiteSpace(request.Estado) ? entity.Estado : request.Estado.Trim();
        entity.ModificadoEn = DateTime.UtcNow;
        entity.ModificadoPor = "sistema";
        _dbContext.SaveChanges();

        return Task.FromResult(new ReglaCondicionalEncuestaDto
        {
            Id = entity.Id.ToString(),
            Descripcion = entity.Descripcion,
            Estado = entity.Estado,
            Modificado = entity.ModificadoEn?.ToString("g") ?? entity.CreadoEn.ToString("g")
        });
    }

    public Task<EstadoModoPruebaEncuestaDto> ObtenerModoPruebaEncuestaAsync(CancellationToken cancellationToken = default)
    {
        var config = ObtenerConfiguracionModoPrueba();
        return Task.FromResult(new EstadoModoPruebaEncuestaDto
        {
            Activo = bool.TryParse(config.Valor, out var activo) && activo
        });
    }

    public Task<EstadoModoPruebaEncuestaDto> ActualizarModoPruebaEncuestaAsync(EstadoModoPruebaEncuestaDto request, CancellationToken cancellationToken = default)
    {
        var config = ObtenerConfiguracionModoPrueba();
        config.Valor = request.Activo.ToString();
        config.Activo = true;
        config.ModificadoEn = DateTime.UtcNow;
        config.ModificadoPor = "sistema";
        _dbContext.SaveChanges();

        return Task.FromResult(new EstadoModoPruebaEncuestaDto
        {
            Activo = request.Activo
        });
    }

    public async Task<DetalleEncuestaRealizadaDto> AnularEncuestaRealizadaAsync(string id, AnularEncuestaRequestDto request, string usuario, CancellationToken cancellationToken = default)
    {
        if (!Guid.TryParse(id, out var capturaId))
        {
            throw new ArgumentException("El identificador de encuesta realizada no es válido");
        }

        if (!request.Confirmada)
        {
            throw new InvalidOperationException("La anulación requiere confirmación");
        }

        var captura = await _dbContext.CapturasEncuesta
            .Include(x => x.Respuestas)
            .FirstOrDefaultAsync(x => x.Id == capturaId, cancellationToken);

        if (captura == null)
        {
            throw new KeyNotFoundException($"No se encontró la encuesta realizada {id}");
        }

        captura.Estado = EstadoEncuesta.Rechazada;
        captura.MotivoAnulacion = request.Motivo;
        captura.FechaAnulacion = DateTime.UtcNow;
        captura.UsuarioAnulacion = usuario;
        captura.FechaUltimaActualizacion = DateTime.UtcNow;
        captura.ModificadoEn = DateTime.UtcNow;
        captura.ModificadoPor = usuario;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new DetalleEncuestaRealizadaDto
        {
            Id = captura.Id.ToString(),
            Consecutivo = captura.Consecutivo,
            NumeroDocumento = captura.NumeroDocumento,
            TipoDocumento = captura.TipoDocumento,
            NombreCompleto = captura.NombreCompleto,
            Servicio = captura.Servicio,
            Canal = captura.Canal.ToString(),
            Estado = captura.Estado.ToString(),
            FechaRealizacion = captura.FechaFinalizacion ?? captura.FechaInicio,
            Sat = captura.Sat,
            Nps = captura.Nps,
            RequiereSeguimiento = captura.RequiereSeguimiento,
            Respuestas = captura.Respuestas.Select(r => new RespuestaEncuestaDetalleDto
            {
                Seccion = string.Empty,
                Pregunta = r.PreguntaCuestionarioId.ToString(),
                Valor = r.ValorTexto ?? r.ValorMultiple
            }).ToList(),
            MotivoAnulacion = captura.MotivoAnulacion,
            FechaAnulacion = captura.FechaAnulacion,
            UsuarioAnulacion = captura.UsuarioAnulacion
        };
    }

    public async Task<FilaCapturaTelefonicaDto?> RegistrarIntentoLlamadaAsync(string id, IntentoLlamadaRequestDto request, CancellationToken cancellationToken = default)
    {
        if (!Guid.TryParse(id, out var capturaId))
        {
            return null;
        }

        var captura = _dbContext.CapturasEncuesta
            .Include(x => x.IntentosLlamada)
            .FirstOrDefault(x => x.Id == capturaId);

        if (captura == null)
        {
            return null;
        }

        captura.IntentosLlamada.Add(new IntentoLlamadaEncuesta
        {
            Id = Guid.NewGuid(),
            CapturaEncuestaId = captura.Id,
            Resultado = request.Resultado,
            Observaciones = request.Observaciones,
            FechaIntento = request.FechaIntento,
            UsuarioRegistro = "sistema",
            CreadoPor = "sistema"
        });

        captura.Estado = request.Resultado.Contains("rech", StringComparison.OrdinalIgnoreCase)
            ? EstadoEncuesta.Rechazada
            : request.Resultado.Contains("sin", StringComparison.OrdinalIgnoreCase)
                ? EstadoEncuesta.NoDisponible
                : EstadoEncuesta.EnProceso;

        _dbContext.SaveChanges();

        return new FilaCapturaTelefonicaDto
        {
            Id = captura.Id.ToString(),
            NumeroDocumento = captura.NumeroDocumento,
            TipoDocumento = captura.TipoDocumento,
            NombreCompleto = captura.NombreCompleto,
            Telefono = captura.Telefono,
            EstadoEncuesta = captura.Estado.ToString(),
            Servicio = captura.Servicio,
            TipoHospitalizacion = captura.Servicio,
            FechaCita = captura.FechaInicio,
            IntentosLlamada = captura.IntentosLlamada.Count
        };
    }

    public async Task<RespuestaCapturaTelefonicaInicioDto> IniciarEncuestaTelefonicaAsync(string id, CancellationToken cancellationToken = default)
    {
        if (!Guid.TryParse(id, out var capturaId))
        {
            return new RespuestaCapturaTelefonicaInicioDto { Redirect = $"/encuestas/captura-encuesta?origen=telefonica&id={id}" };
        }

        var captura = _dbContext.CapturasEncuesta.FirstOrDefault(x => x.Id == capturaId);
        if (captura != null)
        {
            captura.Estado = EstadoEncuesta.EnProceso;
            captura.ModificadoEn = DateTime.UtcNow;
            captura.ModificadoPor = "sistema";
            _dbContext.SaveChanges();
        }

        return new RespuestaCapturaTelefonicaInicioDto
        {
            Redirect = $"/encuestas/captura-encuesta?origen=telefonica&id={id}"
        };
    }

    private static SeccionEncuestaDto MapSeccion(Bital.Application.DTOs.Encuestas.SeccionCuestionarioDto source)
    {
        return new SeccionEncuestaDto
        {
            Id = source.Id,
            Nombre = source.Nombre,
            Orden = source.Orden,
            Preguntas = source.Preguntas.Select(MapPregunta).ToList()
        };
    }

    private static PreguntaEncuestaDto MapPregunta(Bital.Application.DTOs.Encuestas.PreguntaCuestionarioDto source)
    {
        return new PreguntaEncuestaDto
        {
            Id = source.Id,
            Texto = source.Texto,
            Tipo = source.Tipo,
            EsRequerida = source.EsRequerida,
            Orden = source.Orden,
            Activa = source.Activa,
            Opciones = source.Opciones.ToList(),
            Respuesta = null
        };
    }

    private static List<SeccionEncuestaDto> CloneSecciones(IEnumerable<SeccionEncuestaDto> secciones)
    {
        return secciones.Select(s => new SeccionEncuestaDto
        {
            Id = s.Id,
            Nombre = s.Nombre,
            Orden = s.Orden,
            Preguntas = s.Preguntas.Select(p => new PreguntaEncuestaDto
            {
                Id = p.Id,
                Texto = p.Texto,
                Tipo = p.Tipo,
                EsRequerida = p.EsRequerida,
                Orden = p.Orden,
                Activa = p.Activa,
                Opciones = p.Opciones.ToList(),
                Respuesta = p.Respuesta
            }).ToList()
        }).ToList();
    }

    private async Task<(string NumeroDocumento, string TipoDocumento, string NombreCompleto, string Servicio, string? Pabellon, string? Telefono, int? NumeroAtencion, string? Usuario)> ObtenerContextoPacienteAsync(string pacienteId, CancellationToken cancellationToken)
    {
        var documento = pacienteId.Trim();
        var tipoDocumento = "CC";

        var paciente = await _pacientesQueryService.GetPacientePorDocumentoAsync(documento, tipoDocumento, cancellationToken)
            ?? await _pacientesQueryService.GetPacientePorIdAsync(documento, cancellationToken);

        if (paciente == null)
        {
            var atenciones = (await _atencionesQueryService.GetAtencionesPorPacienteAsync(documento, tipoDocumento, cancellationToken)).ToList();
            var atencionFallback = atenciones.FirstOrDefault();

            return (
                documento,
                tipoDocumento,
                $"Paciente {documento}",
                atencionFallback?.TipoHospitalizacion ?? "N/A",
                null,
                null,
                atencionFallback?.Consecutivo,
                null);
        }

        var atencionesPaciente = (await _atencionesQueryService.GetAtencionesPorPacienteAsync(paciente.Cedula, paciente.TipoDocumento, cancellationToken)).ToList();
        var atencionActiva = atencionesPaciente.FirstOrDefault(x => x.EstaActivo) ?? atencionesPaciente.FirstOrDefault();

        return (
            paciente.Cedula,
            paciente.TipoDocumento,
            paciente.NombreCompleto,
            atencionActiva?.TipoHospitalizacion ?? "N/A",
            null,
            paciente.Telefono,
            atencionActiva?.Consecutivo,
            null);
    }

    private static string GenerarConsecutivo(Guid cuestionarioId, string pacienteId)
    {
        return $"CAP-{DateTime.UtcNow:yyyyMMdd}-{Math.Abs(HashCode.Combine(cuestionarioId, pacienteId)) % 100000:D5}";
    }

    private static string ObtenerIniciales(string nombreCompleto)
    {
        var partes = nombreCompleto.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        return string.Concat(partes.Take(2).Select(p => p[0])).ToUpperInvariant();
    }

    private ConfiguracionEncuesta ObtenerConfiguracionModoPrueba()
    {
        const string clave = "modo_prueba_encuestas";

        var config = _dbContext.ConfiguracionesEncuesta.FirstOrDefault(x => x.Clave == clave);
        if (config != null)
        {
            return config;
        }

        config = new ConfiguracionEncuesta
        {
            Clave = clave,
            Valor = bool.FalseString,
            Descripcion = "Bandera global de modo prueba para encuestas",
            Activo = true,
            CreadoPor = "sistema"
        };

        _dbContext.ConfiguracionesEncuesta.Add(config);
        _dbContext.SaveChanges();
        return config;
    }

}
