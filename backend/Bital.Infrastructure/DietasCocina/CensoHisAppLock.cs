using System.Data;
using Bital.Domain.Enums;
using Bital.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace Bital.Infrastructure.DietasCocina;

internal interface ICensoHisLock : IAsyncDisposable
{
    void MarcarExito();
    Task CompletarAsync(CancellationToken cancellationToken = default);
}

/// <summary>
/// Un solo writer del censo HIS por fecha+comida (IIS con varios workers incluido).
/// </summary>
internal static class CensoHisAppLock
{
    internal static async Task<ICensoHisLock> AdquirirAsync(
        BitalNegocioDbContext context,
        DateTime fecha,
        TiempoComida comida,
        CancellationToken cancellationToken)
    {
        if (!context.Database.IsSqlServer())
            return NoOpLock.Instance;

        var tx = await context.Database.BeginTransactionAsync(cancellationToken);
        var resource = $"dietas-censo:{fecha:yyyy-MM-dd}:{comida}";

        var conn = context.Database.GetDbConnection();
        if (conn.State != ConnectionState.Open)
            await conn.OpenAsync(cancellationToken);

        await using var cmd = conn.CreateCommand();
        cmd.Transaction = context.Database.CurrentTransaction?.GetDbTransaction();
        cmd.CommandText =
            "DECLARE @r int; EXEC @r = sp_getapplock @Resource=@res, @LockMode='Exclusive', @LockOwner='Transaction', @LockTimeout=@timeout; SELECT @r;";

        var pRes = cmd.CreateParameter();
        pRes.ParameterName = "@res";
        pRes.Value = resource;
        cmd.Parameters.Add(pRes);

        var pTimeout = cmd.CreateParameter();
        pTimeout.ParameterName = "@timeout";
        pTimeout.Value = 60_000;
        cmd.Parameters.Add(pTimeout);

        var raw = await cmd.ExecuteScalarAsync(cancellationToken);
        var result = raw is int i ? i : Convert.ToInt32(raw, System.Globalization.CultureInfo.InvariantCulture);
        if (result < 0)
        {
            await tx.RollbackAsync(cancellationToken);
            await tx.DisposeAsync();
            throw new InvalidOperationException(
                "El censo hospitalario se está sincronizando. Intente de nuevo en unos segundos.");
        }

        return new SqlLockLease(tx);
    }

    private sealed class SqlLockLease : ICensoHisLock
    {
        private readonly IDbContextTransaction _tx;
        private bool _completado;
        private bool _cerrado;

        public SqlLockLease(IDbContextTransaction tx) => _tx = tx;

        public void MarcarExito() => _completado = true;

        public async Task CompletarAsync(CancellationToken cancellationToken = default)
        {
            if (_cerrado) return;
            _cerrado = true;
            try
            {
                if (_completado)
                    await _tx.CommitAsync(cancellationToken);
                else
                    await _tx.RollbackAsync(cancellationToken);
            }
            finally
            {
                await _tx.DisposeAsync();
            }
        }

        public ValueTask DisposeAsync() => new(CompletarAsync());
    }

    private sealed class NoOpLock : ICensoHisLock
    {
        public static NoOpLock Instance { get; } = new();

        public void MarcarExito() { }

        public Task CompletarAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;

        public ValueTask DisposeAsync() => ValueTask.CompletedTask;
    }
}
