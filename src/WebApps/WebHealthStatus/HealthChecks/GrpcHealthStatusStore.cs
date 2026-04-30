using System.Collections.Concurrent;

namespace WebHealthStatus.HealthChecks;

public class GrpcHealthStatusStore
{
  private readonly ConcurrentDictionary<string, GrpcHealthStatusEntry> _statuses = new();

  public IReadOnlyDictionary<string, GrpcHealthStatusEntry> GetAll()
  {
    return _statuses;
  }

  public void Set(string name, GrpcHealthStatusEntry entry)
  {
    _statuses.AddOrUpdate(name, entry, (_, _) => entry);
  }
}

public class GrpcHealthStatusEntry
{
  public string Status { get; set; } = "Unknown";
  public string Description { get; set; } = string.Empty;
  public DateTimeOffset LastChecked { get; set; } = DateTimeOffset.UtcNow;
}