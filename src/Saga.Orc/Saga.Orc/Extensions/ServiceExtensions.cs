using Common.Logging;
using Contracts.Saga.OrderManager;
using Microsoft.Extensions.Configuration;
using Saga.Orc.HttpRepositories;
using Saga.Orc.HttpRepositories.Interfaces;
using Saga.Orc.OrderManager;
using Saga.Orc.Services;
using Saga.Orc.Services.Interfaces;
using Shared.DTOs.Basket;

namespace Saga.Orc.Extensions;

public static class ServiceExtensions
{
    public static void ConfigureServices(this IServiceCollection services)
    {
        services.AddTransient<ICheckoutSagaService, CheckoutSagaService>();
        services.AddTransient<ISagaOrderManager<BasketCheckoutDto, OrderResponse>, SagaOrderManager>()
            .AddTransient<LoggingDelegatingHandler>();
    }

    public static void ConfigureHttpRepository(this IServiceCollection services)
    {
        services.AddScoped<IOrderHttpRepository, OrderHttpRepository>();
        services.AddScoped<IBasketHttpRepository, BasketHttpRepository>();
        services.AddScoped<IInventoryHttpRepository, InventoryHttpRepository>();
    }

    public static void ConfigureHttpClients(this IServiceCollection services, IConfiguration configuration)
    {
        ConfigureInventoryHttp(services, configuration);
        ConfigureOrderHttp(services, configuration);
        ConfigureBasketHttp(services, configuration);
    }

    private static void ConfigureOrderHttp(this IServiceCollection services, IConfiguration configuration)
    {
        var baseUrl = configuration["ServiceUrls:Ordering"] ?? "http://localhost:6005/api/v1/";
        services.AddHttpClient<IOrderHttpRepository, OrderHttpRepository>("OrdersAPI", (provider, client) =>
        {
            client.BaseAddress = new Uri(baseUrl);
        }).AddHttpMessageHandler<LoggingDelegatingHandler>();
        services.AddScoped(sp => sp.GetService<IHttpClientFactory>().CreateClient("OrdersAPI"));
    }

    private static void ConfigureBasketHttp(this IServiceCollection services, IConfiguration configuration)
    {
        var baseUrl = configuration["ServiceUrls:Basket"] ?? "http://localhost:6004/api/";
        services.AddHttpClient<IBasketHttpRepository, BasketHttpRepository>("BasketsAPI", (provider, client) =>
        {
            client.BaseAddress = new Uri(baseUrl);
        }).AddHttpMessageHandler<LoggingDelegatingHandler>();
        services.AddScoped(sp => sp.GetService<IHttpClientFactory>().CreateClient("BasketsAPI"));
    }

    private static void ConfigureInventoryHttp(this IServiceCollection services, IConfiguration configuration)
    {
        var baseUrl = configuration["ServiceUrls:Inventory"] ?? "http://localhost:6006/api/";
        services.AddHttpClient<IInventoryHttpRepository, InventoryHttpRepository>("InventoryAPI", (provider, client) =>
        {
            client.BaseAddress = new Uri(baseUrl);
        }).AddHttpMessageHandler<LoggingDelegatingHandler>();
        services.AddScoped(sp => sp.GetService<IHttpClientFactory>().CreateClient("InventoryAPI"));
    }
}