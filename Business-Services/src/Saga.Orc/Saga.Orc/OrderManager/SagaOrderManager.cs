using AutoMapper;
using Contracts.Saga.OrderManager;
using Microsoft.Extensions.Logging;
using Saga.Orc.HttpRepositories.Interfaces;
using Shared.DTOs.Basket;
using Shared.DTOs.Inventory;
using Shared.DTOs.Order;
using Stateless;
using System.Reflection.Metadata;

namespace Saga.Orc.OrderManager;

public class SagaOrderManager : ISagaOrderManager<BasketCheckoutDto, OrderResponse>
{
    private readonly IOrderHttpRepository _orderHttpRepository;
    private readonly IBasketHttpRepository _basketHttpRepository;
    private readonly IInventoryHttpRepository _inventoryHttpRepository;
    private readonly IMapper _mapper;
    private readonly ILogger<SagaOrderManager> _logger;

    public SagaOrderManager(
        IOrderHttpRepository orderHttpRepository, 
        IBasketHttpRepository basketHttpRepository, 
        IInventoryHttpRepository inventoryHttpRepository, 
        IMapper mapper,
        ILogger<SagaOrderManager> logger
    )
    {
        _orderHttpRepository = orderHttpRepository;
        _basketHttpRepository = basketHttpRepository;
        _inventoryHttpRepository = inventoryHttpRepository;
        _mapper = mapper;
        _logger = logger;
    }
    public OrderResponse CreateOrder(BasketCheckoutDto input)
    {
        var orderStateMachine = new StateMachine<EOrderTransactionState, EOrderAction>(EOrderTransactionState.NoStarted);

        orderStateMachine.OnTransitioned(t =>
        {
            _logger.LogInformation("Saga transition: {Source} --({Trigger})-> {Destination}", t.Source, t.Trigger, t.Destination);
        });

        long orderId = -1;
        CartDto cart = null;
        OrderDto addedOrder = null;
        string? inventoryDocNo = "";

        _logger.LogInformation("Saga checkout started. Username={Username}", input?.UserName);

        orderStateMachine.Configure(EOrderTransactionState.NoStarted)
            .PermitDynamic(EOrderAction.GetBasket, () =>
            {
                try
                {
                    _logger.LogInformation("[GetBasket] Requesting basket. Username={Username}", input.UserName);
                    cart = _basketHttpRepository.GetBasket(input.UserName).Result;

                    if (cart == null)
                    {
                        _logger.LogWarning("[GetBasket] Basket not found. Username={Username}", input.UserName);
                        return EOrderTransactionState.BasketGetFailed;
                    }

                    _logger.LogInformation("[GetBasket] Basket loaded. Username={Username}, Items={ItemCount}, TotalPrice={TotalPrice}",
                        cart.Username, cart.Items?.Count ?? 0, cart.TotalPrice);
                    return EOrderTransactionState.BasketGot;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[GetBasket] Failed to get basket. Username={Username}", input.UserName);
                    return EOrderTransactionState.BasketGetFailed;
                }
            });

        orderStateMachine.Configure(EOrderTransactionState.BasketGot)
            .PermitDynamic(EOrderAction.CreateOrder, () =>
            {
                try
                {
                    _logger.LogInformation("[CreateOrder] Creating order. Username={Username}", input.UserName);
                    var order = _mapper.Map<CreateOrderDto>(input);
                    orderId = _orderHttpRepository.CreateOrder(order).Result;

                    if (orderId > 0)
                    {
                        _logger.LogInformation("[CreateOrder] Order created. OrderId={OrderId}", orderId);
                        return EOrderTransactionState.OrderCreated;
                    }

                    _logger.LogWarning("[CreateOrder] Order create failed. Returned OrderId={OrderId}", orderId);
                    return EOrderTransactionState.OrderCreatedFailed;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[CreateOrder] Failed to create order. Username={Username}", input.UserName);
                    return EOrderTransactionState.OrderCreatedFailed;
                }
            })
            .OnEntry(() =>
            {
                _logger.LogInformation("Entered state: {State}. Firing action: {Action}", orderStateMachine.State, EOrderAction.CreateOrder);
                orderStateMachine.Fire(EOrderAction.CreateOrder);
            });

        orderStateMachine.Configure(EOrderTransactionState.OrderCreated)
            .PermitDynamic(EOrderAction.GetOrder, () =>
            {
                try
                {
                    _logger.LogInformation("[GetOrder] Fetching order. OrderId={OrderId}", orderId);
                    addedOrder = _orderHttpRepository.GetOrderById(orderId).Result;

                    if (addedOrder == null)
                    {
                        _logger.LogWarning("[GetOrder] Order not found. OrderId={OrderId}", orderId);
                        return EOrderTransactionState.OrderGetFailed;
                    }

                    _logger.LogInformation("[GetOrder] Order loaded. OrderId={OrderId}, DocumentNo={DocumentNo}", addedOrder.Id, addedOrder.DocumentNo);
                    return EOrderTransactionState.OrderGot;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[GetOrder] Failed to fetch order. OrderId={OrderId}", orderId);
                    return EOrderTransactionState.OrderGetFailed;
                }
            })
            .OnEntry(() =>
            {
                _logger.LogInformation("Entered state: {State}. Firing action: {Action}", orderStateMachine.State, EOrderAction.GetOrder);
                orderStateMachine.Fire(EOrderAction.GetOrder);
            });

        orderStateMachine.Configure(EOrderTransactionState.OrderGot)
            .PermitDynamic(EOrderAction.UpdateInventory, () =>
            {
                try
                {
                    _logger.LogInformation("[UpdateInventory] Creating inventory sale order. OrderId={OrderId}, Items={ItemCount}",
                        addedOrder?.Id, cart?.Items?.Count ?? 0);

                    var saleOrder = new SaleOrderDto
                    {
                        OrderDocNo = addedOrder.EmailAddress,
                        SaleItems = _mapper.Map<List<SaleItemDto>>(cart.Items),
                    };

                    inventoryDocNo = _inventoryHttpRepository.CreateOrderSale(addedOrder.ShippingAddress, saleOrder).Result;
                    if (!string.IsNullOrWhiteSpace(inventoryDocNo))
                    {
                        _logger.LogInformation("[UpdateInventory] Inventory updated. InventoryDocNo={InventoryDocNo}", inventoryDocNo);
                        return EOrderTransactionState.InventoryUpdated;
                    }

                    _logger.LogWarning("[UpdateInventory] Inventory update failed. InventoryDocNo is empty.");
                    return EOrderTransactionState.InventoryUpdateFailed;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[UpdateInventory] Failed to update inventory. OrderId={OrderId}", addedOrder?.Id);
                    return EOrderTransactionState.InventoryUpdateFailed;
                }
            })
            .OnEntry(() =>
            {
                _logger.LogInformation("Entered state: {State}. Firing action: {Action}", orderStateMachine.State, EOrderAction.UpdateInventory);
                orderStateMachine.Fire(EOrderAction.UpdateInventory);
            });

        orderStateMachine.Configure(EOrderTransactionState.InventoryUpdated)
            .PermitDynamic(EOrderAction.DeleteBasket, () =>
            {
                try
                {
                    _logger.LogInformation("[DeleteBasket] Deleting basket. Username={Username}", input.UserName);
                    var result = _basketHttpRepository.DeleteBasket(input.UserName).Result;
                    _logger.LogInformation("[DeleteBasket] Deleted basket result={Result}. Username={Username}", result, input.UserName);
                    return result ? EOrderTransactionState.BasketDeleted : EOrderTransactionState.InventoryUpdateFailed;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[DeleteBasket] Failed to delete basket. Username={Username}", input.UserName);
                    return EOrderTransactionState.InventoryUpdateFailed;
                }
            })
            .OnEntry(() =>
            {
                _logger.LogInformation("Entered state: {State}. Firing action: {Action}", orderStateMachine.State, EOrderAction.DeleteBasket);
                orderStateMachine.Fire(EOrderAction.DeleteBasket);
            });

        orderStateMachine.Configure(EOrderTransactionState.InventoryRollbackFailed)
            .PermitDynamic(EOrderAction.DeleteInventory, () =>
            {
                _logger.LogWarning("[Rollback] Rolling back order. Username={Username}, OrderId={OrderId}, InventoryDocNo={InventoryDocNo}",
                    input.UserName, orderId, inventoryDocNo);
                RollbackOrder(input.UserName, inventoryDocNo, orderId);
                return EOrderTransactionState.RollbackInventory;
            }).OnEntry(() => {
                orderStateMachine.Fire(EOrderAction.DeleteInventory);
            });
        
        _logger.LogInformation("Firing initial action: {Action}. CurrentState={State}", EOrderAction.GetBasket, orderStateMachine.State);
        orderStateMachine.Fire(EOrderAction.GetBasket);

        _logger.LogInformation("Saga checkout finished. FinalState={State}, OrderId={OrderId}, InventoryDocNo={InventoryDocNo}",
            orderStateMachine.State, orderId, inventoryDocNo);
        
        return new OrderResponse(orderStateMachine.State == EOrderTransactionState.BasketDeleted);
    }

