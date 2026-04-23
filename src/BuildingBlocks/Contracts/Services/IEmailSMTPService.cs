using Shared.Services.Email;

namespace Contracts.Services;

public interface IEmailSMTPService : IEmailService<MailRequest>
{
}
