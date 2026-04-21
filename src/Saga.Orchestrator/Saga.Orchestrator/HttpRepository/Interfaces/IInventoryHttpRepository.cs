using Shared.DTOs.Inventory;

namespace Saga.Orchestrator.HttpRepository.Interfaces;

public interface IInventoryHttpRepository
{
    Task<string> CreateSalesOrderAsync(SalesProductDto model);

    Task<bool> DeleteOrderByDocumentNoAsync(string documentNo);
}
