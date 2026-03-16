using AutoMapper;
using Product.API.Entities;
using Microsoft.AspNetCore.Mvc;
using Product.API.Repositories.Interfaces;
using Shared.Dtos.Product;
using System.ComponentModel.DataAnnotations;

namespace Product.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
  private readonly IProductRepository _productRepository;
  private readonly IMapper _mapper;

  public ProductsController(IProductRepository productRepository, IMapper mapper)
  {
    _productRepository = productRepository;
    _mapper = mapper;
  }

  [HttpGet]
  public async Task<IActionResult> GetProducts()
  {
    var products = await _productRepository.GetProducts();
    var result = _mapper.Map<IEnumerable<ProductDto>>(products);
    return Ok(result);
  }

  [HttpGet("{id:long}")]
  public async Task<IActionResult> GetProduct([Required] long id)
  {
    try
    {
      var product = await _productRepository.GetProduct(id);
      var result = _mapper.Map<ProductDto>(product);
      return Ok(result);
    }
    catch (KeyNotFoundException ex)
    {
      return NotFound(new { message = ex.Message });
    }
  }

  [HttpGet("by-no/{productNo}")]
  public async Task<IActionResult> GetProductByNo([Required] string productNo)
  {
    try
    {
      var product = await _productRepository.GetProductByNo(productNo);
      var result = _mapper.Map<ProductDto>(product);
      return Ok(result);
    }
    catch (KeyNotFoundException ex)
    {
      return NotFound(new { message = ex.Message });
    }
  }

  [HttpPost]
  public async Task<IActionResult> CreateProduct([FromBody] CreateProductDto request)
  {
    var product = _mapper.Map<CatalogProduct>(request);

    await _productRepository.CreateProduct(product);
    await _productRepository.SaveChangesAsync();

    var result = _mapper.Map<ProductDto>(product);
    return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, result);
  }

  [HttpPut("{id:long}")]
  public async Task<IActionResult> UpdateProduct([Required] long id, [FromBody] UpdateProductDto request)
  {
    try
    {
      var existingProduct = await _productRepository.GetProduct(id);
      _mapper.Map(request, existingProduct);

      await _productRepository.UpdateProduct(existingProduct);
      await _productRepository.SaveChangesAsync();

      return NoContent();
    }
    catch (KeyNotFoundException ex)
    {
      return NotFound(new { message = ex.Message });
    }
  }

  [HttpDelete("{id:long}")]
  public async Task<IActionResult> DeleteProduct([Required] long id)
  {
    try
    {
      await _productRepository.DeleteProduct(id);
      await _productRepository.SaveChangesAsync();

      return NoContent();
    }
    catch (KeyNotFoundException ex)
    {
      return NotFound(new { message = ex.Message });
    }
  }
}