using Basket.API.Entities;
using Microsoft.Extensions.Caching.Distributed;

namespace Basket.API.Repositories.Interfaces
{
    public interface IBasketRepository
    {
        Task<Cart> GetBasketByUserNameAsync(string userName);
        Task<Cart> UpdateBasketAsync(Cart cart, DistributedCacheEntryOptions options = null);
        Task<bool> DeleteBasketFromUserNameAsync(string userName);
    }
}