    public OrderResponse RollbackOrder(string username, string docNo, long orderId)
    {
        var orderStateMachine =
        new Stateless.StateMachine<EOrderTransactionState, EOrderAction>(EOrderTransactionState.RollbackInventory);

            orderStateMachine.Configure(EOrderTransactionState.RollbackInventory)
                .PermitDynamic(trigger: EOrderAction.DeleteInventory, destinationStateSelector: () =>
                {
                    _inventoryHttpRepository.DeleteOrderByDocumentNo(docNo);
                    return
                         EOrderTransactionState.InventoryRollback;
                      
                });

            orderStateMachine.Configure(EOrderTransactionState.InventoryRollback)
                .PermitDynamic(trigger: EOrderAction.DeleteOrder, destinationStateSelector: () =>
                {
                    var result = _orderHttpRepository.DeleteOrderById(orderId).Result;
                    return result
                        ? EOrderTransactionState.OrderDeleted
                        : EOrderTransactionState.OrderDeletedFailed;
                }).OnEntry(()=> { 
                    orderStateMachine.Fire(EOrderAction.DeleteOrder);
                });
        orderStateMachine.Fire(EOrderAction.DeleteInventory);
        return new OrderResponse(orderStateMachine.State == EOrderTransactionState.InventoryRollback);
    }
}