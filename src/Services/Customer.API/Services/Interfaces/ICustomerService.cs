namespace Customer.API.Services.Interfaces;

public interface ICustomerService
{
  Task<IResult> GetCustomersAsync();

  Task<IResult> GetCustomerByIdAsync(int id);

  Task<IResult> GetCustomerByUsernameAsync(string username);

  Task<IResult> CreateCustomerAsync(Entities.Customer customer);

  Task<IResult> UpdateCustomerAsync(int id, Entities.Customer customer);

  Task<IResult> DeleteCustomerAsync(int id);
}
