using System.ComponentModel.DataAnnotations;

namespace Shared.Dtos.Product;

public class CreateProductDto : ProductUpsertDto
{
  [Required]
  public string No { get; set; } = default!;
}
