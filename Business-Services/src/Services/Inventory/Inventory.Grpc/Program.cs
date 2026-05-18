using Common.Logging;
using Grpc.Health.V1;
using Grpc.HealthCheck;
using Inventory.Grpc.Extensions;
using Inventory.Grpc.Services;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Serilog;

var builder = WebApplication.CreateBuilder(args);
builder.Host.UseSerilog(Serilogger.Configure);

Log.Information($"Start {builder.Environment.ApplicationName} up");

try
{

    // Add services to the container.
    builder.Services.AddConfigurationSettings(builder.Configuration);
    builder.Services.ConfigureMongoDbClient();
    builder.Services.AddInfrastructureServices();
    // Additional configuration is required to successfully run gRPC on macOS.
    // For instructions on how to configure Kestrel and gRPC clients on macOS, visit https://go.microsoft.com/fwlink/?linkid=2099682
    builder.Services.AddGrpc();
    builder.Services.AddHealthChecks();
    builder.Services.AddSingleton<HealthServiceImpl>();

    var runningInContainer = string.Equals(
        Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER"),
        "true",
        StringComparison.OrdinalIgnoreCase);

    if (!runningInContainer)
    {
        builder.WebHost.ConfigureKestrel(options =>
        {
            // Use h2c for local gRPC on http://localhost:6007
            options.ListenLocalhost(6007, o => o.Protocols = HttpProtocols.Http2);
        });
    }

    var app = builder.Build();

    // app.UseHttpsRedirection();
    // Configure the HTTP request pipeline.
    app.MapGrpcService<InventoryService>();
    app.MapGrpcService<HealthServiceImpl>();
    app.MapGet("/",
        () =>
            "Communication with gRPC endpoints must be made through a gRPC client. To learn how to create a client, visit: https://go.microsoft.com/fwlink/?linkid=2086909");
    app.MapHealthChecks("/hc");

    var healthService = app.Services.GetRequiredService<HealthServiceImpl>();
    healthService.SetStatus(string.Empty, HealthCheckResponse.Types.ServingStatus.Serving);
    app.Lifetime.ApplicationStopping.Register(() =>
        healthService.SetStatus(string.Empty, HealthCheckResponse.Types.ServingStatus.NotServing));

    app.Run();
}
catch (Exception ex)
{
    string type = ex.GetType().Name;
    if (type.Equals("StopTheHostException", StringComparison.Ordinal)) throw;

    Log.Fatal(ex, $"Unhandled exception: {ex.Message}");
}
finally
{
    Log.Information($"Shut down {builder.Environment.ApplicationName} complete");
    Log.CloseAndFlush();
}