using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Ordering.Application.Common.Models;
using Ordering.Application.Features.V1.Orders;
using Ordering.Application.Features.V1.Orders.Commands.DeleteOrderByDocNo;
using Ordering.Application.Features.V1.Orders.Queries.GetOrderById;
using Shared.DTOs.Order;
using Shared.SeedWork;
using System.ComponentModel.DataAnnotations;
using System.Net;

namespace Ordering.API.Controllers;

[Route("api/v1/[controller]")]
[ApiController]
public class OrdersController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IMapper _map;

    public OrdersController(IMediator mediator,IMapper map)
    {
        _mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
        _map = map ?? throw new ArgumentNullException(nameof(map));
    }

    private static class RouteNames
    {
        public const string GetOrders = nameof(GetOrders);
        public const string GetOrderById = nameof(GetOrderById);
        public const string CreateOrder = nameof(CreateOrder);
        public const string UpdateOrder = nameof(UpdateOrder);
        public const string DeleteOrder = nameof(DeleteOrder);
        public const string DeleteOrderByDocumentNo = nameof(DeleteOrderByDocumentNo);
    }

    #region CRUD

    [HttpGet("{username}", Name = RouteNames.GetOrders)]
    [ProducesResponseType(typeof(IEnumerable<Ordering.Application.Common.Models.OrderDto>), (int)HttpStatusCode.OK)]
    public async Task<ActionResult<IEnumerable<Ordering.Application.Common.Models.OrderDto>>> GetOrdersByUserName([Required] string username)
    {
        var query = new GetOrdersByUserNameQuery(username);
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpGet("by-id/{id:long}", Name = RouteNames.GetOrderById)]
    [ProducesResponseType(typeof(Ordering.Application.Common.Models.OrderDto), (int)HttpStatusCode.OK)]
    public async Task<ActionResult<Ordering.Application.Common.Models.OrderDto>> GetOrderById([Required] long id)
    {
        var query = new GetOrderByIdQuery(id);
        var result = await _mediator.Send(query);
        return Ok(result);
    }
    
    [HttpPost(Name = RouteNames.CreateOrder)]
    [ProducesResponseType(typeof(ApiResult<long>), (int)HttpStatusCode.OK)]
    public async Task<ActionResult<ApiResult<long>>> CreateOrder([FromBody]CreateOrderDto dto)
    {
        var command  = _map.Map<CreateOrderCommand>(dto);
        var result = await _mediator.Send(command);
        return Ok(result);
    }
    
    [HttpPut("{id:long}",Name = RouteNames.UpdateOrder)]
    [ProducesResponseType(typeof(ApiResult<Ordering.Application.Common.Models.OrderDto>), (int)HttpStatusCode.OK)]
    public async Task<ActionResult<Ordering.Application.Common.Models.OrderDto>> UpdateOrder([Required]long id, [FromBody]UpdateOrderCommand command)
    {
        command.SetId(id);
        var result = await _mediator.Send(command);
        return Ok(result);
    }
    
    [HttpDelete("{id:long}",Name = RouteNames.DeleteOrder)]
    [ProducesResponseType(typeof(NoContentResult), (int)HttpStatusCode.NoContent)]
    public async Task<ActionResult> DeleteOrder([Required]long id)
    {
        var command = new DeleteOrderCommand(id);
        await _mediator.Send(command);
        return NoContent();
    }
    [HttpDelete(template: "document-no/{documentNo}", Name = RouteNames.DeleteOrderByDocumentNo)]
    [ProducesResponseType(typeof(ApiResult<bool>), (int)HttpStatusCode.OK)]
    public async Task<ActionResult<ApiResult<bool>>> DeleteOrderByDocumentNo([Required] string documentNo)
    {
        var command = new DeleteOrderByDocNoCommand(documentNo);
        var result = await _mediator.Send(command);
        return Ok(result);
    }
    #endregion
}