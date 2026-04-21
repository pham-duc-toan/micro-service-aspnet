using AutoMapper;
using Saga.Orchestrator.HttpRepository.Interfaces;
using Saga.Orchestrator.Services.Interfaces;
using Shared.DTOs.Basket;
using Shared.DTOs.Inventory;
using Shared.DTOs.Order;
using ILogger = Serilog.ILogger;

namespace Saga.Orchestrator.Services;

public class CheckoutService : ICheckoutService
{
    private readonly ILogger _logger;
    private readonly IMapper _mapper;
    private readonly IBasketHttpRepository _basketHttpRepository;
    private readonly IOrderHttpRepository _orderHttpRepository;
    private readonly IInventoryHttpRepository _inventoryHttpRepository;

    public CheckoutService(ILogger logger,
                           IMapper mapper,
                           IBasketHttpRepository basketHttpRepository,
                           IOrderHttpRepository orderHttpRepository,
                           IInventoryHttpRepository inventoryHttpRepository)
    {
        _logger = logger;
        _mapper = mapper;
        _basketHttpRepository = basketHttpRepository;
        _orderHttpRepository = orderHttpRepository;
        _inventoryHttpRepository = inventoryHttpRepository;
    }

    public async Task<bool> CheckoutOrderAsync(string userName, BasketCheckoutDto basketCheckout)
    {
        // 1. Get cart from BasketHttpRepository
        _logger.Information($"Start: Get Cart {userName}");

        var cart = await _basketHttpRepository.GetBasketAsync(userName);
        if (cart == null) return false;
        _logger.Information($"End: Get Cart {userName} success");

        // 2. Create Order from OrderHttpRepository
        _logger.Information($"Start: Create Order");

        var order = _mapper.Map<CreateOrderDto>(basketCheckout);
        order.TotalPrice = cart.TotalPrice;
        var orderId = await _orderHttpRepository.CreateOrderAsync(order);
        if (orderId < 0) return false;

        // 3. Get Order by OrderId
        var addedOrder = await _orderHttpRepository.GetOrderAsync(orderId);
        _logger.Information($"End: Created Order success. OrderId: {orderId}. Document No: {addedOrder.DocumentNo}");

        var inventoryDocumentNos = new List<string>();
        bool result;
        try
        {
            // 4. Sales Items from InventoryHttpRepository
            foreach (var item in cart.Items)
            {
                _logger.Information($"Start: Sale Item No: {item.ItemNo} - Quantity: {item.Quantity}");

                var saleOrder = new SalesProductDto(addedOrder.DocumentNo, item.Quantity);
                saleOrder.SetItemNo(item.ItemNo);
                var documentNo = await _inventoryHttpRepository.CreateSalesItemAsync(saleOrder);
                inventoryDocumentNos.Add(documentNo);
                _logger.Information($"End: Sale Item No: {item.ItemNo} " +
                                    $"- Quantity: {item.Quantity} - Document No: {documentNo}");
            }

            // 5. Delete Basket
            result = await _basketHttpRepository.DeleteBasketAsync(userName);
        }
        catch (Exception e)
        {
            _logger.Error(e.Message);

            RollbackCheckoutOrder(userName, orderId, inventoryDocumentNos);

            result = false;
        }

        return result;
    }

    private async void RollbackCheckoutOrder(string userName, long orderId, List<string> inventoryDocumentNos)
    {
        _logger.Information($"Start: RollbackCheckoutOrder for username: {userName}, " +
                            $"order id: {orderId}, " +
                            $"inventory document nos: {String.Join(", ", inventoryDocumentNos)}");

        var deletedDocumentNos = new List<string>();
        // 1. Delete Order by OrderId
        _logger.Information($"Start: Delete Order Id: {orderId}");
        await _orderHttpRepository.DeleteOrderAsync(orderId);
        _logger.Information($"End: Delete Order Id: {orderId}");

        foreach (var documentNo in inventoryDocumentNos)
        {
            // 2. Delete Inventory by DocumentNo
            await _inventoryHttpRepository.DeleteOrderByDocumentNoAsync(documentNo);
            deletedDocumentNos.Add(documentNo);
        }
        _logger.Information($"End: Deleted Inventory Document Nos: {String.Join(", ", inventoryDocumentNos)}");
    }
}
