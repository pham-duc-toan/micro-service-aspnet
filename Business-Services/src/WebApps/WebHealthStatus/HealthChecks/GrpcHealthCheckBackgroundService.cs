using Grpc.Health.V1;
using Grpc.Net.Client;
using Microsoft.Extensions.Options;

namespace WebHealthStatus.HealthChecks;

public class GrpcHealthCheckBackgroundService : BackgroundService
{
  private readonly ILogger<GrpcHealthCheckBackgroundService> _logger;
  private readonly IOptionsMonitor<GrpcHealthCheckOptions> _options;
  private readonly GrpcHealthStatusStore _store;

  public GrpcHealthCheckBackgroundService(
      ILogger<GrpcHealthCheckBackgroundService> logger,
      IOptionsMonitor<GrpcHealthCheckOptions> options,
      GrpcHealthStatusStore store)
  {
    _logger = logger;
    _options = options;
    _store = store;
  }

  protected override async Task ExecuteAsync(CancellationToken stoppingToken)
  {
    while (!stoppingToken.IsCancellationRequested)
    {
      var options = _options.CurrentValue;
      var interval = TimeSpan.FromSeconds(Math.Max(1, options.IntervalSeconds));
      var timeout = TimeSpan.FromSeconds(Math.Max(1, options.TimeoutSeconds));

      foreach (var target in options.Targets)
      {
        await CheckTargetAsync(target, timeout, stoppingToken);
      }

      await Task.Delay(interval, stoppingToken);
    }
  }

  private async Task CheckTargetAsync(
      GrpcHealthCheckTarget target,
      TimeSpan timeout,
      CancellationToken stoppingToken)
  {
    var name = string.IsNullOrWhiteSpace(target.Name) ? target.Address : target.Name;
    if (string.IsNullOrWhiteSpace(target.Address))
    {
      _store.Set(name, new GrpcHealthStatusEntry
      {
        Status = "Unhealthy",
        Description = "Missing gRPC address",
        LastChecked = DateTimeOffset.UtcNow
      });
      return;
    }

    try
    {
      using var channel = GrpcChannel.ForAddress(target.Address);
      var client = new Health.HealthClient(channel);
      using var cts = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
      cts.CancelAfter(timeout);

      var reply = await client.CheckAsync(new HealthCheckRequest
      {
        Service = target.Service ?? string.Empty
      }, cancellationToken: cts.Token);

      _store.Set(name, new GrpcHealthStatusEntry
      {
        Status = reply.Status.ToString(),
        Description = "gRPC health check",
        LastChecked = DateTimeOffset.UtcNow
      });
    }
    catch (Exception ex)
    {
      _logger.LogWarning(ex, "gRPC health check failed for {Target}", name);
      _store.Set(name, new GrpcHealthStatusEntry
      {
        Status = "Unhealthy",
        Description = ex.Message,
        LastChecked = DateTimeOffset.UtcNow
      });
    }
  }
}