using System.Text.Json;
using Infrastructure.Extensions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Shared.Common.Constants;

namespace Infrastructure.Identity.Authorization;

public class ClaimRequirementFilter : IAuthorizationFilter
{
    private readonly CommandCode _commandCode;
    private readonly FunctionCode _functionCode;

    public ClaimRequirementFilter(FunctionCode functionCode, CommandCode commandCode)
    {
        _functionCode = functionCode;
        _commandCode = commandCode;
    }

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var permissionClaims = context.HttpContext.User.Claims.SingleOrDefault(x => x.Type.Equals(SystemConstants.Claims.Permissions));

        if (permissionClaims == null)
        {
            context.Result = new ForbidResult();
        }

        var permissions = JsonSerializer.Deserialize<List<string>>(permissionClaims.Value);
        if (!permissions.Contains(PermissionHelper.GetPermission(_functionCode, _commandCode)))
        {
            context.Result = new ForbidResult();
        }
    }
}