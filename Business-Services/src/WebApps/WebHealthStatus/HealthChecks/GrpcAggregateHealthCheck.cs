using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace WebHealthStatus.HealthChecks;

public class GrpcAggregateHealthCheck : IHealthCheck
{
  private readonly GrpcHealthStatusStore _store;

  public GrpcAggregateHealthCheck(GrpcHealthStatusStore store)
  {
    _store = store;
  }

  public Task<HealthCheckResult> CheckHealthAsync(
      HealthCheckContext context,
      CancellationToken cancellationToken = default)
  {
    var entries = _store.GetAll();
    if (entries.Count == 0)
    {
      return Task.FromResult(HealthCheckResult.Degraded("No gRPC targets configured."));
    }

    var data = new Dictionary<string, object>();
    var overall = HealthStatus.Healthy;

    foreach (var (name, entry) in entries)
    {
      data[name] = new
      {
        entry.Status,
        entry.Description,
        entry.LastChecked
      };

      if (string.Equals(entry.Status, "NotServing", StringComparison.OrdinalIgnoreCase) ||
          string.Equals(entry.Status, "Unhealthy", StringComparison.OrdinalIgnoreCase))
      {
        overall = HealthStatus.Unhealthy;
      }
      else if (string.Equals(entry.Status, "Unknown", StringComparison.OrdinalIgnoreCase) &&
               overall != HealthStatus.Unhealthy)
      {
        overall = HealthStatus.Degraded;
      }
    }

    return Task.FromResult(new HealthCheckResult(overall, "gRPC health checks", data: data));
  }
}