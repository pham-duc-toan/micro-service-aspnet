using Microsoft.AspNetCore.Mvc;

namespace Product.API.Controllers;

[ApiController]
[Route("/")]
public class HomeController : ControllerBase
{
  [HttpGet]
  public IActionResult Index()
  {
    return Redirect("~/swagger");
  }
}
