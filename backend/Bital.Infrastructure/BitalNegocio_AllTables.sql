-- BITAL Negocio — script consolidado de tablas (referencia historica).
-- El esquema vigente se genera con migraciones EF Core.
-- Incluye bital.RolesModulo y RolModuloId (migracion AddRolesModuloDinamicos).
-- Preferir: dotnet ef database update --context BitalNegocioDbContext

IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
GO

IF SCHEMA_ID(N'dietas') IS NULL EXEC(N'CREATE SCHEMA [dietas];');
GO

CREATE TABLE [dietas].[DietasCatalogo] (
    [Id] uniqueidentifier NOT NULL,
    [Codigo] nvarchar(20) NOT NULL,
    [Nombre] nvarchar(200) NOT NULL,
    [Descripcion] nvarchar(1000) NOT NULL,
    [FechaInicio] datetime2 NOT NULL,
    [FechaFin] datetime2 NULL,
    [Usuario] nvarchar(100) NOT NULL,
    [Activa] bit NOT NULL,
    [CreadoEn] datetime2 NOT NULL,
    [CreadoPor] nvarchar(100) NOT NULL,
    [ModificadoEn] datetime2 NULL,
    [ModificadoPor] nvarchar(100) NULL,
    CONSTRAINT [PK_DietasCatalogo] PRIMARY KEY ([Id])
);
GO

CREATE TABLE [dietas].[OrdenesCocina] (
    [Id] uniqueidentifier NOT NULL,
    [NumeroOrden] int NOT NULL,
    [Comida] int NOT NULL,
    [FechaOperativa] datetime2 NOT NULL,
    [TotalDietas] int NOT NULL,
    [GeneradoPor] nvarchar(100) NOT NULL,
    [GeneradoEn] datetime2 NOT NULL,
    [Estado] nvarchar(50) NOT NULL,
    [Observaciones] nvarchar(1000) NULL,
    [CreadoEn] datetime2 NOT NULL,
    [CreadoPor] nvarchar(100) NOT NULL,
    [ModificadoEn] datetime2 NULL,
    [ModificadoPor] nvarchar(100) NULL,
    CONSTRAINT [PK_OrdenesCocina] PRIMARY KEY ([Id])
);
GO

CREATE TABLE [dietas].[TarifasHistorico] (
    [Id] uniqueidentifier NOT NULL,
    [DietaCatalogoId] uniqueidentifier NOT NULL,
    [Anio] int NOT NULL,
    [Monto] decimal(18,2) NOT NULL,
    [VigenciaDesde] datetime2 NOT NULL,
    [VigenciaHasta] datetime2 NOT NULL,
    [Activa] bit NOT NULL,
    [Observaciones] nvarchar(500) NULL,
    [CreadoEn] datetime2 NOT NULL,
    [CreadoPor] nvarchar(100) NOT NULL,
    [ModificadoEn] datetime2 NULL,
    [ModificadoPor] nvarchar(100) NULL,
    CONSTRAINT [PK_TarifasHistorico] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_TarifasHistorico_DietasCatalogo_DietaCatalogoId] FOREIGN KEY ([DietaCatalogoId]) REFERENCES [dietas].[DietasCatalogo] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [dietas].[FilasDietas] (
    [Id] uniqueidentifier NOT NULL,
    [PacienteId] nvarchar(50) NOT NULL,
    [IdIngreso] int NULL,
    [Cedula] nvarchar(20) NULL,
    [TipoDocumento] nvarchar(10) NULL,
    [Paciente] nvarchar(200) NOT NULL,
    [Edad] int NOT NULL,
    [Servicio] nvarchar(100) NOT NULL,
    [Pabellon] nvarchar(50) NOT NULL,
    [Habitacion] nvarchar(50) NOT NULL,
    [Comida] int NOT NULL,
    [Consistencia] nvarchar(50) NULL,
    [TipoDietaId] uniqueidentifier NULL,
    [DescripcionDieta] nvarchar(500) NULL,
    [Aislado] bit NOT NULL,
    [Aislamiento] nvarchar(100) NOT NULL,
    [ObservacionAislamiento] nvarchar(500) NULL,
    [Alergico] bit NOT NULL,
    [Alergias] nvarchar(500) NOT NULL,
    [Observaciones] nvarchar(1000) NULL,
    [SolicitadoPor] nvarchar(100) NULL,
    [SolicitadoEn] datetime2 NULL,
    [Estado] int NOT NULL,
    [CancelacionTardia] bit NOT NULL,
    [OrdenCocinaId] uniqueidentifier NULL,
    [FechaOperativa] datetime2 NOT NULL,
    [CreadoEn] datetime2 NOT NULL,
    [CreadoPor] nvarchar(100) NOT NULL,
    [ModificadoEn] datetime2 NULL,
    [ModificadoPor] nvarchar(100) NULL,
    CONSTRAINT [PK_FilasDietas] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_FilasDietas_DietasCatalogo_TipoDietaId] FOREIGN KEY ([TipoDietaId]) REFERENCES [dietas].[DietasCatalogo] ([Id]) ON DELETE SET NULL,
    CONSTRAINT [FK_FilasDietas_OrdenesCocina_OrdenCocinaId] FOREIGN KEY ([OrdenCocinaId]) REFERENCES [dietas].[OrdenesCocina] ([Id]) ON DELETE SET NULL
);
GO

