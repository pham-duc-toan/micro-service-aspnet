namespace Product.API.Extensions;

public static class ApplicationExtensions
{
    public static void UseInfrastructure(this IApplicationBuilder app)
    {
        var env = app.ApplicationServices.GetRequiredService<IWebHostEnvironment>();

        if (env.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        app.UseRouting();
        //app.UseHttpsRedirection();
        app.UseAuthorization();

        app.UseEndpoints(endpoints =>
        {
            endpoints.MapControllers();
        });
    }
}
