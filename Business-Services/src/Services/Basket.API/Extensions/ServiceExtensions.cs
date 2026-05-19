using Basket.API.GrpcServices;
using Basket.API.Repositories;
using Basket.API.Repositories.Interfaces;
using Basket.API.Service;
using Basket.API.Service.Interface;
using Common.Logging;
using Contracts.Common.Interfaces;
using EventBus.Messages.IntegrationEvents.Events;
using IdentityServer4.AccessTokenValidation;
using Infrastructure.Common;
using Infrastructure.Extensions;
using Infrastructure.Identity;
using Infrastructure.Policies;
using Inventory.Grpc.Client;
using MassTransit;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.OpenApi.Models;
using Shared.Configurations;

namespace Basket.API.Extensions;

public static class ServiceExtensions
{
    internal static IServiceCollection AddConfigurationSettings(this IServiceCollection services,
        IConfiguration configuration)
    {
        var eventBusSettings = configuration.GetSection(nameof(EventBusSettings))
            .Get<EventBusSettings>();
        services.AddSingleton(eventBusSettings);

        var cacheSettings = configuration.GetSection(nameof(CacheSettings))
            .Get<CacheSettings>();
        services.AddSingleton(cacheSettings);

        services.ConfigureHealthChecks();

        var grpcSettings = configuration.GetSection(nameof(GrpcSettings))
            .Get<GrpcSettings>();
        services.AddSingleton(grpcSettings);

        var backgroundJob = configuration.GetSection(nameof(BackgroundJobSettings))
            .Get<BackgroundJobSettings>();
        services.AddSingleton(backgroundJob);

        var apiConfigSetting = configuration.GetSection("ApiConfig")
            .Get<ApiConfigSetting>();
        services.AddSingleton(apiConfigSetting ?? new ApiConfigSetting());

        return services;
    }

    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.ConfigureHttpClientService();
        services.AddAutoMapper(cfg => cfg.AddProfile(new MappingProfile()));
        services.ConfigureServices();
        services.ConfigureRedis();
        services.ConfigureGrpcService();
        services.Configure<RouteOptions>(options => options.LowercaseUrls = true);
        services.ConfigureMassTransit();
        services.AddControllers();
        services.AddEndpointsApiExplorer();
        services.ConfigSwagger();
        services.ConfigAuthentication();
        services.ConfigAuthorization();

        return services;
    }

    public static IServiceCollection ConfigureServices(this IServiceCollection services) =>
        services.AddScoped<IBasketRepository, BasketRepository>()
            .AddTransient<ISerializeService, SerializeService>()
            .AddTransient<IEmailTemplateService, BasketEmailTemplateService>()
            .AddTransient<LoggingDelegatingHandler>();

    public static IServiceCollection ConfigureGrpcService(this IServiceCollection services)
    {
        var settings = services.GetOptions<GrpcSettings>(nameof(GrpcSettings));
        services.AddGrpcClient<StockProtoService.StockProtoServiceClient>(x =>
            x.Address = new Uri(settings.StockUrl));
        services.AddScoped<StockItemGrpcService>();
        return services;
    }

    public static void ConfigureRedis(this IServiceCollection services)
    {
        var settings = services.GetOptions<CacheSettings>(nameof(CacheSettings));
        if (string.IsNullOrEmpty(settings.ConnectionString))
            throw new ArgumentNullException("Redis Connection string is not configured.");

        //Redis Configuration
        services.AddStackExchangeRedisCache(options =>
        {
            options.Configuration = settings.ConnectionString;
        });
    }

    public static void ConfigureMassTransit(this IServiceCollection services)
    {
        var settings = services.GetOptions<EventBusSettings>(nameof(EventBusSettings));
        if (settings == null || string.IsNullOrEmpty(settings.HostAddress) ||
            string.IsNullOrEmpty(settings.HostAddress)) throw new ArgumentNullException("EventBusSettings is not configured!");

        var mqConnection = new Uri(settings.HostAddress);

        services.TryAddSingleton(KebabCaseEndpointNameFormatter.Instance);
        services.AddMassTransit(config =>
        {
            config.UsingRabbitMq((ctx, cfg) =>
            {
                cfg.Host(mqConnection);
            });
            // Publish submit order message, instead of sending it to a specific queue directly.
            config.AddRequestClient<IBasketCheckoutEvent>();
        });
    }

    public static void ConfigureHttpClientService(this IServiceCollection services)
    {
        services.AddHttpClient<BackgroundJobHttpService>()
            .AddHttpMessageHandler<LoggingDelegatingHandler>()
            .UseImmediateHttpRetryPolicy()
            .UseCircuitHttpRetryPolicy()
            .ConfigureTimeoutPolicy();
    }

    private static void ConfigureHealthChecks(this IServiceCollection services)
    {
        var cacheSettings = services.GetOptions<CacheSettings>(nameof(CacheSettings));
        if (cacheSettings == null || string.IsNullOrEmpty(cacheSettings.ConnectionString))
            throw new ArgumentNullException("Redis Connection string is not configured.");

        services.AddHealthChecks()
            .AddRedis(cacheSettings.ConnectionString,
                name: "Redis Health",
                failureStatus: HealthStatus.Degraded);
    }

    public static IServiceCollection ConfigSwagger(this IServiceCollection service)
    {
        var apiConfigSetting = service.GetOptions<ApiConfigSetting>("ApiConfig");
        service.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo()
            {
                Title = "Basket",
                Version = "v1",
                Contact = new OpenApiContact()
                {
                    Email = "123@gmail.com",
                    Name = "Identity Service"
                }
            });
            c.AddSecurityDefinition(IdentityServerAuthenticationDefaults.AuthenticationScheme, new OpenApiSecurityScheme
            {
                Type = SecuritySchemeType.OAuth2,
                Flows = new OpenApiOAuthFlows
                {
                    Implicit = new OpenApiOAuthFlow
                    {
                        AuthorizationUrl = new Uri($"{apiConfigSetting.IdentityServerBaseUrl}/connect/authorize"),
                        Scopes = new Dictionary<string, string>
                        {
                            {"tedu_microservices_api.read", "Read Scope"},
                            {"tedu_microservices_api.write", "Write Scope"}
                        }
                    }
                }
            });
            c.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference{ Type = ReferenceType.SecurityScheme,Id = IdentityServerAuthenticationDefaults.AuthenticationScheme},
                        Name="Bearer",
                    },
                    new List<string>
                    {
                        "tedu_microservices_api.read",
                        "tedu_microservices_api.write"
                    }
                }
            });
        });
        return service;
    }
}
