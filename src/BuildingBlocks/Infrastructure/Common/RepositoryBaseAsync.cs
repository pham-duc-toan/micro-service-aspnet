using Contracts.Common.Interfaces;
using Contracts.Domains;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace Infrastructure.Common
{
    public class RepositoryBaseAsync<T, K, TContext> : RepositoryQueryBase<T, K, TContext>, IRepositoryBaseAsync<T, K, TContext>
        where T : EntityBase<K>
        where TContext : DbContext
    {
        private readonly TContext _dbContext;
        private readonly IUnitOfWork<TContext> _unitOfWork;

        public RepositoryBaseAsync(TContext dbContext, IUnitOfWork<TContext> unitOfWork) : base(dbContext)
        {
            _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
            _unitOfWork = unitOfWork ?? throw new ArgumentException(nameof(unitOfWork));
        }

        public Task<IDbContextTransaction> BeginTransactionAsync() =>
            _dbContext.Database.BeginTransactionAsync();

        public async Task EndTransactionAsync()
        {
            await SaveChangeAsync();
            await _dbContext.Database.CommitTransactionAsync();
        }

        public Task RollbackTransactionAsync() =>
            _dbContext.Database.RollbackTransactionAsync();

        public async Task<K> CreateAsync(T entity, bool isSaveChange = false)
        {
            await _dbContext.Set<T>().AddAsync(entity);
            if (isSaveChange) await SaveChangeAsync();
            return entity.Id;
        }

        public async Task<IList<K>> CreateListAsync(IEnumerable<T> entities, bool isSaveChange = false)
        {
            await _dbContext.Set<T>().AddRangeAsync(entities);
            if (isSaveChange) await SaveChangeAsync();
            return entities.Select(x => x.Id).ToList();
        }

        public async Task UpdateAsync(T entity, bool isSaveChange = false)
        {
            if (_dbContext.Entry(entity).State == EntityState.Unchanged) return;

            T exist = _dbContext.Set<T>().Find(entity.Id);
            _dbContext.Entry(exist).CurrentValues.SetValues(entity);
            if (isSaveChange) await SaveChangeAsync();
        }

        public async Task UpdateListAsync(IEnumerable<T> entities, bool isSaveChange = false)
        {
            await _dbContext.Set<T>().AddRangeAsync(entities);
            if (isSaveChange) await SaveChangeAsync();
        }


        public async Task DeleteAsync(T entity, bool isSaveChange = false)
        {
            _dbContext.Set<T>().Remove(entity);
            if (isSaveChange) await SaveChangeAsync();
        }

        public async Task DeleteListAsync(IEnumerable<T> entities, bool isSaveChange = false)
        {
            _dbContext.Set<T>().RemoveRange(entities);
            if (isSaveChange) await SaveChangeAsync();
        }

        public Task<int> SaveChangeAsync() => _unitOfWork.CommitAsync();
    }
}
