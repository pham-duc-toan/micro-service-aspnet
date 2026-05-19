using Customer.API.Persistence;
using Customer.API.Repositories;
using Customer.API.Repositories.Interfaces;
using Customer.API.Services;
using Customer.API.Services.Interfaces;
using IdentityServer4.AccessTokenValidation;
using Infrastructure.Extensions;
using Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.OpenApi.Models;
using Shared.Configurations;

namespace Customer.API.Extensions;

public static class ServiceExtensions
{
    internal static IServiceCollection AddConfigurationSettings(this IServiceCollection services,
        IConfiguration configuration)
    {
        var databaseSettings = configuration.GetSection(nameof(DatabaseSettings))
            .Get<DatabaseSettings>();
        services.AddSingleton(databaseSettings);

        var hangfireSettings = configuration.GetSection(nameof(HangfireSettings))
            .Get<HangfireSettings>();
        services.AddSingleton(hangfireSettings);

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
        services.AddAutoMapper(cfg => cfg.AddProfile(new MappingProfile()));
        services.ConfigureCustomerContext();
        services.AddInfrastructureServices();
        services.ConfigAuthentication();
        services.ConfigAuthorization();

        return services;
    }

    public static void ConfigureCustomerContext(this IServiceCollection services)
    {
        var databaseSettings = services.GetOptions<DatabaseSettings>(nameof(DatabaseSettings));
        if (databaseSettings == null || string.IsNullOrEmpty(databaseSettings.ConnectionString))
            throw new ArgumentNullException("Connection string is not configured.");

        services.AddDbContext<CustomerContext>(
            options => options.UseNpgsql(databaseSettings.ConnectionString));
    }

    public static void AddInfrastructureServices(this IServiceCollection services)
    {
        services.AddScoped<ICustomerRepository, CustomerRepository>()
            .AddScoped<ICustomerService, CustomerService>();
    }

    private static void ConfigureHealthChecks(this IServiceCollection services)
    {
        var databaseSettings = services.GetOptions<DatabaseSettings>(nameof(DatabaseSettings));
        if (databaseSettings == null || string.IsNullOrEmpty(databaseSettings.ConnectionString))
            throw new ArgumentNullException("Connection string is not configured.");

        services.AddHealthChecks()
            .AddNpgSql(databaseSettings.ConnectionString,
                name: "Postgres Health",
                failureStatus: HealthStatus.Degraded);
    }

    public static IServiceCollection ConfigSwagger(this IServiceCollection service)
    {
        var apiConfigSetting = service.GetOptions<ApiConfigSetting>("ApiConfig");
        service.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo()
            {
                Title = "Customer",
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
