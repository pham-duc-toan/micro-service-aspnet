namespace WebHealthStatus.HealthChecks;

public class GrpcHealthCheckOptions
{
  public int IntervalSeconds { get; set; } = 10;
  public int TimeoutSeconds { get; set; } = 3;
  public List<GrpcHealthCheckTarget> Targets { get; set; } = new();
}

public class GrpcHealthCheckTarget
{
  public string Name { get; set; } = string.Empty;
  public string Address { get; set; } = string.Empty;
  public string Service { get; set; } = string.Empty;
}