using Hangfire.API.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Shared.DTOs.ScheduledJob;

namespace Hangfire.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ScheduledJobsController : ControllerBase
{
    private readonly IBackgroundJobService _backgroundJobService;

    public ScheduledJobsController(IBackgroundJobService backgroundJobService)
    {
        _backgroundJobService = backgroundJobService;
    }

    [HttpPost]
    [Route("send-reminder-email")]
    public IActionResult SendReminderEmail(ReminderEmailDto model)
    {
        var jobId = _backgroundJobService.SendMailContent(model.Email, model.Subject, model.Content, model.EnqueueAt);
        return Ok(jobId);
    }

    [HttpDelete]
    [Route("delete-job/{id}")]
    public IActionResult DeleteJob(string id)
    {
        var result = _backgroundJobService.ScheduledJobService.Delete(id);
        return Ok(result);
    }
}
