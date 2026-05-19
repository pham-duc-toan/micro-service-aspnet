using EventBus.Messages.IntegrationEvents.Events;
using IdentityServer4.AccessTokenValidation;
using Infrastructure.Configurations;
using Infrastructure.Extensions;
using Infrastructure.Identity;
using MassTransit;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.OpenApi.Models;
using Ordering.API.Application.IntegrationEvents.EventsHandler;
using Ordering.Application;
using Ordering.Infrastructure;
using Shared.Configurations;

namespace Ordering.API.Extensions;

public static class ServiceExtensions
{
    internal static IServiceCollection AddConfigurationSettings(this IServiceCollection services,
        IConfiguration configuration)
    {
        var emailSettings = configuration.GetSection(nameof(SMTPEmailSetting))
            .Get<SMTPEmailSetting>();
        services.AddSingleton(emailSettings);

        var databaseSettings = configuration.GetSection(nameof(DatabaseSettings))
            .Get<DatabaseSettings>();
        services.AddSingleton(databaseSettings);

        var eventBusSettings = configuration.GetSection(nameof(EventBusSettings))
            .Get<EventBusSettings>();
        services.AddSingleton(eventBusSettings);

        var apiConfigSetting = configuration.GetSection("ApiConfig")
            .Get<ApiConfigSetting>();
        services.AddSingleton(apiConfigSetting ?? new ApiConfigSetting());

        services.ConfigureHealthChecks();

        return services;
    }

    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddApplicationServices();
        services.AddInfrastructureServices();
        services.ConfigureMassTransit();
        services.AddControllers();
        services.Configure<RouteOptions>(options => options.LowercaseUrls = true);
        services.AddEndpointsApiExplorer();
        services.ConfigSwagger();
        services.ConfigAuthentication();
        services.ConfigAuthorization();

        return services;
    }

    public static void ConfigureMassTransit(this IServiceCollection services)
    {
        var settings = services.GetOptions<EventBusSettings>("EventBusSettings");
        if (settings == null || string.IsNullOrEmpty(settings.HostAddress))
            throw new ArgumentNullException("EventBusSetting is not configured");

        var mqConnection = new Uri(settings.HostAddress);
        services.TryAddSingleton(KebabCaseEndpointNameFormatter.Instance);
        services.AddMassTransit(config =>
        {
            config.AddConsumersFromNamespaceContaining<BasketCheckoutEventHandler>();
            config.UsingRabbitMq((ctx, cfg) =>
            {
                cfg.Host(mqConnection);
                // cfg.ReceiveEndpoint("basket-checkout-queue", c =>
                // {
                //     c.ConfigureConsumer<BasketCheckoutEventHandler>(ctx);
                // });

                cfg.ConfigureEndpoints(ctx);
            });
        });
    }

    private static void ConfigureHealthChecks(this IServiceCollection services)
    {
        var databaseSettings = services.GetOptions<DatabaseSettings>(nameof(DatabaseSettings));
        if (databaseSettings == null || string.IsNullOrEmpty(databaseSettings.ConnectionString))
            throw new ArgumentNullException("Connection string is not configured.");

        services.AddHealthChecks()
            .AddSqlServer(databaseSettings.ConnectionString,
                name: "SqlServer Health",
                failureStatus: HealthStatus.Degraded);
    }

    public static IServiceCollection ConfigSwagger(this IServiceCollection service)
    {
        var apiConfigSetting = service.GetOptions<ApiConfigSetting>("ApiConfig");
        service.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo()
            {
                Title = "Order",
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
