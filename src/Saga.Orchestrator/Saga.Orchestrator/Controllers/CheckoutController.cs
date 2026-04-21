using Microsoft.AspNetCore.Mvc;
using Saga.Orchestrator.Services.Interfaces;
using Shared.DTOs.Basket;

namespace Saga.Orchestrator.Controllers;

[Route("api/[controller]")]
[ApiController]
public class CheckoutController : ControllerBase
{
    private readonly ICheckoutService _checkoutService;

    public CheckoutController(ICheckoutService checkoutService)
    {
        _checkoutService = checkoutService;
    }

    [HttpPost]
    [Route("{userName}")]
    public async Task<IActionResult> CheckoutOrder(string userName, BasketCheckoutDto model)
    {
        var result = await _checkoutService.CheckoutOrderAsync(userName, model);
        return Ok(result);
    }
}
