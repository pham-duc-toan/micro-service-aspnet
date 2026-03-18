using Customer.API.Services.Interfaces;

namespace Customer.API.Controllers;

public static class CustomerEndpoints
{
  public static WebApplication MapCustomerEndpoints(this WebApplication app)
  {
    app.MapGet("/api/customers", (ICustomerService service) =>
        service.GetCustomersAsync());

    app.MapGet("/api/customers/{id:int}", (int id, ICustomerService service) =>
        service.GetCustomerByIdAsync(id));

    app.MapGet("/api/customers/username/{username}", (string username, ICustomerService service) =>
        service.GetCustomerByUsernameAsync(username));

    app.MapPost("/api/customers", (Customer.API.Entities.Customer customer, ICustomerService service) =>
        service.CreateCustomerAsync(customer));

    app.MapPut("/api/customers/{id:int}", (int id, Customer.API.Entities.Customer customer, ICustomerService service) =>
        service.UpdateCustomerAsync(id, customer));

    app.MapDelete("/api/customers/{id:int}", (int id, ICustomerService service) =>
        service.DeleteCustomerAsync(id));

    return app;
  }
}
