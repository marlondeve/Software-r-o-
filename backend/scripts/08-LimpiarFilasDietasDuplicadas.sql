/*
  RioSoft 1.2.7 — limpia duplicados en dietas.FilasDietas

  Causa: INGRESOS.IngCsc se usó como id global. Cada «Actualizar censo»
  dejó copias (casi todas en Pendiente / sin solicitud). Los reportes
  y KPIs sumaban esas filas.

  Ejecutar en BitalNegocio (NO en Hospital_Produccion / HIS).

  Uso:
    1) Dejar @Aplicar = 0 y ejecutar → solo diagnóstico (no borra).
    2) Revisar «Filas a eliminar» y el detalle por día/comida.
    3) Poner @Aplicar = 1 y volver a ejecutar → reasigna etiquetas /
       eventos / conciliación a la fila que se conserva y borra el resto.

  Conserva, por paciente + comida + día:
    orden de cocina, etiqueta, estado más avanzado, luego la más reciente.
  Idempotente: si ya no hay duplicados, no cambia nada.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @Aplicar bit = 0; -- 1 = aplicar el borrado

IF OBJECT_ID('tempdb..#Ranking') IS NOT NULL DROP TABLE #Ranking;

;WITH Normalizado AS (
    SELECT
        f.Id,
        CONVERT(date, f.FechaOperativa) AS FechaDia,
        f.Comida,
        f.Estado,
        f.OrdenCocinaId,
        f.CreadoEn,
        f.ModificadoEn,
        CASE
            WHEN LEN(ced.Norm) >= 5 THEN ced.Norm
            WHEN (LEN(pid.Norm) - LEN(REPLACE(pid.Norm, '-', ''))) >= 4 THEN pid.Norm
            WHEN CHARINDEX('-', pid.Norm) > 0
                 AND LEN(STUFF(pid.Norm, 1, CHARINDEX('-', pid.Norm), '')) >= 5
                THEN STUFF(pid.Norm, 1, CHARINDEX('-', pid.Norm), '')
            WHEN LEN(pid.Norm) >= 5 THEN pid.Norm
            ELSE CONCAT(N'ID:', CONVERT(varchar(36), f.Id))
        END AS ClavePaciente,
        CASE WHEN EXISTS (
            SELECT 1 FROM bital.EtiquetasEnfermeria e WHERE e.FilaDietaId = f.Id
        ) THEN 1 ELSE 0 END AS TieneEtiqueta
    FROM dietas.FilasDietas f
    CROSS APPLY (
        SELECT UPPER(REPLACE(REPLACE(REPLACE(LTRIM(RTRIM(ISNULL(f.Cedula, N''))), N' ', N''), N'-', N''), N'.', N'')) AS Norm
    ) ced
    CROSS APPLY (
        SELECT UPPER(LTRIM(RTRIM(ISNULL(f.PacienteId, N'')))) AS Norm
    ) pid
),
Rankeado AS (
    SELECT
        n.*,
        ROW_NUMBER() OVER (
            PARTITION BY n.FechaDia, n.Comida, n.ClavePaciente
            ORDER BY
                CASE WHEN n.OrdenCocinaId IS NOT NULL THEN 1 ELSE 0 END DESC,
                n.TieneEtiqueta DESC,
                CASE WHEN n.Estado = 10 THEN 0 ELSE 1 END DESC,
                CASE n.Estado
                    WHEN 1 THEN 0
                    WHEN 2 THEN 1
                    WHEN 3 THEN 1
                    WHEN 4 THEN 2
                    WHEN 5 THEN 3
                    WHEN 6 THEN 4
                    WHEN 7 THEN 5
                    WHEN 8 THEN 6
                    WHEN 9 THEN 6
                    WHEN 10 THEN -1
                    WHEN 11 THEN 5
                    WHEN 12 THEN 5
                    ELSE 0
                END DESC,
                COALESCE(n.ModificadoEn, n.CreadoEn) DESC
        ) AS rn
    FROM Normalizado n
)
SELECT *
INTO #Ranking
FROM Rankeado;

DECLARE @Total int = (SELECT COUNT(*) FROM #Ranking);
DECLARE @Unicas int = (SELECT COUNT(*) FROM #Ranking WHERE rn = 1);
DECLARE @Duplicadas int = (SELECT COUNT(*) FROM #Ranking WHERE rn > 1);
DECLARE @Grupos int = (
    SELECT COUNT(*) FROM (
        SELECT FechaDia, Comida, ClavePaciente
        FROM #Ranking
        GROUP BY FechaDia, Comida, ClavePaciente
        HAVING COUNT(*) > 1
    ) g
);

PRINT N'--- Diagnóstico FilasDietas ---';
PRINT N'Total filas:              ' + CONVERT(varchar(20), @Total);
PRINT N'Filas únicas (a conservar): ' + CONVERT(varchar(20), @Unicas);
PRINT N'Filas duplicadas (a borrar): ' + CONVERT(varchar(20), @Duplicadas);
PRINT N'Grupos con duplicado:     ' + CONVERT(varchar(20), @Grupos);

SELECT TOP 50
    r.FechaDia,
    r.Comida,
    r.ClavePaciente,
    COUNT(*) AS FilasEnGrupo,
    SUM(CASE WHEN r.rn = 1 THEN 0 ELSE 1 END) AS ABorrar
FROM #Ranking r
GROUP BY r.FechaDia, r.Comida, r.ClavePaciente
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC, r.FechaDia DESC;

IF @Duplicadas = 0
BEGIN
    PRINT N'No hay duplicados. Nada que hacer.';
    DROP TABLE #Ranking;
    RETURN;
END;

IF @Aplicar = 0
BEGIN
    PRINT N'Solo diagnóstico. Para borrar, cambiar @Aplicar = 1 y volver a ejecutar.';
    DROP TABLE #Ranking;
    RETURN;
END;

BEGIN TRANSACTION;

    UPDATE e
    SET e.FilaDietaId = k.Id
    FROM bital.EtiquetasEnfermeria e
    INNER JOIN #Ranking d ON d.Id = e.FilaDietaId AND d.rn > 1
    INNER JOIN #Ranking k
        ON k.rn = 1
       AND k.FechaDia = d.FechaDia
       AND k.Comida = d.Comida
       AND k.ClavePaciente = d.ClavePaciente;

    UPDATE t
    SET t.FilaDietaId = k.Id
    FROM dietas.EventosTrazabilidad t
    INNER JOIN #Ranking d ON d.Id = t.FilaDietaId AND d.rn > 1
    INNER JOIN #Ranking k
        ON k.rn = 1
       AND k.FechaDia = d.FechaDia
       AND k.Comida = d.Comida
       AND k.ClavePaciente = d.ClavePaciente;

    UPDATE c
    SET c.FilaDietaId = k.Id
    FROM bital.FilasConciliacion c
    INNER JOIN #Ranking d ON d.Id = c.FilaDietaId AND d.rn > 1
    INNER JOIN #Ranking k
        ON k.rn = 1
       AND k.FechaDia = d.FechaDia
       AND k.Comida = d.Comida
       AND k.ClavePaciente = d.ClavePaciente;

    DELETE f
    FROM dietas.FilasDietas f
    INNER JOIN #Ranking d ON d.Id = f.Id AND d.rn > 1;

COMMIT TRANSACTION;

PRINT N'Limpieza aplicada. Filas eliminadas: ' + CONVERT(varchar(20), @Duplicadas);
PRINT N'Filas restantes: ' + CONVERT(varchar(20), @Unicas);

DROP TABLE #Ranking;
GO
