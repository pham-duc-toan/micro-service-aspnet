using Contracts.Domains;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace Contracts.Common.Interfaces
{
    public interface IRepositoryBaseAsync<T, K> : IRepositoryQueryBase<T, K>
    where T : EntityBase<K>
    {
        Task<K> CreateAsync(T entity, bool isSaveChange);
        Task<IList<K>> CreateListAsync(IEnumerable<T> entities, bool isSaveChange);
        Task UpdateAsync(T entity, bool isSaveChange);
        Task UpdateListAsync(IEnumerable<T> entities, bool isSaveChange);
        Task DeleteAsync(T entity, bool isSaveChange);
        Task DeleteListAsync(IEnumerable<T> entities, bool isSaveChange);
        Task<int> SaveChangeAsync();

        Task<IDbContextTransaction> BeginTransactionAsync();
        Task EndTransactionAsync();
        Task RollbackTransactionAsync();
    }

    public interface IRepositoryBaseAsync<T, K, TContext> : IRepositoryBaseAsync<T, K>
        where T : EntityBase<K>
        where TContext : DbContext
    {
    }
}