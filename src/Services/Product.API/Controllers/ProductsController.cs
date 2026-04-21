using AutoMapper;
using Infrastructure.Identity.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Product.API.Entities;
using Product.API.Repositories.Interfaces;
using Shared.Common.Constants;
using Shared.DTOs.Product;

namespace Product.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize("Bearer")]
    public class ProductsController : ControllerBase
    {
        private readonly IProductRepository _productRepository;
        private readonly IMapper _mapper;
        //private static int count = 0;

        public ProductsController(IProductRepository productRepository, IMapper mapper)
        {
            _productRepository = productRepository;
            _mapper = mapper;
        }

        #region CRUD
        [HttpGet]
        [ClaimRequirement(FunctionCode.PRODUCT, CommandCode.VIEW)]
        public async Task<IActionResult> GetProductsAsync()
        {
            //count++;
            //if (count < 3)
            //{
            //    Thread.Sleep(5000);
            //}

            var products = await _productRepository.GetProductsAsync();
            var result = _mapper.Map<IEnumerable<ProductDto>>(products);
            return Ok(result);
        }

        [HttpGet("{id:long}")]
        [ClaimRequirement(FunctionCode.PRODUCT, CommandCode.VIEW)]
        public async Task<IActionResult> GetProductAsync(long id)
        {
            var product = await _productRepository.GetProductAsync(id);
            if (product == null) return NotFound();

            var result = _mapper.Map<ProductDto>(product);
            return Ok(result);
        }

        [HttpPost]
        [ClaimRequirement(FunctionCode.PRODUCT, CommandCode.CREATE)]
        public async Task<IActionResult> CreateProductAsync(CreateProductDto productDto)
        {
            var productEntity = await _productRepository.GetProductByNoAsync(productDto.No);
            if (productEntity != null) return BadRequest($"Product No: {productDto.No} is existed.");

            var product = _mapper.Map<CatalogProduct>(productDto);
            await _productRepository.CreateProductAsync(product);
            await _productRepository.SaveChangeAsync();
            var result = _mapper.Map<ProductDto>(product);
            return Ok(result);
        }

        [HttpPut("{id:long}")]
        [ClaimRequirement(FunctionCode.PRODUCT, CommandCode.UPDATE)]
        public async Task<IActionResult> UpdateProductAsync(long id, UpdateProductDto productDto)
        {
            var product = await _productRepository.GetProductAsync(id);
            if (product == null) return NotFound();

            var updateProduct = _mapper.Map(productDto, product);
            await _productRepository.UpdateProductAsync(updateProduct);
            await _productRepository.SaveChangeAsync();
            var result = _mapper.Map<CatalogProduct>(updateProduct);
            return Ok(result);
        }

        [HttpDelete("{id:long}")]
        [ClaimRequirement(FunctionCode.PRODUCT, CommandCode.DELETE)]
        public async Task<IActionResult> DeleteProductAsync(long id)
        {
            var product = await _productRepository.GetProductAsync(id);
            if (product == null) return NotFound();

            await _productRepository.DeleteProductAsync(id);
            await _productRepository.SaveChangeAsync();
            return NoContent();
        }
        #endregion

        #region Additional Resources
        [HttpGet("get-product-by-no/{productNo}")]
        [ClaimRequirement(FunctionCode.PRODUCT, CommandCode.VIEW)]
        public async Task<IActionResult> GetProductAsync(string productNo)
        {
            var product = await _productRepository.GetProductByNoAsync(productNo);
            if (product == null) return NotFound();

            var result = _mapper.Map<ProductDto>(product);
            return Ok(result);
        }
        #endregion

    }
}
