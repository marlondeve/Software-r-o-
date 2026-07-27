-- Tarifas 2026 para el catálogo de dietas (entornos con seed 2025)
-- Ejecutar: sqlcmd -S "DESKTOP-P43447B\SQLEXPRESS" -d BitalNegocio -f 65001 -i FixCatalogoTarifas2026.sql

USE BitalNegocio;
GO

INSERT INTO dietas.TarifasHistorico (
    Id,
    DietaCatalogoId,
    Anio,
    Monto,
    VigenciaDesde,
    VigenciaHasta,
    Activa,
    Observaciones,
    CreadoEn,
    CreadoPor
)
SELECT
    NEWID(),
    dc.Id,
    2026,
    th.Monto,
    '2026-01-01',
    '2026-12-31',
    1,
    N'Tarifa anual 2026',
    GETUTCDATE(),
    N'Sistema'
FROM dietas.DietasCatalogo dc
INNER JOIN dietas.TarifasHistorico th
    ON th.DietaCatalogoId = dc.Id
   AND th.Anio = 2025
   AND th.Activa = 1
WHERE dc.Activa = 1
  AND NOT EXISTS (
      SELECT 1
      FROM dietas.TarifasHistorico existente
      WHERE existente.DietaCatalogoId = dc.Id
        AND existente.Anio = 2026
  );
GO

PRINT 'Tarifas 2026 insertadas donde faltaban.';
GO
