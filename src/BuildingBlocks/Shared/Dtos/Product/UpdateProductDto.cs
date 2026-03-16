using System.ComponentModel.DataAnnotations;

namespace Shared.Dtos.Product;

public class UpdateProductDto
{
  [Required]
  public string Name { get; set; } = default!;

  public string Summary { get; set; } = default!;
  public string Description { get; set; } = default!;
  public decimal Price { get; set; }
}
