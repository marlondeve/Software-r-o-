/*
  RioSoft 1.2.7 — columna SalidaClinicaSostenida en dietas.FilasDietas.

  Requerida por la API desplegada en 1.2.7. Sin esta columna, GET /dietas-cocina/censo
  responde 500 (Invalid column name 'SalidaClinicaSostenida').

  Idempotente. Ejecutar en BitalNegocio antes o después de publicar la API 1.2.7.

  Verificar:
    SELECT COL_LENGTH('dietas.FilasDietas', 'SalidaClinicaSostenida');
    -- debe devolver 1 (bit), no NULL
*/
SET NOCOUNT ON;
GO

IF COL_LENGTH('dietas.FilasDietas', 'SalidaClinicaSostenida') IS NULL
BEGIN
    ALTER TABLE dietas.FilasDietas
        ADD SalidaClinicaSostenida bit NOT NULL
            CONSTRAINT DF_FilasDietas_SalidaClinicaSostenida DEFAULT (0);
    PRINT 'Columna dietas.FilasDietas.SalidaClinicaSostenida creada.';
END
ELSE
    PRINT 'Columna dietas.FilasDietas.SalidaClinicaSostenida ya existía.';
GO

-- Registrar migración EF si la tabla __EFMigrationsHistory existe (opcional, coherencia con dotnet ef)
IF OBJECT_ID(N'dbo.__EFMigrationsHistory', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM dbo.__EFMigrationsHistory
       WHERE MigrationId = N'20260826213827_AddSalidaClinicaSostenida'
   )
BEGIN
    INSERT INTO dbo.__EFMigrationsHistory (MigrationId, ProductVersion)
    VALUES (N'20260826213827_AddSalidaClinicaSostenida', N'8.0.0');
    PRINT 'Migración EF 20260826213827_AddSalidaClinicaSostenida registrada.';
END
GO
