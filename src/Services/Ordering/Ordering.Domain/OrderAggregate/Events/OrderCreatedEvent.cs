using Contracts.Common.Events;

namespace Ordering.Domain.OrderAggregate.Events;

public record OrderCreatedEvent(
    long Id,
    string UserName,
    decimal TotalPrice,
    string DocumentNo,
    string EmailAddress,
    string ShippingAddress,
    string InvoiceAddress,
    string FullName) : BaseEvent;
