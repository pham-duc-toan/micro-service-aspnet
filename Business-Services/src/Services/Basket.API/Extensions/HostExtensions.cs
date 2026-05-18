using Common.Logging;
using Serilog;

namespace Basket.API.Extensions;

public static class HostExtensions
{
    public static void AddAppConfigurations(this ConfigureHostBuilder host)
    {
        // WebApplicationBuilder already wires appsettings + env vars.
        // Keep only Serilog bootstrap to avoid mutating disposed config providers.
        host.UseSerilog(Serilogger.Configure);
    }
}