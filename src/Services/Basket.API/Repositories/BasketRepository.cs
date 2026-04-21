using Basket.API.Entities;
using Basket.API.Repositories.Interfaces;
using Basket.API.Services.Interfaces;
using Contracts.Common.Interfaces;
using Microsoft.Extensions.Caching.Distributed;
using ILogger = Serilog.ILogger;

namespace Basket.API.Repositories
{
    public class BasketRepository : IBasketRepository
    {
        private readonly IDistributedCache _redisCacheService;
        private readonly ISerializerService _serializerService;
        private readonly ILogger _logger;
        private readonly IBasketEmailService _basketEmailService;

        public BasketRepository(IDistributedCache redisCacheService, ISerializerService serializerService, ILogger logger, IBasketEmailService basketEmailService)
        {
            _redisCacheService = redisCacheService;
            _serializerService = serializerService;
            _logger = logger;
            _basketEmailService = basketEmailService;
        }

        public async Task<Cart?> GetBasketByUserNameAsync(string userName)
        {
            _logger.Information($"BEGIN: GetBasketByUserName {userName}");
            var cart = await _redisCacheService.GetStringAsync(userName);
            _logger.Information($"END: GetBasketByUserName {userName}");

            return string.IsNullOrEmpty(cart) ? null : _serializerService.Deserialize<Cart>(cart);
        }

        public async Task<Cart> UpdateBasketAsync(Cart cart, DistributedCacheEntryOptions options)
        {
            _logger.Information($"BEGIN: UpdateBasket for {cart.UserName}");
            var jsonCart = _serializerService.Serialize(cart);

            if (options != null)
            {
                await _redisCacheService.SetStringAsync(cart.UserName, jsonCart, options);
            }
            else
            {
                await _redisCacheService.SetStringAsync(cart.UserName, jsonCart);
            }

            _logger.Information($"END: UpdateBasket for {cart.UserName}");

            try
            {
                TriggerSendEmailReminderCheckoutOrder(cart);
            }
            catch (Exception ex)
            {
                _logger.Error($"UpdateBasket: {ex.Message}");
            }

            return await GetBasketByUserNameAsync(cart.UserName);
        }

        private void TriggerSendEmailReminderCheckoutOrder(Cart cart)
        {
            var emailContent = _basketEmailService.GenerateReminderCheckoutOrderEmail(cart.UserName);

            // Call hangfire api: send-reminder-email
        }

        public async Task<bool> DeleteBasketFromUserNameAsync(string userName)
        {
            try
            {
                _logger.Information($"BEGIN: DeleteBasketFromUserName {userName}");
                await _redisCacheService.RemoveAsync(userName);
                _logger.Information($"END: DeleteBasketFromUserName {userName}");

                return true;
            }
            catch (Exception e)
            {
                _logger.Error("Error DeleteBasketFromUserName: " + e.Message);
                throw;
            }
        }
    }
}
