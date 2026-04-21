using Contracts.ScheduledJobs;
using Infrastructure.ScheduleJobs;
using Shared.Configurations;

namespace Hangfire.API.Extensions;

public static class ServiceExtensions
{
    internal static void AddConfigurationSettings(this IServiceCollection services, IConfiguration configuration)
    {
        var hangFireSettings = configuration.GetSection(nameof(HangFireSettings)).Get<HangFireSettings>();
        services.AddSingleton(hangFireSettings);
    }

    internal static void ConfigureServices(this IServiceCollection services)
    {
        services.AddScoped<IScheduledJobService, HangfireService>();
    }
}
