namespace Product.API.Persistence;

public class ProductContextSeed
{
  public static async Task SeedProductAsync(ProductContext productContext, Serilog.ILogger logger)
  {
    if (!productContext.Products.Any())
    {
      productContext.Products.AddRange(GetCatalogProducts());
      await productContext.SaveChangesAsync();
      logger.Information("Seeded data for Product DB associated with context {DbContextName}", nameof(ProductContext));
    }
  }

  private static IEnumerable<Entities.CatalogProduct> GetCatalogProducts()
  {
    return new List<Entities.CatalogProduct>
        {
            new()
            {
                No = "P001",
                Name = "Esprit",
                Summary = "Non-displaced fracture of greater trochanter of right femur",
                Description = "Non-displaced fracture of greater trochanter of right femur",
                Price = 177940.49m
            },
            new()
            {
                No = "P002",
                Name = "Xiaomi 12",
                Summary = "Flagship smartphone with Snapdragon chipset",
                Description = "Flagship smartphone with high refresh-rate display and fast charging",
                Price = 699.00m
            },
            new()
            {
                No = "P003",
                Name = "Logitech MX Master 3S",
                Summary = "Wireless productivity mouse",
                Description = "Ergonomic wireless mouse optimized for office and development workflows",
                Price = 99.99m
            }
        };
  }
}