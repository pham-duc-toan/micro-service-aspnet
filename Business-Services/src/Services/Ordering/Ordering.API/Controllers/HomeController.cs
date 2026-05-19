using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ordering.API.Controllers;

public class HomeController : ControllerBase
{
    // GET
    [AllowAnonymous]
    public IActionResult Index()
    {
        return Redirect("~/swagger");
    }
}