CREATE TABLE [dietas].[EventosTrazabilidad] (
    [Id] uniqueidentifier NOT NULL,
    [FilaDietaId] uniqueidentifier NOT NULL,
    [EstadoNuevo] int NOT NULL,
    [EstadoAnterior] int NULL,
    [TipoEvento] nvarchar(50) NOT NULL,
    [Descripcion] nvarchar(1000) NOT NULL,
    [Usuario] nvarchar(100) NOT NULL,
    [FechaEvento] datetime2 NOT NULL,
    [DatosAdicionales] nvarchar(max) NULL,
    [CreadoEn] datetime2 NOT NULL,
    [CreadoPor] nvarchar(100) NOT NULL,
    [ModificadoEn] datetime2 NULL,
    [ModificadoPor] nvarchar(100) NULL,
    CONSTRAINT [PK_EventosTrazabilidad] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_EventosTrazabilidad_FilasDietas_FilaDietaId] FOREIGN KEY ([FilaDietaId]) REFERENCES [dietas].[FilasDietas] ([Id]) ON DELETE CASCADE
);
GO

CREATE INDEX [IX_DietaCatalogo_Activa] ON [dietas].[DietasCatalogo] ([Activa]);
GO

CREATE UNIQUE INDEX [IX_DietaCatalogo_Codigo] ON [dietas].[DietasCatalogo] ([Codigo]);
GO

CREATE INDEX [IX_DietaCatalogo_Vigencia] ON [dietas].[DietasCatalogo] ([FechaInicio], [FechaFin]);
GO

CREATE INDEX [IX_EventoTrazabilidad_FechaTipo] ON [dietas].[EventosTrazabilidad] ([FechaEvento], [TipoEvento]);
GO

CREATE INDEX [IX_EventoTrazabilidad_FilaDietaId] ON [dietas].[EventosTrazabilidad] ([FilaDietaId]);
GO

CREATE INDEX [IX_FilaDieta_FechaComidaEstado] ON [dietas].[FilasDietas] ([FechaOperativa], [Comida], [Estado]);
GO

CREATE INDEX [IX_FilaDieta_IdIngreso] ON [dietas].[FilasDietas] ([IdIngreso]);
GO

CREATE INDEX [IX_FilaDieta_OrdenCocinaId] ON [dietas].[FilasDietas] ([OrdenCocinaId]);
GO

CREATE INDEX [IX_FilaDieta_PacienteId] ON [dietas].[FilasDietas] ([PacienteId]);
GO

CREATE INDEX [IX_FilasDietas_TipoDietaId] ON [dietas].[FilasDietas] ([TipoDietaId]);
GO

