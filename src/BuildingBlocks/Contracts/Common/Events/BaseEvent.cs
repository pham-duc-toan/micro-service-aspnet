using MediatR;

namespace Contracts.Common.Events;

public abstract record BaseEvent : INotification;
