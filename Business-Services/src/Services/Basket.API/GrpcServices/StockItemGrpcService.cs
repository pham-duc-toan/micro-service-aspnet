namespace Basket.API.GrpcServices;

using Grpc.Core;
using Inventory.Grpc.Client;
using Microsoft.Extensions.Logging;
using Polly;
using Polly.Retry;

public class StockItemGrpcService
{
    private readonly StockProtoService.StockProtoServiceClient _stockProtoService;
    private readonly ILogger<StockItemGrpcService> _logger;
    private readonly AsyncRetryPolicy<StockModel> _retryPolicy;

    public StockItemGrpcService(
        StockProtoService.StockProtoServiceClient stockProtoService,
        ILogger<StockItemGrpcService> logger)
    {
        _stockProtoService = stockProtoService ?? throw new ArgumentNullException(nameof(stockProtoService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _retryPolicy = Policy<StockModel>
            .Handle<RpcException>()
            .RetryAsync(3);
    }

    public async Task<StockModel> GetStock(string itemNo)
    {
        try
        {
            _logger.LogInformation("Getting stock for item: {ItemNo}", itemNo);
            var stockItemRequest = new GetStockRequest { ItemNo = itemNo };
            return await _retryPolicy.ExecuteAsync(async () =>
            {
                var result = await _stockProtoService.GetStockAsync(stockItemRequest);
                if (result != null)
                    _logger.LogInformation("Getting stock for item: {ItemNo}", itemNo);
                return result;
            });

        }
        catch (RpcException e)
        {
            _logger.LogError(e, "Error getting stock for item: {ItemNo}", itemNo);
            Console.WriteLine("Errorrrrrrrrrrrrrr");
            return new StockModel
            {
                Quantity = -1
            };
        }
    }
}