CREATE INDEX [IX_OrdenCocina_Estado] ON [dietas].[OrdenesCocina] ([Estado]);
GO

CREATE INDEX [IX_OrdenCocina_FechaComida] ON [dietas].[OrdenesCocina] ([FechaOperativa], [Comida]);
GO

CREATE UNIQUE INDEX [IX_OrdenCocina_Numero] ON [dietas].[OrdenesCocina] ([NumeroOrden]);
GO

CREATE INDEX [IX_TarifaHistorico_DietaAnioActiva] ON [dietas].[TarifasHistorico] ([DietaCatalogoId], [Anio], [Activa]);
GO

CREATE INDEX [IX_TarifaHistorico_Vigencia] ON [dietas].[TarifasHistorico] ([VigenciaDesde], [VigenciaHasta]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260725183433_InitialCreate', N'8.0.13');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF SCHEMA_ID(N'bital') IS NULL EXEC(N'CREATE SCHEMA [bital];');
GO

CREATE TABLE [bital].[EtiquetasEnfermeria] (
    [Id] uniqueidentifier NOT NULL,
    [Codigo] nvarchar(max) NOT NULL,
    [OrdenCocinaId] uniqueidentifier NOT NULL,
    [FilaDietaId] uniqueidentifier NOT NULL,
    [EstadoLogistica] nvarchar(max) NOT NULL,
    [Comida] int NOT NULL,
    [FechaOperativa] datetime2 NOT NULL,
    [GeneradaPor] nvarchar(max) NOT NULL,
    [GeneradaEn] datetime2 NOT NULL,
    [ImpresaEn] datetime2 NULL,
    [RecibidoPor] nvarchar(max) NULL,
    [PreEntregadaEn] datetime2 NULL,
    [EntregadoPor] nvarchar(max) NULL,
    [EntregadaEn] datetime2 NULL,
    [MotivoDevolucion] nvarchar(max) NULL,
    [EstadoDietaDevolucion] nvarchar(max) NULL,
    [ObservacionesDevolucion] nvarchar(max) NULL,
    [FotoDevolucionUrl] nvarchar(max) NULL,
    [DevueltaEn] datetime2 NULL,
    [Observaciones] nvarchar(max) NULL,
    CONSTRAINT [PK_EtiquetasEnfermeria] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_EtiquetasEnfermeria_FilasDietas_FilaDietaId] FOREIGN KEY ([FilaDietaId]) REFERENCES [dietas].[FilasDietas] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_EtiquetasEnfermeria_OrdenesCocina_OrdenCocinaId] FOREIGN KEY ([OrdenCocinaId]) REFERENCES [dietas].[OrdenesCocina] ([Id]) ON DELETE CASCADE
);
GO

CREATE INDEX [IX_EtiquetasEnfermeria_FilaDietaId] ON [bital].[EtiquetasEnfermeria] ([FilaDietaId]);
GO

