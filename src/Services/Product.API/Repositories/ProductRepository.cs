using Contracts.Common.Interfaces;
using Infrastructure.Common;
using Microsoft.EntityFrameworkCore;
using Product.API.Entities;
using Product.API.Persistence;
using Product.API.Repositories.Interfaces;

namespace Product.API.Repositories;

public class ProductRepository
  : RepositoryBaseAsync<CatalogProduct, long, ProductContext>, IProductRepository
{
  public ProductRepository(ProductContext dbContext, IUnitOfWork<ProductContext> unitOfWork)
      : base(dbContext, unitOfWork)
  {
  }

  public async Task<IEnumerable<CatalogProduct>> GetProductsAsync() =>
      await FindAll().ToListAsync();

  public async Task<CatalogProduct?> GetProductAsync(long id) =>
    await GetByIdAsync(id);

  public async Task<CatalogProduct?> GetProductByNoAsync(string productNo) =>
    await FindByCondition(x => x.No.Equals(productNo)).SingleOrDefaultAsync();

  public async Task CreateProductAsync(CatalogProduct product)
  {
    _ = await CreateAsync(product);
  }

  public Task UpdateProductAsync(CatalogProduct product) =>
      UpdateAsync(product);

  public async Task DeleteProductAsync(long id)
  {
    var product = await GetByIdAsync(id);
    if (product is null)
      throw new KeyNotFoundException($"Product with id {id} was not found");

    await DeleteAsync(product);
  }
}
