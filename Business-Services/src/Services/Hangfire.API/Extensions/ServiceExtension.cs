using Contracts.Configurations;
using Contracts.ScheduleJobs;
using Contracts.Services;
using Hangfire.API.Service;
using Hangfire.API.Service.Interface;
using IdentityServer4.AccessTokenValidation;
using Infrastructure.Configurations;
using Infrastructure.Extensions;
using Infrastructure.Identity;
using Infrastructure.ScheduleJob;
using Infrastructure.Services;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.OpenApi.Models;
using Shared.Configurations;

namespace Hangfire.API.Extensions;

public static class ServiceExtension
{
    internal static IServiceCollection AddConfigurationSettings(this IServiceCollection services,
        IConfiguration configuration)
    {
        var hangFireSettings = configuration.GetSection(nameof(HangfireSettings))
            .Get<HangfireSettings>();
        services.AddSingleton(hangFireSettings);

        var emailSettings = configuration.GetSection(nameof(SMTPEmailSetting))
            .Get<SMTPEmailSetting>();
        services.AddSingleton(emailSettings);

        var apiConfigSetting = configuration.GetSection("ApiConfig")
            .Get<ApiConfigSetting>();
        services.AddSingleton(apiConfigSetting ?? new ApiConfigSetting());

        services.ConfigureHealthChecks();

        return services;
    }

    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddHangfireService();
        services.ConfigureServices();
        services.AddControllers();
        services.Configure<RouteOptions>(options => options.LowercaseUrls = true);
        services.AddEndpointsApiExplorer();
        services.ConfigSwagger();
        services.ConfigAuthentication();
        services.ConfigAuthorization();

        return services;
    }

    public static IServiceCollection ConfigureServices(this IServiceCollection services)
        => services.AddTransient<IScheduleJobService, HangfireService>()
            .AddScoped<ISmtpEmailService, SmtpEmailService>()
            .AddScoped<IBackgroundJobService, BackgroundJobService>()
    ;

    private static void ConfigureHealthChecks(this IServiceCollection services)
    {
        var settings = services.GetOptions<HangfireSettings>(nameof(HangfireSettings));
        var connectionString = settings?.Storage?.ConnectionString;
        if (string.IsNullOrEmpty(connectionString))
            throw new ArgumentNullException("Hangfire storage connection string is not configured.");

        services.AddHealthChecks()
            .AddMongoDb(connectionString,
                name: "Hangfire Mongo Health",
                failureStatus: HealthStatus.Degraded);
    }

    public static IServiceCollection ConfigSwagger(this IServiceCollection service)
    {
        var apiConfigSetting = service.GetOptions<ApiConfigSetting>("ApiConfig");
        service.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo()
            {
                Title = "Hangfire",
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
