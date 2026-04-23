using Contracts.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shared.DTOs.Identity;

namespace OcelotApiGw.Controllers;

[Route("api/[controller]")]
[ApiController]
public class TokenController : ControllerBase
{
    private readonly ITokenService _tokenService;

    public TokenController(ITokenService tokenService)
    {
        _tokenService = tokenService;
    }

    [HttpGet]
    [AllowAnonymous]
    public IActionResult GetToken([FromQuery] string role = "Admin")
    {
        var result = _tokenService.GetToken(new TokenRequest(role));
        return Ok(result);
    }
}
