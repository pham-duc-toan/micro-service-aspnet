using AutoMapper;
using Basket.API.Entities;
using Basket.API.Repositories.Interfaces;
using EventBus.MessageComponents.Consumers.Basket;
using MassTransit;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;
using System.Net;

namespace Basket.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BasketsController : ControllerBase
    {
        private readonly IBasketRepository _basketRepository;
        private readonly IMapper _mapper;
        private readonly IPublishEndpoint _publicEndpoint;

        public BasketsController(IBasketRepository basketRepository, IMapper mapper, IPublishEndpoint publicEndpoint)
        {
            _basketRepository = basketRepository;
            _mapper = mapper;
            _publicEndpoint = publicEndpoint;
        }

        [HttpGet("{userName}")]
        [ProducesResponseType(typeof(Cart), (int)HttpStatusCode.OK)]
        public async Task<ActionResult<Cart>> GetBasketAsync(string userName)
        {
            var result = await _basketRepository.GetBasketByUserNameAsync(userName);
            return Ok(result ?? new Cart(userName));
        }

        [HttpPost]
        [ProducesResponseType(typeof(Cart), (int)HttpStatusCode.OK)]
        public async Task<ActionResult<Cart>> UpdateBasketAsync(Cart cart)
        {
            //a cached object will be expired if it not being requested for a defined amount of time period.
            var options = new DistributedCacheEntryOptions()
                    .SetAbsoluteExpiration(DateTime.UtcNow.AddMinutes(10))
                    .SetSlidingExpiration(TimeSpan.FromMinutes(2));

            var result = await _basketRepository.UpdateBasketAsync(cart, options);
            return Ok(result);
        }

        [HttpDelete("{userName}")]
        [ProducesResponseType(typeof(bool), (int)HttpStatusCode.OK)]
        public async Task<ActionResult<bool>> DeleteBasketAsync(string userName)
        {
            var result = await _basketRepository.DeleteBasketFromUserNameAsync(userName);
            return Ok(result);
        }

        [Route("[action]")]
        [HttpPost]
        [ProducesResponseType((int)HttpStatusCode.Accepted)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<ActionResult> CheckoutAsync(BasketCheckout basketCheckout)
        {
            var basket = await _basketRepository.GetBasketByUserNameAsync(basketCheckout.UserName);
            if (basket == null) return NotFound();

            // publish checkout event to EventBus Message
            var eventMessage = _mapper.Map<BasketCheckoutEvent>(basketCheckout);
            eventMessage.TotalPrice = basket.TotalPrice;
            await _publicEndpoint.Publish(eventMessage);

            // remove the basket
            // await _basketRepository.DeleteBasketFromUserName(basket.Username);

            return Accepted();
        }
    }
}
