using IdentityServer4.AccessTokenValidation;
using Infrastructure.Extensions;
using Infrastructure.Identity;
using Inventory.Product.API.Services;
using Inventory.Product.API.Services.Interfaces;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.OpenApi.Models;
using MongoDB.Driver;
using Shared.Configurations;

namespace Inventory.Product.API.Extensions;

public static class ServiceExtensions
{
    internal static IServiceCollection AddConfigurationSettings(this IServiceCollection services,
        IConfiguration configuration)
    {
        var databaseSettings = configuration.GetSection(nameof(MongoDbSettings))
            .Get<MongoDbSettings>();
        services.AddSingleton(databaseSettings);

        var apiConfigSetting = configuration.GetSection("ApiConfig")
            .Get<ApiConfigSetting>();
        services.AddSingleton(apiConfigSetting ?? new ApiConfigSetting());

        services.ConfigureHealthChecks();

        return services;
    }

    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddControllers();
        services.Configure<RouteOptions>(options => options.LowercaseUrls = true);
        services.AddEndpointsApiExplorer();
        services.ConfigSwagger();
        services.ConfigureMongoDbClient();
        services.AddInfrastructureServices();
        services.ConfigAuthentication();
        services.ConfigAuthorization();

        return services;
    }

    private static string getMongoConnectionString(this IServiceCollection services)
    {
        var settings = services.GetOptions<MongoDbSettings>(nameof(MongoDbSettings));
        if (settings == null || string.IsNullOrEmpty(settings.ConnectionString))
            throw new ArgumentNullException("DatabaseSettings is not configured");

        var databaseName = settings.DatabaseName;
        var mongodbConnectionString = settings.ConnectionString + "/" + databaseName +
                                      "?authSource=admin";
        return mongodbConnectionString;
    }

    public static void ConfigureMongoDbClient(this IServiceCollection services)
    {
        services.AddSingleton<IMongoClient>(
            new MongoClient(getMongoConnectionString(services)))
            .AddScoped(x => x.GetService<IMongoClient>()?.StartSession());
    }

    public static void AddInfrastructureServices(this IServiceCollection services)
    {
        services.AddAutoMapper(cfg => cfg.AddProfile(new MappingProfile()));

        services.AddScoped<IInventoryService, InventoryService>();
    }

    private static void ConfigureHealthChecks(this IServiceCollection services)
    {
        var connectionString = getMongoConnectionString(services);

        services.AddHealthChecks()
            .AddMongoDb(connectionString,
                name: "MongoDb Health",
                failureStatus: HealthStatus.Degraded);
    }

    public static IServiceCollection ConfigSwagger(this IServiceCollection service)
    {
        var apiConfigSetting = service.GetOptions<ApiConfigSetting>("ApiConfig");
        service.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo()
            {
                Title = "Inventory",
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
