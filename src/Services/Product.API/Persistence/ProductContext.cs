using Contracts.Domains.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Product.API.Persistence;

public class ProductContext : DbContext
{
    public ProductContext(DbContextOptions<ProductContext> options) : base(options)
    {
    }

    public DbSet<Entities.Product> Products => Set<Entities.Product>();

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = new CancellationToken())
    {
        var modified = ChangeTracker.Entries()
            .Where(e => e.State == EntityState.Modified ||
                        e.State == EntityState.Added ||
                        e.State == EntityState.Deleted);

        foreach (var item in modified)
        {
            switch (item.State)
            {
                case EntityState.Added:
                    if (item.Entity is IDateTracking addedEntity)
                    {
                        addedEntity.CreatedDate = DateTimeOffset.UtcNow;
                        item.State = EntityState.Added;
                    }
                    break;

                case EntityState.Modified:
                    Entry(item.Entity).Property("Id").IsModified = false;

                    if (item.Entity is IDateTracking modifiedEntity)
                    {
                        modifiedEntity.LastModifiedDate = DateTimeOffset.UtcNow;
                        item.State = EntityState.Modified;
                    }
                    break;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