CREATE INDEX [IX_EtiquetasEnfermeria_OrdenCocinaId] ON [bital].[EtiquetasEnfermeria] ([OrdenCocinaId]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260725222209_AgregarEtiquetasEnfermeria', N'8.0.13');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

CREATE TABLE [bital].[FilasConciliacion] (
    [Id] uniqueidentifier NOT NULL,
    [NumeroFactura] nvarchar(max) NOT NULL,
    [Proveedor] nvarchar(max) NOT NULL,
    [Periodo] nvarchar(max) NOT NULL,
    [FechaOperativa] datetime2 NOT NULL,
    [Comida] nvarchar(max) NOT NULL,
    [PacienteId] nvarchar(max) NOT NULL,
    [Paciente] nvarchar(max) NOT NULL,
    [Cedula] nvarchar(max) NOT NULL,
    [Pabellon] nvarchar(max) NOT NULL,
    [Habitacion] nvarchar(max) NOT NULL,
    [TipoDieta] nvarchar(max) NOT NULL,
    [Consistencia] nvarchar(max) NOT NULL,
    [CantidadSolicitada] int NOT NULL,
    [CantidadEntregada] int NOT NULL,
    [CantidadFacturada] int NOT NULL,
    [Diferencia] int NOT NULL,
    [ValorUnitario] decimal(18,2) NOT NULL,
    [ValorTotal] decimal(18,2) NOT NULL,
    [Estado] nvarchar(max) NOT NULL,
    [Motivo] nvarchar(max) NULL,
    [Observaciones] nvarchar(max) NULL,
    [ResueltoPor] nvarchar(max) NULL,
    [ResueltaEn] datetime2 NULL,
    [FilaDietaId] uniqueidentifier NULL,
    [EtiquetaId] uniqueidentifier NULL,
    [CreadoEn] datetime2 NOT NULL,
    [CreadoPor] nvarchar(max) NOT NULL,
    [ModificadoEn] datetime2 NULL,
    [ModificadoPor] nvarchar(max) NULL,
    CONSTRAINT [PK_FilasConciliacion] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_FilasConciliacion_EtiquetasEnfermeria_EtiquetaId] FOREIGN KEY ([EtiquetaId]) REFERENCES [bital].[EtiquetasEnfermeria] ([Id]),
    CONSTRAINT [FK_FilasConciliacion_FilasDietas_FilaDietaId] FOREIGN KEY ([FilaDietaId]) REFERENCES [dietas].[FilasDietas] ([Id])
);
GO

CREATE INDEX [IX_FilasConciliacion_EtiquetaId] ON [bital].[FilasConciliacion] ([EtiquetaId]);
GO

CREATE INDEX [IX_FilasConciliacion_FilaDietaId] ON [bital].[FilasConciliacion] ([FilaDietaId]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260725225757_AgregarConciliacion', N'8.0.13');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

CREATE TABLE [bital].[CategoriasEdad] (
    [Id] uniqueidentifier NOT NULL,
    [Nombre] nvarchar(max) NOT NULL,
    [EdadMinima] int NOT NULL,
    [EdadMaxima] int NOT NULL,
    [FactorPorcion] decimal(18,2) NOT NULL,
    [Descripcion] nvarchar(max) NULL,
    [Activa] bit NOT NULL,
    [Orden] int NOT NULL,
    [ModificadoPor] nvarchar(max) NOT NULL,
    [ModificadoEn] datetime2 NOT NULL,
    [CreadoEn] datetime2 NOT NULL,
    [CreadoPor] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_CategoriasEdad] PRIMARY KEY ([Id])
);
GO

CREATE TABLE [bital].[TiemposComida] (
    [Id] uniqueidentifier NOT NULL,
    [Comida] int NOT NULL,
    [HoraPreparacion] time NOT NULL,
    [HoraCierre] time NOT NULL,
    [HoraEntrega] time NOT NULL,
    [Activo] bit NOT NULL,
    [MinutosAlertaCierre] int NOT NULL,
    [Observaciones] nvarchar(max) NULL,
    [ModificadoPor] nvarchar(max) NOT NULL,
    [ModificadoEn] datetime2 NOT NULL,
    [CreadoEn] datetime2 NOT NULL,
    [CreadoPor] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_TiemposComida] PRIMARY KEY ([Id])
);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260725235453_AddParametrosOperativos', N'8.0.13');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

CREATE TABLE [bital].[EventosAuditoria] (
    [Id] uniqueidentifier NOT NULL,
    [Modulo] nvarchar(max) NOT NULL,
    [Accion] nvarchar(max) NOT NULL,
    [Resultado] nvarchar(max) NOT NULL,
    [Usuario] nvarchar(max) NOT NULL,
    [DireccionIp] nvarchar(max) NULL,
    [TipoEntidad] nvarchar(max) NULL,
    [EntidadId] uniqueidentifier NULL,
    [DatosAntes] nvarchar(max) NULL,
    [DatosDespues] nvarchar(max) NULL,
    [Metadata] nvarchar(max) NULL,
    [MensajeError] nvarchar(max) NULL,
    [DuracionMs] int NULL,
    [CreadoEn] datetime2 NOT NULL,
    [CreadoPor] nvarchar(max) NOT NULL,
    [ModificadoEn] datetime2 NULL,
    [ModificadoPor] nvarchar(max) NULL,
    CONSTRAINT [PK_EventosAuditoria] PRIMARY KEY ([Id])
);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260726002533_AddAuditoria', N'8.0.13');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

