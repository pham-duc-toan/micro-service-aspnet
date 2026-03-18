using Customer.API.Repositories.Interfaces;
using Customer.API.Services.Interfaces;

namespace Customer.API.Services;

public class CustomerService : ICustomerService
{
  private readonly ICustomerRepository _repository;

  public CustomerService(ICustomerRepository repository)
  {
    _repository = repository;
  }

  public async Task<IResult> GetCustomersAsync() =>
      Results.Ok(await _repository.GetCustomersAsync());

  public async Task<IResult> GetCustomerByIdAsync(int id)
  {
    var customer = await _repository.GetCustomerByIdAsync(id);
    return customer is null ? Results.NotFound() : Results.Ok(customer);
  }

  public async Task<IResult> GetCustomerByUsernameAsync(string username)
  {
    var customer = await _repository.GetCustomerByUserNameAsync(username);
    return customer is null ? Results.NotFound() : Results.Ok(customer);
  }

  public async Task<IResult> CreateCustomerAsync(Entities.Customer customer)
  {
    var createdCustomer = await _repository.CreateCustomerAsync(customer);
    return Results.Created($"/api/customers/{createdCustomer.Id}", createdCustomer);
  }

  public async Task<IResult> UpdateCustomerAsync(int id, Entities.Customer customer)
  {
    var isUpdated = await _repository.UpdateCustomerAsync(id, customer);
    return isUpdated ? Results.NoContent() : Results.NotFound();
  }

  public async Task<IResult> DeleteCustomerAsync(int id)
  {
    var isDeleted = await _repository.DeleteCustomerAsync(id);
    return isDeleted ? Results.NoContent() : Results.NotFound();
  }
}
