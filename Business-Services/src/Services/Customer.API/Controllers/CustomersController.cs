using Customer.API.Services.Interfaces;
using Infrastructure.Identity.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shared.Common.Constants;

namespace Customer.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CustomersController : ControllerBase
{
    private readonly ICustomerService _customerService;

    public CustomersController(ICustomerService customerService)
    {
        _customerService = customerService;
    }

    [HttpGet("{username}")]
    [ClaimRequirement(FunctionCode.CUSTOMER, CommandCode.VIEW)]
    public async Task<IActionResult> GetCustomerByUsername(string username)
    {
        var result = await _customerService.GetCustomerByUsernameAsync(username);
        return result != null ? Ok(result) : NotFound();
    }
}