CREATE TABLE [bital].[PermisosRol] (
    [Id] uniqueidentifier NOT NULL,
    [Rol] int NOT NULL,
    [Ruta] int NOT NULL,
    [Permitido] bit NOT NULL,
    [CreadoEn] datetime2 NOT NULL,
    [CreadoPor] nvarchar(max) NOT NULL,
    [ModificadoEn] datetime2 NULL,
    [ModificadoPor] nvarchar(max) NULL,
    CONSTRAINT [PK_PermisosRol] PRIMARY KEY ([Id])
);
GO

CREATE TABLE [bital].[UsuariosModulo] (
    [Id] uniqueidentifier NOT NULL,
    [NombreCompleto] nvarchar(max) NOT NULL,
    [Email] nvarchar(max) NOT NULL,
    [Identificacion] nvarchar(max) NULL,
    [Rol] int NOT NULL,
    [Activo] bit NOT NULL,
    [Observaciones] nvarchar(max) NULL,
    [UltimoAcceso] datetime2 NULL,
    [CreadoEn] datetime2 NOT NULL,
    [CreadoPor] nvarchar(max) NOT NULL,
    [ModificadoEn] datetime2 NULL,
    [ModificadoPor] nvarchar(max) NULL,
    CONSTRAINT [PK_UsuariosModulo] PRIMARY KEY ([Id])
);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260726005013_AddUsuariosPermisos', N'8.0.13');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

CREATE TABLE [bital].[IdentificacionesPacientes] (
    [Id] uniqueidentifier NOT NULL,
    [NumeroDocumento] nvarchar(max) NOT NULL,
    [TipoDocumento] nvarchar(max) NOT NULL,
    [Canal] int NOT NULL,
    [NombresPaciente] nvarchar(max) NULL,
    [ApellidosPaciente] nvarchar(max) NULL,
    [ServicioAtencion] nvarchar(max) NULL,
    [NumeroAtencion] int NULL,
    [FechaIdentificacion] datetime2 NOT NULL,
    [UsuarioIdentificador] nvarchar(max) NULL,
    [CreadoEn] datetime2 NOT NULL,
    [CreadoPor] nvarchar(max) NOT NULL,
    [ModificadoEn] datetime2 NULL,
    [ModificadoPor] nvarchar(max) NULL,
    CONSTRAINT [PK_IdentificacionesPacientes] PRIMARY KEY ([Id])
);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260726010348_AddPacientesEncuestas', N'8.0.13');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

DECLARE @var0 sysname;
SELECT @var0 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[bital].[SeccionesCuestionario]') AND [c].[name] = N'ModificadoPor');
IF @var0 IS NOT NULL EXEC(N'ALTER TABLE [bital].[SeccionesCuestionario] DROP CONSTRAINT [' + @var0 + '];');
ALTER TABLE [bital].[SeccionesCuestionario] ALTER COLUMN [ModificadoPor] nvarchar(max) NULL;
GO

DECLARE @var1 sysname;
SELECT @var1 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[bital].[SeccionesCuestionario]') AND [c].[name] = N'CreadoPor');
IF @var1 IS NOT NULL EXEC(N'ALTER TABLE [bital].[SeccionesCuestionario] DROP CONSTRAINT [' + @var1 + '];');
ALTER TABLE [bital].[SeccionesCuestionario] ALTER COLUMN [CreadoPor] nvarchar(max) NOT NULL;
GO

ALTER TABLE [bital].[IdentificacionesPacientes] ADD [Estado] int NOT NULL DEFAULT 0;
GO

