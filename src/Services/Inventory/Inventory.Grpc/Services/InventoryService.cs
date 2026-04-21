using Grpc.Core;
using Inventory.Grpc.Protos;
using Inventory.Grpc.Repositories.Interfaces;
using ILogger = Serilog.ILogger;

namespace Inventory.Grpc.Services;

public class InventoryService : StockProtoService.StockProtoServiceBase
{
    private readonly ILogger _logger;
    private readonly IInventoryRepository _inventoryRepository;

    public InventoryService(ILogger logger, IInventoryRepository inventoryRepository)
    {
        _logger = logger;
        _inventoryRepository = inventoryRepository;
    }

    public override async Task<StockModel> GetStock(GetStockRequest request, ServerCallContext context)
    {
        _logger.Information($"BEGIN Get Stock of ItemNo: {request.ItemNo}");

        var stockQuantity = await _inventoryRepository.GetStockQuantity(request.ItemNo);
        var result = new StockModel()
        {
            Quantity = stockQuantity
        };

        _logger.Information($"END Get Stock of ItemNo: {request.ItemNo} - Quantity: {result.Quantity}");

        return result;
    }
}
