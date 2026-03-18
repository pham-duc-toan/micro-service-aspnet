using Contracts.Domains;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Customer.API.Entities;

public class Customer : EntityBase<int>
{
  [Required]
  public string UserName { get; set; } = string.Empty;

  [Required]
  [Column(TypeName = "varchar(100)")]
  public string FirstName { get; set; } = string.Empty;

  [Required]
  [Column(TypeName = "varchar(150)")]
  public string LastName { get; set; } = string.Empty;

  [Required]
  [EmailAddress]
  public string EmailAddress { get; set; } = string.Empty;
}
