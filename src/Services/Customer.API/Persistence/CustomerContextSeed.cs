using Microsoft.EntityFrameworkCore;

namespace Customer.API.Persistence;

public static class CustomerContextSeed
{
  public static IHost SeedCustomerData(this IHost host)
  {
    using var scope = host.Services.CreateScope();
    var customerContext = scope.ServiceProvider.GetRequiredService<CustomerContext>();

    customerContext.Database.MigrateAsync().GetAwaiter().GetResult();

    CreateCustomer(
        customerContext,
        username: "customer1",
        firstName: "customer1",
        lastName: "customer",
        email: "customer1@local.com").GetAwaiter().GetResult();

    CreateCustomer(
        customerContext,
        username: "customer2",
        firstName: "customer2",
        lastName: "customer",
        email: "customer2@local.com").GetAwaiter().GetResult();

    return host;
  }

  private static async Task CreateCustomer(CustomerContext customerContext, string username, string firstName, string lastName, string email)
  {
    var customer = await customerContext.Customers
        .SingleOrDefaultAsync(x => x.UserName.Equals(username) ||
                                   x.EmailAddress.Equals(email));

    if (customer == null)
    {
      var newCustomer = new Entities.Customer
      {
        UserName = username,
        FirstName = firstName,
        LastName = lastName,
        EmailAddress = email
      };

      await customerContext.Customers.AddAsync(newCustomer);
      await customerContext.SaveChangesAsync();
    }
  }
}
