using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Inventory.Product.API.Controllers;

public class HomeController : ControllerBase
{
    // GET
    [AllowAnonymous]
    public IActionResult Index()
    {
        return Redirect("~/swagger");
    }
}
