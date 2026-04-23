using System.ComponentModel.DataAnnotations;

namespace Shared.DTOs.Product;

public abstract class ProductUpsertDto
{
  [Required]
  public string Name { get; set; } = default!;

  public string Summary { get; set; } = default!;
  public string Description { get; set; } = default!;
  public decimal Price { get; set; }
}