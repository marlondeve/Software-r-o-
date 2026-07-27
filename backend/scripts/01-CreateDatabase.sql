-- ============================================================================
-- Script de Creación de Base de Datos BitalNegocio
-- Servidor: DESKTOP-P43447B\SQLEXPRESS
-- ============================================================================

USE master;
GO

-- Crear la base de datos si no existe
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'BitalNegocio')
BEGIN
	CREATE DATABASE BitalNegocio;
	PRINT 'Base de datos BitalNegocio creada exitosamente.';
END
ELSE
BEGIN
	PRINT 'La base de datos BitalNegocio ya existe.';
END
GO

-- Usar la base de datos
USE BitalNegocio;
GO

-- Crear el esquema dietas si no existe
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'dietas')
BEGIN
	EXEC('CREATE SCHEMA dietas');
	PRINT 'Esquema dietas creado exitosamente.';
END
ELSE
BEGIN
	PRINT 'El esquema dietas ya existe.';
END
GO

-- Crear el esquema bital si no existe
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'bital')
BEGIN
	EXEC('CREATE SCHEMA bital');
	PRINT 'Esquema bital creado exitosamente.';
END
ELSE
BEGIN
	PRINT 'El esquema bital ya existe.';
END
GO

-- Dar permisos al usuario Dev
USE BitalNegocio;
GO

IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'Dev')
BEGIN
	CREATE USER [Dev] FOR LOGIN [Dev];
	PRINT 'Usuario Dev creado en la base de datos.';
END
GO

-- Asignar roles al usuario Dev
ALTER ROLE db_owner ADD MEMBER [Dev];
GO

PRINT '============================================';
PRINT 'Base de datos BitalNegocio configurada!';
PRINT 'Usuario: Dev con permisos db_owner';
PRINT '============================================';
GO
