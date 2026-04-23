using System.ComponentModel.DataAnnotations;

namespace Shared.DTOs.Product;

public class CreateProductDto : ProductUpsertDto
{
  [Required]
  public string No { get; set; } = default!;
}
