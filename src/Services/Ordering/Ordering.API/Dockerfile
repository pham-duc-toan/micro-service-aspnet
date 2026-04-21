#See https://aka.ms/customizecontainer to learn how to customize your debug container and how Visual Studio uses this Dockerfile to build your images for faster debugging.

FROM mcr.microsoft.com/dotnet/aspnet:6.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:6.0 AS build
WORKDIR /src
COPY ["Services/Ordering/Ordering.API/Ordering.API.csproj", "Services/Ordering/Ordering.API/"]
COPY ["BuildingBlocks/Common.Logging/Common.Logging.csproj", "BuildingBlocks/Common.Logging/"]
COPY ["Services/Ordering/Ordering.Application/Ordering.Application.csproj", "Services/Ordering/Ordering.Application/"]
COPY ["BuildingBlocks/Shared/Shared.csproj", "BuildingBlocks/Shared/"]
COPY ["Services/Ordering/Ordering.Domain/Ordering.Domain.csproj", "Services/Ordering/Ordering.Domain/"]
COPY ["BuildingBlocks/Contracts/Contracts.csproj", "BuildingBlocks/Contracts/"]
COPY ["Services/Ordering/Ordering.Infrastructure/Ordering.Infrastructure.csproj", "Services/Ordering/Ordering.Infrastructure/"]
COPY ["BuildingBlocks/Infrastructure/Infrastructure.csproj", "BuildingBlocks/Infrastructure/"]
COPY ["BuildingBlocks/EventBus/EventBus.MessageComponents/EventBus.MessageComponents.csproj", "BuildingBlocks/EventBus/EventBus.MessageComponents/"]
RUN dotnet restore "Services/Ordering/Ordering.API/./Ordering.API.csproj"
COPY . .
WORKDIR "Services/Ordering/Ordering.API"
RUN dotnet build "Ordering.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Ordering.API.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Ordering.API.dll"]