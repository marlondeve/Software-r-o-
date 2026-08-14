-- ============================================================================
-- Script de Creación de Base de Datos BitalNegocio
-- Compatible con SQL Server 2019+ (Express, Standard, Enterprise)
--
-- sqlcmd -S localhost\SQLEXPRESS -E -C -f 65001 ^
--   -v DatabaseName="BitalNegocio" ^
--   -i backend\scripts\01-CreateDatabase.sql
-- ============================================================================

:setvar DatabaseName BitalNegocio

USE master;
GO

IF DB_ID(N'$(DatabaseName)') IS NULL
BEGIN
	CREATE DATABASE [$(DatabaseName)];
	PRINT 'Base de datos $(DatabaseName) creada exitosamente.';
END
ELSE
BEGIN
	PRINT 'La base de datos $(DatabaseName) ya existe.';
END
GO

USE [$(DatabaseName)];
GO

IF SCHEMA_ID(N'dietas') IS NULL
BEGIN
	EXEC(N'CREATE SCHEMA [dietas]');
	PRINT 'Esquema dietas creado exitosamente.';
END
ELSE
BEGIN
	PRINT 'El esquema dietas ya existe.';
END
GO

IF SCHEMA_ID(N'bital') IS NULL
BEGIN
	EXEC(N'CREATE SCHEMA [bital]');
	PRINT 'Esquema bital creado exitosamente.';
END
ELSE
BEGIN
	PRINT 'El esquema bital ya existe.';
END
GO

-- Usuario Dev: solo si existe el login a nivel de servidor (no falla en SQL 2019 sin ese login)
IF SUSER_ID(N'Dev') IS NOT NULL
BEGIN
	IF DATABASE_PRINCIPAL_ID(N'Dev') IS NULL
	BEGIN
		CREATE USER [Dev] FOR LOGIN [Dev];
		PRINT 'Usuario Dev creado en la base de datos.';
	END

	IF NOT EXISTS (
		SELECT 1
		FROM sys.database_role_members rm
		INNER JOIN sys.database_principals r ON r.principal_id = rm.role_principal_id AND r.name = N'db_owner'
		INNER JOIN sys.database_principals m ON m.principal_id = rm.member_principal_id AND m.name = N'Dev'
	)
	BEGIN
		ALTER ROLE db_owner ADD MEMBER [Dev];
		PRINT 'Rol db_owner asignado a Dev.';
	END
END
ELSE
BEGIN
	PRINT 'Login Dev no existe en el servidor; se omite CREATE USER (use Windows Auth o SQL Auth).';
END
GO

PRINT '============================================';
PRINT 'Base de datos $(DatabaseName) configurada.';
PRINT 'Compatible con SQL Server 2019+ (nivel 150).';
PRINT '============================================';
GO
