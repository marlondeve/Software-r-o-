/*
================================================================================
  BITAL — Crear base de datos vacía (SQL Server 2019+)
  Variables sqlcmd:
    DatabaseName  — nombre de la BD (default: BitalNegocio)
    DropExisting  — 1 = eliminar BD si existe; 0 = solo crear si falta

  Ejemplo:
    sqlcmd -S localhost\SQLEXPRESS -E -f 65001 ^
      -v DatabaseName="BitalNegocio" DropExisting="1" ^
      -i backend\scripts\00-DropAndCreateDatabase.sql
================================================================================
*/

SET NOCOUNT ON;

DECLARE @Db sysname = N'$(DatabaseName)';
DECLARE @Drop bit = CASE WHEN N'$(DropExisting)' IN (N'1', N'true', N'TRUE', N'yes', N'YES') THEN 1 ELSE 0 END;

IF @Db IS NULL OR LTRIM(RTRIM(@Db)) = N''
    SET @Db = N'BitalNegocio';

DECLARE @Sql nvarchar(max);

IF @Drop = 1 AND DB_ID(@Db) IS NOT NULL
BEGIN
    PRINT N'Eliminando base de datos existente: ' + @Db;
    SET @Sql = N'
        ALTER DATABASE ' + QUOTENAME(@Db) + N' SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
        DROP DATABASE ' + QUOTENAME(@Db) + N';';
    EXEC sp_executesql @Sql;
END

IF DB_ID(@Db) IS NULL
BEGIN
    SET @Sql = N'CREATE DATABASE ' + QUOTENAME(@Db) + N';';
    EXEC sp_executesql @Sql;
    PRINT N'Base de datos creada: ' + @Db;
END
ELSE
    PRINT N'La base de datos ya existe (sin eliminar): ' + @Db;

SET @Sql = N'
USE ' + QUOTENAME(@Db) + N';

IF SCHEMA_ID(N''dietas'') IS NULL EXEC(N''CREATE SCHEMA [dietas]'');
IF SCHEMA_ID(N''bital'') IS NULL EXEC(N''CREATE SCHEMA [bital]'');
';
EXEC sp_executesql @Sql;

PRINT N'Esquemas dietas y bital listos en ' + @Db + N'.';
PRINT N'Siguiente paso: aplicar migraciones EF y ejecutar 06-SeedCleanInstall.sql';
GO
