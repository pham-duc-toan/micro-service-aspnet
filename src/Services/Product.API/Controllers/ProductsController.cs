using Microsoft.AspNetCore.Mvc;
using Product.API.Repositories.Interfaces;

namespace Product.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
  private readonly IProductRepository _productRepository;

  public ProductsController(IProductRepository productRepository)
  {
    _productRepository = productRepository;
  }

  [HttpGet]
  public async Task<IActionResult> GetProducts()
  {
    var result = await _productRepository.GetProducts();
    return Ok(result);
  }
}