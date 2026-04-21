using Ordering.Application.Common.Mapping;
using Ordering.Domain.Entities;
using Shared.Enums;

namespace Ordering.Application.Common.Models;

public class OrderDto : IMapFrom<Order>
{
    public int Id { get; set; }
    public string DocumentNo { get; set; }
    public string UserName { get; set; }
    public decimal TotalPrice { get; set; }

    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string EmailAddress { get; set; }

    public string ShippingAddress { get; set; }
    public string InvoiceAddress { get; set; }

    public EOrderStatus Status { get; set; }
}
