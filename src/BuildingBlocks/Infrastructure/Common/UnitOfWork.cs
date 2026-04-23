using Contracts.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Common
{
  public class UnitOfWork<TContext> : IUnitOfWork<TContext> where TContext : DbContext
  {
    private readonly TContext _context;

    public UnitOfWork(TContext context)
    {
      _context = context;
    }

    public int Commit() => _context.SaveChanges();

    public async Task<int> CommitAsync() => await _context.SaveChangesAsync();

    public void Dispose() => _context.Dispose();
  }
}
