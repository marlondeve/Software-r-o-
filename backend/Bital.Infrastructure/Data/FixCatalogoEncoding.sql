-- Corrige nombres del catálogo con acentos mal codificados (UTF-8 interpretado como Latin-1).
-- Ejecutar en BitalNegocio con: sqlcmd -S localhost\SQLEXPRESS -d BitalNegocio -i FixCatalogoEncoding.sql -f 65001

USE BitalNegocio;
GO

UPDATE dietas.DietasCatalogo
SET
    Nombre = N'Dieta Diabética',
    Descripcion = N'Control de carbohidratos y azúcares para pacientes diabéticos'
WHERE Codigo = 'DD001';

UPDATE dietas.DietasCatalogo
SET
    Nombre = N'Dieta Hiposódica',
    Descripcion = N'Baja en sodio para pacientes con hipertensión o problemas renales'
WHERE Codigo = 'DH001';

UPDATE dietas.DietasCatalogo
SET
    Nombre = N'Dieta Líquida',
    Descripcion = N'Solo líquidos claros o completos según indicación'
WHERE Codigo = 'DL001';

UPDATE dietas.DietasCatalogo
SET
    Nombre = N'Dieta Blanda',
    Descripcion = N'Alimentos de fácil digestión y textura suave'
WHERE Codigo = 'DB001';

UPDATE dietas.DietasCatalogo
SET
    Nombre = N'Dieta Normal',
    Descripcion = N'Dieta completa y balanceada sin restricciones especiales'
WHERE Codigo = 'DN001';

GO
