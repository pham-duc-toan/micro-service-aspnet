using AutoMapper;
using MediatR;
using Ordering.Application.Common.Interfaces;
using Ordering.Domain.Entities;
using Serilog;
using Shared.SeedWork.ApiResult;

namespace Ordering.Application.Features.V1.Orders;

public class CreateOrderCommandHandler : IRequestHandler<CreateOrderCommand, ApiResult<long>>
{
    private readonly IOrderRepository _orderRepository;
    private readonly IMapper _mapper;
    private readonly ILogger _logger;

    public CreateOrderCommandHandler(IOrderRepository orderRepository, IMapper mapper, ILogger logger)
    {
        _orderRepository = orderRepository;
        _mapper = mapper;
        _logger = logger;
    }

    private const string MethodName = "CreateOrderCommandHandler";

    public async Task<ApiResult<long>> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        _logger.Information($"BEGIN: {MethodName} - UserName: {request.UserName}");

        var orderEntity = _mapper.Map<Order>(request);
        _orderRepository.CreateOrder(orderEntity);
        orderEntity.AddOrder();
        await _orderRepository.SaveChangeAsync();

        _logger.Information($"Order {orderEntity.Id} - Document No: {orderEntity.DocumentNo} was successfully created.");
        _logger.Information($"END: {MethodName} - Username: {request.UserName}");

        return new ApiSuccessResult<long>(orderEntity.Id);
    }
}
