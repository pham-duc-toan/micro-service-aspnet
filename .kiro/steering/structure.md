# Project Structure

```
├── aspnetcore-microservice.sln    # Solution file
├── global.json                     # .NET SDK version pinning
├── src/
│   ├── docker-compose.yml          # Container orchestration
│   ├── docker-compose.override.yml # Dev environment overrides
│   ├── ApiGateways/
│   │   └── OcelotApiGw/            # Ocelot API Gateway
│   ├── BuildingBlocks/             # Shared libraries referenced by services
│   │   ├── Common.Logging/         # Serilog configuration
│   │   ├── Contracts/              # Interfaces (repositories, services, domain)
│   │   ├── EvenBus.Messages/       # RabbitMQ event bus message contracts
│   │   ├── Infrastructures/        # Base implementations (UnitOfWork, serialization, email)
│   │   └── Shared/                 # DTOs, SeedWork, shared configurations
│   ├── Services/
│   │   ├── Basket.API/             # Simple CRUD service (Redis-backed)
│   │   ├── Customer.API/           # Simple CRUD service (PostgreSQL)
│   │   ├── Hangfire.API/           # Background job scheduling
│   │   ├── Inventory.Product.API/  # Inventory tracking (MongoDB)
│   │   ├── Ordering/               # Clean Architecture service
│   │   │   ├── Ordering.API/       #   API layer (controllers, startup)
│   │   │   ├── Ordering.Application/ # Application layer (CQRS, MediatR, validation)
│   │   │   ├── Ordering.Domain/    #   Domain layer (entities, enums, exceptions)
│   │   │   └── Ordering.Infrastructure/ # Infrastructure (EF Core, repositories, persistence)
│   │   └── Product.API/            # Simple CRUD service (MySQL)
│   └── WebApps/
│       └── WebHealthStatus/        # Health check dashboard
```

## Architecture Patterns

**Simple services** (Basket, Customer, Product, Inventory): Single-project APIs with
Controllers → Repositories → Database. Folders: `Controllers/`, `Entities/`, `Repositories/`, `Extensions/`, `Persistence/`.

**Complex services** (Ordering): Clean Architecture with four projects:
- Domain: Entities, enums, exceptions (no external dependencies)
- Application: CQRS commands/queries via MediatR, FluentValidation, AutoMapper, pipeline behaviors
- Infrastructure: EF Core DbContext, repository implementations, external service integrations
- API: Controllers, DI configuration, startup

## Conventions
- DI registration via static `ConfigureServices` extension methods in `Extensions/` folders
- Repository pattern with interfaces in `Repositories/Interfaces/` or `Contracts/`
- Top-level `Program.cs` (minimal hosting, no `Startup.cs`)
- Serilog bootstrap logger in `Program.cs` with try/catch/finally pattern
- Swagger enabled in Development environment
- Lowercase URL routing (`RouteOptions.LowercaseUrls = true`)
