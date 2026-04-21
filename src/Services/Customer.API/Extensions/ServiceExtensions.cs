using Contracts.Common.Interfaces;
using Customer.API.Persistence;
using Customer.API.Repositories;
using Customer.API.Repositories.Interfaces;
using Customer.API.Services;
using Customer.API.Services.Interfaces;
using Infrastructure.Common;
using Infrastructure.ScheduleJobs;
using Microsoft.EntityFrameworkCore;

namespace Customer.API.Extensions
{
    public static class ServiceExtensions
    {
        public static void AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddControllers();
            services.AddEndpointsApiExplorer();
            services.AddSwaggerGen();
            services.AddDatabaseDeveloperPageExceptionFilter();

            services.ConfigureCustomerDbContext(configuration);
            services.AddInfrastructureService();
            services.AddHangfireService();
        }

        private static void ConfigureCustomerDbContext(this IServiceCollection services, IConfiguration configuration)
        {
            var connectionString = configuration.GetConnectionString("DefaultConnectionString");

            services.AddDbContext<CustomerContext>(options => options.UseNpgsql(connectionString));
        }

        private static void AddInfrastructureService(this IServiceCollection services)
        {
            services.AddScoped(typeof(IRepositoryBaseAsync<,,>), typeof(RepositoryBaseAsync<,,>))
                    .AddScoped(typeof(IUnitOfWork<>), typeof(UnitOfWork<>))
                    .AddScoped<ICustomerRepository, CustomerRepository>()
                    .AddScoped<ICustomerService, CustomerService>();
        }
    }
}
