/*
  Tablas de cuestionarios (migracion 20260726020000_AddCuestionarios no registrada en EF).
  Ejecutar antes de AddParametrosEncuestas en instalaciones limpias.
*/
SET NOCOUNT ON;

USE [$(DatabaseName)];
GO

IF SCHEMA_ID(N'bital') IS NULL EXEC(N'CREATE SCHEMA [bital]');

IF OBJECT_ID(N'[bital].[Cuestionarios]', 'U') IS NULL
BEGIN
    CREATE TABLE [bital].[Cuestionarios](
        [Id] UNIQUEIDENTIFIER NOT NULL,
        [Nombre] NVARCHAR(200) NOT NULL,
        [Descripcion] NVARCHAR(1000) NULL,
        [Canal] INT NOT NULL,
        [Estado] INT NOT NULL,
        [CreadoEn] DATETIME2 NOT NULL,
        [CreadoPor] NVARCHAR(100) NOT NULL,
        [ModificadoEn] DATETIME2 NULL,
        [ModificadoPor] NVARCHAR(100) NULL,
        CONSTRAINT [PK_Cuestionarios] PRIMARY KEY ([Id])
    );
    CREATE INDEX [IX_Cuestionario_CanalEstado] ON [bital].[Cuestionarios] ([Canal], [Estado]);
END;

IF OBJECT_ID(N'[bital].[SeccionesCuestionario]', 'U') IS NULL
BEGIN
    CREATE TABLE [bital].[SeccionesCuestionario](
        [Id] UNIQUEIDENTIFIER NOT NULL,
        [CuestionarioEncuestaId] UNIQUEIDENTIFIER NOT NULL,
        [Nombre] NVARCHAR(200) NOT NULL,
        [Orden] INT NOT NULL,
        [CreadoEn] DATETIME2 NOT NULL,
        [CreadoPor] NVARCHAR(100) NOT NULL,
        [ModificadoEn] DATETIME2 NULL,
        [ModificadoPor] NVARCHAR(100) NULL,
        CONSTRAINT [PK_SeccionesCuestionario] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_SeccionesCuestionario_Cuestionarios_CuestionarioEncuestaId] FOREIGN KEY ([CuestionarioEncuestaId]) REFERENCES [bital].[Cuestionarios]([Id]) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX [IX_SeccionCuestionario_CuestionarioOrden] ON [bital].[SeccionesCuestionario] ([CuestionarioEncuestaId], [Orden]);
END;

IF OBJECT_ID(N'[bital].[PreguntasCuestionario]', 'U') IS NULL
BEGIN
    CREATE TABLE [bital].[PreguntasCuestionario](
        [Id] UNIQUEIDENTIFIER NOT NULL,
        [SeccionCuestionarioId] UNIQUEIDENTIFIER NOT NULL,
        [Texto] NVARCHAR(500) NOT NULL,
        [Tipo] NVARCHAR(100) NOT NULL,
        [EsRequerida] BIT NOT NULL,
        [Orden] INT NOT NULL,
        [Activa] BIT NOT NULL,
        [CreadoEn] DATETIME2 NOT NULL,
        [CreadoPor] NVARCHAR(100) NOT NULL,
        [ModificadoEn] DATETIME2 NULL,
        [ModificadoPor] NVARCHAR(100) NULL,
        CONSTRAINT [PK_PreguntasCuestionario] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PreguntasCuestionario_SeccionesCuestionario_SeccionCuestionarioId] FOREIGN KEY ([SeccionCuestionarioId]) REFERENCES [bital].[SeccionesCuestionario]([Id]) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX [IX_PreguntaCuestionario_SeccionOrden] ON [bital].[PreguntasCuestionario] ([SeccionCuestionarioId], [Orden]);
END;

IF OBJECT_ID(N'[bital].[OpcionesPreguntaCuestionario]', 'U') IS NULL
BEGIN
    CREATE TABLE [bital].[OpcionesPreguntaCuestionario](
        [Id] UNIQUEIDENTIFIER NOT NULL,
        [PreguntaCuestionarioId] UNIQUEIDENTIFIER NOT NULL,
        [Texto] NVARCHAR(200) NOT NULL,
        [Valor] NVARCHAR(200) NULL,
        [Orden] INT NOT NULL,
        [CreadoEn] DATETIME2 NOT NULL,
        [CreadoPor] NVARCHAR(100) NOT NULL,
        [ModificadoEn] DATETIME2 NULL,
        [ModificadoPor] NVARCHAR(100) NULL,
        CONSTRAINT [PK_OpcionesPreguntaCuestionario] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_OpcionesPreguntaCuestionario_PreguntasCuestionario_PreguntaCuestionarioId] FOREIGN KEY ([PreguntaCuestionarioId]) REFERENCES [bital].[PreguntasCuestionario]([Id]) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX [IX_OpcionPreguntaCuestionario_PreguntaOrden] ON [bital].[OpcionesPreguntaCuestionario] ([PreguntaCuestionarioId], [Orden]);
END;

IF OBJECT_ID(N'[bital].[LogicasPreguntaCuestionario]', 'U') IS NULL
BEGIN
    CREATE TABLE [bital].[LogicasPreguntaCuestionario](
        [Id] UNIQUEIDENTIFIER NOT NULL,
        [PreguntaCuestionarioId] UNIQUEIDENTIFIER NOT NULL,
        [PreguntaOrigenId] UNIQUEIDENTIFIER NULL,
        [Operador] NVARCHAR(100) NULL,
        [Valor] NVARCHAR(500) NULL,
        [Accion] NVARCHAR(200) NULL,
        [CreadoEn] DATETIME2 NOT NULL,
        [CreadoPor] NVARCHAR(100) NOT NULL,
        [ModificadoEn] DATETIME2 NULL,
        [ModificadoPor] NVARCHAR(100) NULL,
        CONSTRAINT [PK_LogicasPreguntaCuestionario] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_LogicasPreguntaCuestionario_PreguntasCuestionario_PreguntaCuestionarioId] FOREIGN KEY ([PreguntaCuestionarioId]) REFERENCES [bital].[PreguntasCuestionario]([Id]) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX [IX_LogicaPreguntaCuestionario_Pregunta] ON [bital].[LogicasPreguntaCuestionario] ([PreguntaCuestionarioId]);
END;

PRINT 'Tablas de cuestionarios: OK';
GO
