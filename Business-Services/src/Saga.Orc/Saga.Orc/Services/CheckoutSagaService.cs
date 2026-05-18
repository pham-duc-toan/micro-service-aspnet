using AutoMapper;
using Microsoft.Extensions.Logging;
using Saga.Orc.HttpRepositories.Interfaces;
using Saga.Orc.Services.Interfaces;
using Shared.DTOs.Basket;
using Shared.DTOs.Inventory;
using Shared.DTOs.Order;

namespace Saga.Orc.Services;

public class CheckoutSagaService : ICheckoutSagaService
{
    private readonly IOrderHttpRepository _orderHttpRepository;
    private readonly IBasketHttpRepository _basketHttpRepository;
    private readonly IInventoryHttpRepository _inventoryHttpRepository;
    private readonly IMapper _mapper;
    private readonly ILogger<CheckoutSagaService> _logger;

    public CheckoutSagaService(
        IOrderHttpRepository orderHttpRepository,
        IBasketHttpRepository basketHttpRepository,
        IInventoryHttpRepository inventoryHttpRepository,
        IMapper mapper,
        ILogger<CheckoutSagaService> logger
        )
    {
        _orderHttpRepository = orderHttpRepository;
        _basketHttpRepository = basketHttpRepository;
        _inventoryHttpRepository = inventoryHttpRepository;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<bool> CheckoutOrder(string username, BasketCheckoutDto dto)
    {
        _logger.LogInformation("Starting checkout for user {Username}.", username);
        // get cart from basket http repository
        var cart = await _basketHttpRepository.GetBasket(username);
        if (cart == null)
        {
            _logger.LogWarning("Basket not found for user {Username}.", username);
            return false;
        }

        // create order from order http repository
        var order = _mapper.Map<CreateOrderDto>(dto);
        order.TotalPrice = (long)cart.TotalPrice;

        var orderId = await _orderHttpRepository.CreateOrder(order);
        if (orderId < 0)
        {
            _logger.LogError("Failed to create order for user {Username}.", username);
            return false;
        }
        _logger.LogInformation("Created order {OrderId} for user {Username}.", orderId, username);

        // get order by id
        var addedOrder = await _orderHttpRepository.GetOrderById(orderId);
        _logger.LogInformation("Fetched order {OrderId} for user {Username}.", orderId, username);

        var inventoryDocNos = new List<string>();
        bool result;
        try
        {
            // sales items from inventory http repository
            foreach (var item in cart.Items)
            {
                _logger.LogInformation("Creating sales order for item {ItemNo} qty {Quantity}.", item.ItemNo, item.Quantity);
                var saleOrder = new SalesProductDto(addedOrder.DocumentNo, item.Quantity);
                saleOrder.SetItemNo(item.ItemNo);
                var docNo = await _inventoryHttpRepository.CreateSalesOrder(saleOrder);
                inventoryDocNos.Add(docNo);
                _logger.LogInformation("Created sales order document {DocumentNo}.", docNo);
            }

            result = await _basketHttpRepository.DeleteBasket(username);
            _logger.LogInformation("Deleted basket for user {Username}: {Result}.", username, result);
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Checkout failed for user {Username}. Rolling back order {OrderId}.", username, addedOrder.Id);
            await RollbackOrder(username, addedOrder.Id, inventoryDocNos);
            result = false;
        }

        _logger.LogInformation("Checkout completed for user {Username} with result {Result}.", username, result);
        return result;
    }

    private async Task RollbackOrder(string username, long orderId, List<string> inventoryDocNo)
    {
        var deletedDocNo = new List<string>();

        //delete order
        await _orderHttpRepository.DeleteOrderById(orderId);

        // delete order by id
        foreach (var item in inventoryDocNo)
        {
            _logger.LogWarning("Rolling back inventory document {DocumentNo} for user {Username}.", item, username);
            await _inventoryHttpRepository.DeleteOrderByDocumentNo(item);
            deletedDocNo.Add(item);
        }
        _logger.LogInformation("Rollback completed for user {Username}.", username);
    }
}