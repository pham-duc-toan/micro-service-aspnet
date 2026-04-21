using Inventory.Product.API.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Shared.DTOs.Inventory;

namespace Inventory.Product.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class InventoryController : ControllerBase
{
    private readonly IInventoryService _inventoryService;

    public InventoryController(IInventoryService inventoryService)
    {
        _inventoryService = inventoryService;
    }

    [Route("items/{itemNo}", Name = "GetAllByItemNo")]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<InventoryEntryDto>>> GetAllByItemNo(string itemNo)
    {
        var result = await _inventoryService.GetAllByItemNoAsync(itemNo);
        return Ok(result);
    }

    [Route("items/{itemNo}/paging", Name = "GetAllByItemNoPaging")]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<InventoryEntryDto>>> GetAllByItemNoPaging(string itemNo, [FromQuery] GetInventoryPagingQuery query)
    {
        query.SetItemNo(itemNo);
        var result = await _inventoryService.GetAllByItemNoPagingAsync(query);
        return Ok(result);
    }

    [HttpPost("purchase/{itemNo}", Name = "PurchaseOrder")]
    public async Task<ActionResult<InventoryEntryDto>> PurchaseOrder(string itemNo, PurchaseProductDto model)
    {
        var result = await _inventoryService.PurchaseItemAsync(itemNo, model);
        return Ok(result);
    }

    [Route("{id}", Name = "GetInventoryById")]
    [HttpGet]
    public async Task<ActionResult<InventoryEntryDto>> GetInventoryById(string id)
    {
        var result = await _inventoryService.GetInventoryByIdAsync(id);
        return Ok(result);
    }

    [Route("{id}", Name = "DeleteInventoryById")]
    [HttpDelete]
    public async Task<ActionResult> DeleteInventoryById(string id)
    {
        var entity = await _inventoryService.GetInventoryByIdAsync(id);
        if (entity == null) return NotFound();

        await _inventoryService.DeleteAsync(id);
        return NoContent();
    }

    [HttpPost("sales/{itemNo}", Name = "SalesItem")]
    public async Task<ActionResult<InventoryEntryDto>> SalesItem(string itemNo, SalesProductDto model)
    {
        var result = await _inventoryService.SalesItemAsync(itemNo, model);
        return Ok(result);
    }

    [HttpPost("sales/order-no/{orderNo}", Name = "SalesOrder")]
    public async Task<ActionResult<InventoryEntryDto>> SalesOrder(string orderNo, SalesOrderDto model)
    {
        model.OrderNo = orderNo;
        var documentNo = await _inventoryService.SalesOrderAsync(model);
        var result = new CreatedSalesOrderSuccessDto(documentNo);
        return Ok(result);
    }

    [HttpDelete("document-no/{documentNo}", Name = "DeleteByDocumentNo")]
    public async Task<IActionResult> DeleteByDocumentNo(string documentNo)
    {
        await _inventoryService.DeleteByDocumentNoAsync(documentNo);
        return NoContent();
    }
}
