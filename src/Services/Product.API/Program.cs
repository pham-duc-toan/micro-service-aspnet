
using Common.Logging;
using Product.API.Extensions;
using Product.API.Persistence;
using Serilog;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;

Log.Logger = new LoggerConfiguration().WriteTo.Console().CreateBootstrapLogger();
Log.Information("Starting Product API up");

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.AddAppConfigurations();
    builder.Host.UseSerilog(Serilogger.Configure);
    builder.Services.AddInfrastructure(builder.Configuration);

    var app = builder.Build();

    app.UseInfrastructure();

    app.Lifetime.ApplicationStarted.Register(() =>
    {
        var server = app.Services.GetRequiredService<IServer>();
        var addressesFeature = server.Features.Get<IServerAddressesFeature>();
        var addresses = addressesFeature?.Addresses;

        if (addresses is null || addresses.Count == 0)
        {
            Log.Information("Swagger running on: {SwaggerUrl}", "http://localhost:5002/swagger/");
            return;
        }

        foreach (var address in addresses)
        {
            Log.Information("Swagger running on: {SwaggerUrl}", $"{address.TrimEnd('/')}/swagger");
        }
    });

    app.MigrateDatabase<ProductContext>((context, _) =>
    {
        ProductContextSeed.SeedProductAsync(context, Log.Logger).Wait();
    })
    .Run();
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
    Log.Information("Shut down Product API complete");
    Log.CloseAndFlush();
}

