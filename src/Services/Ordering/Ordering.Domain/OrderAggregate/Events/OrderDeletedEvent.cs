using Contracts.Common.Events;

namespace Ordering.Domain.OrderAggregate.Events;

public record OrderDeletedEvent(long Id) : BaseEvent;
