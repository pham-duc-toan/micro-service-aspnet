
using Common.Logging;
using Contracts.Common.Interfaces;
using Customer.API.Persistence;
using Customer.API.Repositories;
using Customer.API.Repositories.Interfaces;
using Customer.API.Services;
using Customer.API.Services.Interfaces;
using Infrastructure.Common;
using Microsoft.EntityFrameworkCore;
using Serilog;

Log.Logger = new LoggerConfiguration().WriteTo.Console().CreateBootstrapLogger();
Log.Information("Starting Customer API up");

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog(Serilogger.Configure);
    // Add services to the container.

    builder.Services.AddDbContext<CustomerContext>(options =>
        options.UseNpgsql(builder.Configuration.GetConnectionString("CustomerDB")));

    builder.Services
        .AddScoped(typeof(IUnitOfWork<>), typeof(UnitOfWork<>))
        .AddScoped<ICustomerRepository, CustomerRepositoryAsync>()
        .AddScoped<ICustomerService, CustomerService>();

    builder.Services.AddControllers();
    // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();

    var app = builder.Build();

    // app.SeedCustomerData();

    // Configure the HTTP request pipeline.
    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    // app.UseHttpsRedirection();

    app.UseAuthorization();

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

    app.MapControllers();

    app.Run();
}
catch (Exception ex)
{
    string type = ex.GetType().Name;
    if (type.Equals("StopTheHostException", StringComparison.Ordinal))
    {
        throw;
    }

    Log.Fatal(ex, messageTemplate: $"Unhandled exception: {ex.Message}");
}
finally
{
    Log.Information("Shut down Customer API complete");
    Log.CloseAndFlush();
}

