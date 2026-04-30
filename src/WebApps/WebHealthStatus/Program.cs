using HealthChecks.UI.Client;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using WebHealthStatus.HealthChecks;

var builder = WebApplication.CreateBuilder(args);

// Allow gRPC over HTTP/2 without TLS for internal health checks.
AppContext.SetSwitch("System.Net.Http.SocketsHttpHandler.Http2UnencryptedSupport", true);

// Add services to the container.
builder.Services.AddControllersWithViews();
builder.Services.AddHealthChecksUI()
    .AddInMemoryStorage();
builder.Services.Configure<GrpcHealthCheckOptions>(
    builder.Configuration.GetSection("GrpcHealthChecks"));
builder.Services.AddSingleton<GrpcHealthStatusStore>();
builder.Services.AddHostedService<GrpcHealthCheckBackgroundService>();
builder.Services.AddHealthChecks()
    .AddCheck<GrpcAggregateHealthCheck>("grpc-health");

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();

app.UseEndpoints(x =>
{
    x.MapHealthChecks("/hc-grpc", new HealthCheckOptions
    {
        Predicate = registration => registration.Name == "grpc-health",
        ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
    });
    x.MapHealthChecksUI();
    x.MapControllerRoute(
        name: "default",
        pattern: "{controller=Home}/{action=Index}/{id?}");
});



app.Run();