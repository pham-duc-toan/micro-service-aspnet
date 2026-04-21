using Infrastructure.ScheduleJobs;

namespace Customer.API.Extensions;

public static class ApplicationExtensions
{
    public static void UseInfrastructure(this IApplicationBuilder app, IConfiguration configuration)
    {
        app.UseSwagger();
        app.UseSwaggerUI();

        //app.UseHttpsRedirection();

        app.UseAuthorization();

        app.UseHangfireDashboard(configuration);
    }
}
