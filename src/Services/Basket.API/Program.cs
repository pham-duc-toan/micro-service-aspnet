using Basket.API.Extensions;
using Common.Logging;
using Serilog;
using Swashbuckle.AspNetCore.SwaggerUI;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

var builder = WebApplication.CreateBuilder(args);

Log.Information(messageTemplate: $"Start {builder.Environment.ApplicationName} up");

try
{
    builder.Host.UseSerilog(Serilogger.Configure);
    builder.Host.AddAppConfigurations();
    builder.Services.ConfigureServices();
    builder.Services.ConfigureRedis(builder.Configuration);

    builder.Services.Configure<RouteOptions>(options
        => options.LowercaseUrls = true);

    builder.Services.AddControllers();
    // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();

    var app = builder.Build();

    // Configure the HTTP request pipeline.
    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI((SwaggerUIOptions c) => c.SwaggerEndpoint(
            url: "/swagger/v1/swagger.json",
            name: $"{builder.Environment.ApplicationName} v1"));
    }

    // app.UseHttpsRedirection();

    app.UseAuthorization();

    app.MapDefaultControllerRoute();

    app.Run();
}
catch (Exception ex)
{
    string type = ex.GetType().Name;
    if (type.Equals(value: "StopTheHostException", StringComparison.Ordinal)) throw;

    Log.Fatal(ex, messageTemplate: $"Unhandled exception: {ex.Message}");
}
finally
{
    Log.Information(messageTemplate: $"Shut down {builder.Environment.ApplicationName} complete");
    Log.CloseAndFlush();
}
