# Tech Stack

## Runtime & Framework
- .NET 6 (SDK 6.0, `global.json` with `rollForward: latestMajor`)
- ASP.NET Core 6 Web API (minimal hosting model via top-level `Program.cs`)
- C# 10 with nullable reference types and implicit usings enabled

## Solution
- Solution file: `aspnetcore-microservice.sln`
- Build: `dotnet build aspnetcore-microservice.sln`
- Restore: `dotnet restore aspnetcore-microservice.sln`

## Databases & Data Access
| Service | Database | Provider |
|---------|----------|----------|
| Product.API | MySQL 8.0 | Pomelo.EntityFrameworkCore.MySql |
| Customer.API | PostgreSQL | Npgsql.EntityFrameworkCore.PostgreSQL |
| Ordering | SQL Server 2019 | Microsoft.EntityFrameworkCore.SqlServer |
| Basket.API | Redis | StackExchange.Redis + IDistributedCache |
| Inventory.Product.API | MongoDB | MongoDB driver |

## Key Libraries
- **Logging**: Serilog (Console, Debug, Environment enrichers)
- **API Docs**: Swashbuckle / Swagger
- **Mapping**: AutoMapper
- **Validation**: FluentValidation
- **CQRS/Mediator**: MediatR (Ordering service)
- **API Gateway**: Ocelot
- **Messaging**: RabbitMQ (EvenBus.Messages building block)
- **Email**: MailKit / MimeKit
- **Serialization**: Newtonsoft.Json
- **Scheduled Jobs**: Hangfire
- **Health Checks**: WebHealthStatus web app

## Containerization
- Docker Compose (`src/docker-compose.yml`, `src/docker-compose.override.yml`)
- Each service has its own `Dockerfile` targeting Linux
- Network: `tedu_microservices` (bridge driver)

## Common Commands
```bash
# Build entire solution
dotnet build aspnetcore-microservice.sln

# Build single service
dotnet build src/Services/Basket.API/Basket.API.csproj

# Run a service locally
dotnet run --project src/Services/Basket.API

# Docker Compose (from src/)
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d

# EF Core migrations (Ordering service example)
dotnet ef migrations add <Name> --project src/Services/Ordering/Ordering.Infrastructure --startup-project src/Services/Ordering/Ordering.API
```
