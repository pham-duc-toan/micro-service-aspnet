using Contracts.ScheduledJobs;
using Contracts.Services;
using Hangfire.API.Services;
using Hangfire.API.Services.Interfaces;
using Infrastructure.Configurations;
using Infrastructure.ScheduleJobs;
using Infrastructure.Services;
using Shared.Configurations;

namespace Hangfire.API.Extensions;

public static class ServiceExtensions
{
    internal static void AddConfigurationSettings(this IServiceCollection services, IConfiguration configuration)
    {
        var hangFireSettings = configuration.GetSection(nameof(HangFireSettings)).Get<HangFireSettings>();
        services.AddSingleton(hangFireSettings);

        var emailSettings = configuration.GetSection(nameof(EmailSMTPSetting)).Get<EmailSMTPSetting>();
        services.AddSingleton(emailSettings);
    }

    internal static void ConfigureServices(this IServiceCollection services)
    {
        services.AddScoped<IScheduledJobService, HangfireService>()
                .AddScoped<IBackgroundJobService, BackgroundJobService>()
                .AddScoped<IEmailSMTPService, EmailSMTPService>();
    }
}
