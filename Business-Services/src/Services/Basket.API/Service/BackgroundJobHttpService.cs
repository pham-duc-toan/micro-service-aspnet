using Infrastructure.Extensions;
using Shared.Configurations;
using Shared.DTOs.ScheduleJob;

namespace Basket.API.Service;

public class BackgroundJobHttpService
{
    public HttpClient Client { get; }

    public string ScheduledJobUrl { get; }

    public BackgroundJobHttpService(
        HttpClient client,
        BackgroundJobSettings settings)
    {
        if (settings == null ||
            string.IsNullOrEmpty(settings.HangfireUrl) ||
            string.IsNullOrEmpty(settings.ScheduledJobUrl))
            throw new ArgumentNullException($"{nameof(BackgroundJobSettings)} is not configured properly");

        client.BaseAddress = new Uri(settings.HangfireUrl);
        client.DefaultRequestHeaders.Clear();
        client.DefaultRequestHeaders.Add("Accept", "application/json");

        Client = client;

        ScheduledJobUrl = settings.ScheduledJobUrl;
    }
    public async Task<string> SendEmailReminderCheckout(ReminderCheckoutOrderDto model)
    {
        var uri = $"{ScheduledJobUrl}/send-email-reminder-checkout-order";
        var response = await Client.PostAsJson(uri, model);
        string jobId = null;

        if (response.EnsureSuccessStatusCode().IsSuccessStatusCode)
            jobId = await response.ReadContentAs<string>();

        return jobId;
    }
    public void DeleteReminderCheckoutOrder(string jobId)
    {
        var uri = $"{ScheduledJobUrl}/delete/jobId/{jobId}";
        Client.DeleteAsync(uri);
    }
}