/*
  BITAL — Vaciar catálogo de dietas para cargar el seed FCR al reiniciar la API.
  Las filas operativas (dietas.Dietas) conservan TipoDietaId = NULL (FK SET NULL).

  Pasos:
    1. Ejecutar este script en BitalNegocio
    2. Reiniciar la API (SeedFcrIfEmpty: true en appsettings)
    3. Verificar Dietas y tarifas → deben aparecer D-001 … D-012 con tarifas FCR 2026

  sqlcmd -S 10.238.97.66 -d BitalNegocio -U soporterio -P "***" -f 65001 -i backend\scripts\05-ClearCatalogoParaSeedFcr.sql
*/

SET NOCOUNT ON;
BEGIN TRY
    BEGIN TRANSACTION;

    DELETE FROM dietas.TarifasHistorico;
    DELETE FROM dietas.DietasCatalogo;

    COMMIT TRANSACTION;
    PRINT 'OK — Catálogo vaciado. Reinicie la API para cargar el seed FCR (D-001 … D-012).';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    DECLARE @Msg NVARCHAR(4000) = ERROR_MESSAGE();
    RAISERROR(N'Error al vaciar catálogo: %s', 16, 1, @Msg);
END CATCH;