ALTER TABLE [bital].[IdentificacionesPacientes] ADD [Pabellon] nvarchar(max) NULL;
GO

ALTER TABLE [bital].[IdentificacionesPacientes] ADD [Telefono] nvarchar(max) NULL;
GO

CREATE TABLE [bital].[ConfiguracionesEncuesta] (
    [Id] uniqueidentifier NOT NULL,
    [Clave] nvarchar(100) NOT NULL,
    [Valor] nvarchar(500) NOT NULL,
    [Descripcion] nvarchar(1000) NULL,
    [Activo] bit NOT NULL,
    [CreadoEn] datetime2 NOT NULL,
    [CreadoPor] nvarchar(100) NOT NULL,
    [ModificadoEn] datetime2 NULL,
    [ModificadoPor] nvarchar(100) NULL,
    CONSTRAINT [PK_ConfiguracionesEncuesta] PRIMARY KEY ([Id])
);
GO

CREATE TABLE [bital].[ReglasCondicionalesEncuesta] (
    [Id] uniqueidentifier NOT NULL,
    [Descripcion] nvarchar(500) NOT NULL,
    [Campo] nvarchar(100) NOT NULL,
    [Operador] nvarchar(100) NOT NULL,
    [Valor] nvarchar(200) NOT NULL,
    [Accion] nvarchar(200) NOT NULL,
    [Estado] nvarchar(50) NOT NULL,
    [EsPredeterminada] bit NOT NULL,
    [CreadoEn] datetime2 NOT NULL,
    [CreadoPor] nvarchar(100) NOT NULL,
    [ModificadoEn] datetime2 NULL,
    [ModificadoPor] nvarchar(100) NULL,
    CONSTRAINT [PK_ReglasCondicionalesEncuesta] PRIMARY KEY ([Id])
);
GO

CREATE UNIQUE INDEX [IX_ConfiguracionEncuesta_Clave] ON [bital].[ConfiguracionesEncuesta] ([Clave]);
GO

CREATE INDEX [IX_ReglaCondicionalEncuesta_EstadoCampo] ON [bital].[ReglasCondicionalesEncuesta] ([Estado], [Campo]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260726085410_AddParametrosEncuestas', N'8.0.13');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

CREATE TABLE [bital].[CapturasEncuesta] (
    [Id] uniqueidentifier NOT NULL,
    [Consecutivo] nvarchar(50) NOT NULL,
    [CuestionarioEncuestaId] uniqueidentifier NOT NULL,
    [NumeroDocumento] nvarchar(50) NOT NULL,
    [TipoDocumento] nvarchar(20) NOT NULL,
    [NombreCompleto] nvarchar(250) NOT NULL,
    [Servicio] nvarchar(200) NOT NULL,
    [Pabellon] nvarchar(100) NULL,
    [Telefono] nvarchar(50) NULL,
    [NumeroAtencion] int NULL,
    [Canal] int NOT NULL,
    [Estado] int NOT NULL,
    [FechaInicio] datetime2 NOT NULL,
    [FechaUltimaActualizacion] datetime2 NULL,
    [FechaFinalizacion] datetime2 NULL,
    [UsuarioFinaliza] nvarchar(100) NULL,
    [MotivoAnulacion] nvarchar(500) NULL,
    [FechaAnulacion] datetime2 NULL,
    [UsuarioAnulacion] nvarchar(100) NULL,
    [Sat] int NULL,
    [Nps] int NULL,
    [RequiereSeguimiento] bit NOT NULL,
    [CreadoEn] datetime2 NOT NULL,
    [CreadoPor] nvarchar(100) NOT NULL,
    [ModificadoEn] datetime2 NULL,
    [ModificadoPor] nvarchar(100) NULL,
    CONSTRAINT [PK_CapturasEncuesta] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_CapturasEncuesta_Cuestionarios_CuestionarioEncuestaId] FOREIGN KEY ([CuestionarioEncuestaId]) REFERENCES [bital].[Cuestionarios] ([Id]) ON DELETE NO ACTION
);
GO

