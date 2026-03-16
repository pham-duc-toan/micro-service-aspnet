using Contracts.Domains;

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Product.API.Entities;

public class CatalogProduct : EntityAuditBase<long>
{
    [Required]
    [Column(TypeName = "varchar(50)")]
    public string No { get; set; } = default!;

    [Required]
    [Column(TypeName = "varchar(250)")]
    public string Name { get; set; } = default!;

    [Column(TypeName = "longtext")]
    public string Summary { get; set; } = default!;

    [Column(TypeName = "text")]
    public string Description { get; set; } = default!;

    [Column(TypeName = "decimal(18,2)")]
    public decimal Price { get; set; }
}
