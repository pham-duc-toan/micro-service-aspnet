using Contracts.Common.Interfaces;
using Customer.API.Persistence;
using Customer.API.Repositories.Interfaces;
using Infrastructure.Common;
using Microsoft.EntityFrameworkCore;

namespace Customer.API.Repositories;

public class CustomerRepositoryAsync
    : RepositoryBaseAsync<Entities.Customer, int, CustomerContext>, ICustomerRepository
{
  public CustomerRepositoryAsync(CustomerContext dbContext,
      IUnitOfWork<CustomerContext> unitOfWork) : base(dbContext, unitOfWork)
  {
  }

  public async Task<IEnumerable<Entities.Customer>> GetCustomersAsync() =>
          await FindAll()
                  .OrderBy(x => x.Id)
                  .ToListAsync();

  public Task<Entities.Customer?> GetCustomerByIdAsync(int id) =>
          GetByIdAsync(id);

  public Task<Entities.Customer?> GetCustomerByUserNameAsync(string username) =>
      FindByCondition(expression: x => x.UserName.Equals(username))
          .SingleOrDefaultAsync();

  public async Task<Entities.Customer> CreateCustomerAsync(Entities.Customer customer)
  {
    _ = await CreateAsync(customer);
    _ = await SaveChangesAsync();
    return customer;
  }

  public async Task<bool> UpdateCustomerAsync(int id, Entities.Customer customer)
  {
    var existingCustomer = await GetByIdAsync(id);
    if (existingCustomer is null)
      return false;

    existingCustomer.UserName = customer.UserName;
    existingCustomer.FirstName = customer.FirstName;
    existingCustomer.LastName = customer.LastName;
    existingCustomer.EmailAddress = customer.EmailAddress;

    await UpdateAsync(existingCustomer);
    _ = await SaveChangesAsync();
    return true;
  }

  public async Task<bool> DeleteCustomerAsync(int id)
  {
    var existingCustomer = await GetByIdAsync(id);
    if (existingCustomer is null)
      return false;

    await DeleteAsync(existingCustomer);
    _ = await SaveChangesAsync();
    return true;
  }
}