CREATE TABLE [bital].[IntentosLlamadaEncuesta] (
    [Id] uniqueidentifier NOT NULL,
    [CapturaEncuestaId] uniqueidentifier NOT NULL,
    [Resultado] nvarchar(100) NOT NULL,
    [Observaciones] nvarchar(1000) NULL,
    [FechaIntento] datetime2 NOT NULL,
    [UsuarioRegistro] nvarchar(100) NULL,
    [CreadoEn] datetime2 NOT NULL,
    [CreadoPor] nvarchar(100) NOT NULL,
    [ModificadoEn] datetime2 NULL,
    [ModificadoPor] nvarchar(100) NULL,
    CONSTRAINT [PK_IntentosLlamadaEncuesta] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_IntentosLlamadaEncuesta_CapturasEncuesta_CapturaEncuestaId] FOREIGN KEY ([CapturaEncuestaId]) REFERENCES [bital].[CapturasEncuesta] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [bital].[RespuestasCapturaEncuesta] (
    [Id] uniqueidentifier NOT NULL,
    [CapturaEncuestaId] uniqueidentifier NOT NULL,
    [PreguntaCuestionarioId] uniqueidentifier NOT NULL,
    [OpcionPreguntaCuestionarioId] uniqueidentifier NULL,
    [ValorTexto] nvarchar(1000) NULL,
    [ValorMultiple] nvarchar(1000) NULL,
    [FechaRespuesta] datetime2 NOT NULL,
    [CreadoEn] datetime2 NOT NULL,
    [CreadoPor] nvarchar(100) NOT NULL,
    [ModificadoEn] datetime2 NULL,
    [ModificadoPor] nvarchar(100) NULL,
    CONSTRAINT [PK_RespuestasCapturaEncuesta] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_RespuestasCapturaEncuesta_CapturasEncuesta_CapturaEncuestaId] FOREIGN KEY ([CapturaEncuestaId]) REFERENCES [bital].[CapturasEncuesta] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_RespuestasCapturaEncuesta_OpcionesPreguntaCuestionario_OpcionPreguntaCuestionarioId] FOREIGN KEY ([OpcionPreguntaCuestionarioId]) REFERENCES [bital].[OpcionesPreguntaCuestionario] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_RespuestasCapturaEncuesta_PreguntasCuestionario_PreguntaCuestionarioId] FOREIGN KEY ([PreguntaCuestionarioId]) REFERENCES [bital].[PreguntasCuestionario] ([Id]) ON DELETE NO ACTION
);
GO

CREATE UNIQUE INDEX [IX_CapturaEncuesta_Consecutivo] ON [bital].[CapturasEncuesta] ([Consecutivo]);
GO

CREATE INDEX [IX_CapturaEncuesta_DocumentoEstado] ON [bital].[CapturasEncuesta] ([NumeroDocumento], [Estado]);
GO

CREATE INDEX [IX_CapturasEncuesta_CuestionarioEncuestaId] ON [bital].[CapturasEncuesta] ([CuestionarioEncuestaId]);
GO

CREATE INDEX [IX_IntentoLlamadaEncuesta_CapturaFecha] ON [bital].[IntentosLlamadaEncuesta] ([CapturaEncuestaId], [FechaIntento]);
GO

CREATE UNIQUE INDEX [IX_RespuestaCapturaEncuesta_CapturaPregunta] ON [bital].[RespuestasCapturaEncuesta] ([CapturaEncuestaId], [PreguntaCuestionarioId]);
GO

CREATE INDEX [IX_RespuestasCapturaEncuesta_OpcionPreguntaCuestionarioId] ON [bital].[RespuestasCapturaEncuesta] ([OpcionPreguntaCuestionarioId]);
GO

CREATE INDEX [IX_RespuestasCapturaEncuesta_PreguntaCuestionarioId] ON [bital].[RespuestasCapturaEncuesta] ([PreguntaCuestionarioId]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260726091447_AddCapturaEncuestasReal', N'8.0.13');
GO

COMMIT;
GO

