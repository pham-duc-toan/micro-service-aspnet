using Contracts.Common.Interfaces;
using Customer.API.Persistence;

namespace Customer.API.Repositories.Interfaces;

public interface ICustomerRepository
    : IRepositoryBaseAsync<Entities.Customer, int, CustomerContext>
{
  Task<IEnumerable<Entities.Customer>> GetCustomersAsync();

  Task<Entities.Customer?> GetCustomerByIdAsync(int id);

  Task<Entities.Customer?> GetCustomerByUserNameAsync(string username);

  Task<Entities.Customer> CreateCustomerAsync(Entities.Customer customer);

  Task<bool> UpdateCustomerAsync(int id, Entities.Customer customer);

  Task<bool> DeleteCustomerAsync(int id);
}
