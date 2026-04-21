using Basket.API.Entities;
using Basket.API.Repositories.Interfaces;
using Basket.API.Services.Interfaces;
using Contracts.Common.Interfaces;
using Contracts.ScheduledJobs;
using Microsoft.Extensions.Caching.Distributed;
using Shared.DTOs.ScheduledJob;
using ILogger = Serilog.ILogger;

namespace Basket.API.Repositories
{
    public class BasketRepository : IBasketRepository
    {
        private readonly IDistributedCache _redisCacheService;
        private readonly ISerializerService _serializerService;
        private readonly ILogger _logger;
        private readonly IBasketEmailService _basketEmailService;
        private readonly IScheduledJobsClient _scheduledJobsClient;

        public BasketRepository(IDistributedCache redisCacheService, ISerializerService serializerService, ILogger logger, IBasketEmailService basketEmailService, IScheduledJobsClient scheduledJobsClient)
        {
            _redisCacheService = redisCacheService;
            _serializerService = serializerService;
            _logger = logger;
            _basketEmailService = basketEmailService;
            _scheduledJobsClient = scheduledJobsClient;
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
            await DeleteReminderCheckoutOrder(cart.UserName);

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
                await TriggerSendEmailReminderCheckoutOrder(cart);
            }
            catch (Exception ex)
            {
                _logger.Error($"UpdateBasket: {ex.Message}");
            }

            return await GetBasketByUserNameAsync(cart.UserName);
        }

        private async Task DeleteReminderCheckoutOrder(string userName)
        {
            var cart = await GetBasketByUserNameAsync(userName);
            if (cart == null || string.IsNullOrEmpty(cart.JobId)) return;

            await _scheduledJobsClient.DeleteJobAsync(cart.JobId);
        }

        private async Task TriggerSendEmailReminderCheckoutOrder(Cart cart)
        {
            var emailContent = _basketEmailService.GenerateReminderCheckoutOrderEmail(cart.UserName);

            var model = new ReminderEmailDto(cart.EmailAddress, "Reminder checkout", emailContent, DateTimeOffset.UtcNow.AddMinutes(1));

            var jobId = await _scheduledJobsClient.SendReminderEmailAsync(model);
            if (!string.IsNullOrEmpty(jobId))
            {
                cart.JobId = jobId;
                await _redisCacheService.SetStringAsync(cart.UserName, _serializerService.Serialize(cart));
            }
        }

        public async Task<bool> DeleteBasketFromUserNameAsync(string userName)
        {
            try
            {
                await DeleteReminderCheckoutOrder(userName);

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
