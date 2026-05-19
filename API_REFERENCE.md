# API Reference

## Runtime

- Identity Server: `http://localhost:6011`
- API Gateway: `http://localhost:6001`
- Swagger gateway UI: `http://localhost:6001/swagger`
- Tested Docker command when host ports `6379` or `5433` are already used:

```powershell
docker compose -f Business-Services/src/docker-compose.yml -f Business-Services/src/docker-compose.override.yml -f Business-Services/src/docker-compose.local-ports.yml up -d --build
docker compose -f tedu-microserivces.idp/src/docker-compose.yml up -d --build
```

## Authentication

Token endpoint:

```http
POST http://localhost:6011/connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=password
client_id=tedu_microservices_postman
client_secret=SuperStrongSecret
username=alicesmith@example.com
password=alice123
scope=openid profile email roles tedu_microservices_api.read tedu_microservices_api.write
```

Use `Authorization: Bearer <access_token>` for protected endpoints.

Seeded admin user:

- Username: `alicesmith@example.com`
- Password: `alice123`
- Role: `Administrator`
- Permissions: all function/command pairs seeded by Identity (`ROLE`, `PRODUCT`, `CUSTOMER`, `BASKET`, `ORDER`, `INVENTORY`, `SCHEDULE_JOB` with `VIEW`, `CREATE`, `UPDATE`, `DELETE`)

## Identity APIs

| Method | URL | Function | Auth |
| --- | --- | --- | --- |
| `GET` | `/api/account` on Identity Server | Current user profile | Bearer token |
| `GET` | `/api/permissions/roles/{roleId}` on Identity Server | List role permissions | Bearer token |
| `POST` | `/api/permissions/roles/{roleId}` on Identity Server | Add a permission `{ "function": "...", "command": "..." }` | Bearer token |
| `DELETE` | `/api/permissions/roles/{roleId}/function/{function}/command/{command}` on Identity Server | Delete one permission | Bearer token |
| `POST` | `/api/permissions/roles/{roleId}/update-permissions` on Identity Server | Replace role permissions | Bearer token |

## Gateway APIs

All URLs below are relative to `http://localhost:6001`.

### Product

| Method | URL | Function | Auth/permission |
| --- | --- | --- | --- |
| `GET` | `/products` | List products | Admin role + `PRODUCT.VIEW` |
| `GET` | `/products/{id}` | Get product by id | Admin role + `PRODUCT.VIEW` |
| `GET` | `/products/get-product-by-no/{productNo}` | Get product by product number | Admin role + `PRODUCT.VIEW` |
| `POST` | `/products` | Create product | Admin role + `PRODUCT.CREATE` |
| `PUT` | `/products/{id}` | Update product | Admin role + `PRODUCT.UPDATE` |
| `DELETE` | `/products/{id}` | Delete product | Admin role + `PRODUCT.DELETE` |

Product create body:

```json
{ "no": "SKU-001", "name": "Product name", "summary": "Short summary", "description": "Description", "price": 12.34 }
```

Product update body omits `no`.

### Customer

| Method | URL | Function | Auth/permission |
| --- | --- | --- | --- |
| `GET` | `/customers/{username}` | Get customer profile | Admin role + `CUSTOMER.VIEW` |

Seeded customers: `customer1`, `customer2`.

### Inventory

| Method | URL | Function | Auth/permission |
| --- | --- | --- | --- |
| `GET` | `/inventory/items/{itemNo}` | List inventory entries for item | Public |
| `GET` | `/inventory/items/{itemNo}/paging?pageIndex=1&pageSize=10` | Paged inventory entries | Public |
| `GET` | `/inventory/{id}` | Get inventory entry by id | Admin role + `INVENTORY.VIEW` |
| `POST` | `/inventory/purchase/{itemNo}` | Add purchase quantity | Admin role + `INVENTORY.CREATE` |
| `POST` | `/inventory/sales/{itemNo}` | Add sale quantity | Bearer token |
| `POST` | `/inventory/sales/order-no/{orderNo}` | Add multiple sale entries for an order | Bearer token |
| `DELETE` | `/inventory/{id}` | Delete inventory entry | Admin role + `INVENTORY.DELETE` |

Bodies:

```json
{ "quantity": 7 }
```

```json
{ "externalDocNo": "EXT-001", "quantity": 2 }
```

```json
{ "saleItems": [{ "itemNo": "SKU-001", "quantity": 1 }] }
```

### Basket

| Method | URL | Function | Auth/permission |
| --- | --- | --- | --- |
| `GET` | `/baskets/{username}` | Get basket | Bearer token |
| `POST` | `/baskets` | Upsert basket; checks stock through Inventory gRPC | Bearer token |
| `DELETE` | `/baskets/{username}` | Delete basket | Bearer token |
| `POST` | `/baskets/checkout` | Publish checkout event and clear basket | Bearer token |
| `POST` | `/baskets/email` | Render reminder email template | Admin role + `BASKET.CREATE` |

Basket body:

```json
{
  "username": "customer1",
  "emailAddress": "customer1@local.com",
  "items": [{ "quantity": 1, "itemPrice": 15.5, "itemNo": "Lotus", "itemName": "Esprit" }]
}
```

Checkout body:

```json
{
  "userName": "customer1",
  "firstName": "customer1",
  "lastName": "customer",
  "emailAddress": "customer1@local.com",
  "shippingAddress": "Wollongong",
  "invoiceAddress": "Australia"
}
```

### Order

| Method | URL | Function | Auth/permission |
| --- | --- | --- | --- |
| `GET` | `/v1/orders/{username}` | List orders by username | Bearer token |
| `GET` | `/v1/orders/by-id/{id}` | Get order by id | Admin role + `ORDER.VIEW` |
| `POST` | `/v1/orders` | Create order | Bearer token |
| `PUT` | `/v1/orders/{id}` | Update order | Admin role + `ORDER.UPDATE` |
| `DELETE` | `/v1/orders/{id}` | Delete order | Admin role + `ORDER.DELETE` |
| `DELETE` | `/v1/orders/document-no/{documentNo}` | Delete order by document number | Admin role + `ORDER.DELETE` |

Create body includes `userName`; update body does not.

```json
{
  "userName": "customer1",
  "totalPrice": 42.42,
  "firstName": "customer1",
  "lastName": "customer",
  "emailAddress": "customer1@local.com",
  "shippingAddress": "Wollongong",
  "invoiceAddress": "Australia"
}
```

### Hangfire

| Method | URL | Function | Auth/permission |
| --- | --- | --- | --- |
| `POST` | `/schedule-job/send-email` | Schedule email job | Admin role + `SCHEDULE_JOB.CREATE` via gateway |
| `DELETE` | `/schedule-job/delete/jobId/{id}` | Delete scheduled job, returns `true` or `false` | Admin role + `SCHEDULE_JOB.DELETE` via gateway |
| `POST` | `/welcome/welcome` | Enqueue welcome log job | Admin role + `SCHEDULE_JOB.CREATE` |
| `POST` | `/welcome/delayedwelcome` | Schedule delayed welcome job | Admin role + `SCHEDULE_JOB.CREATE` |
| `POST` | `/welcome/welcomeat` | Schedule welcome job at a time | Admin role + `SCHEDULE_JOB.CREATE` |
| `POST` | `/welcome/confirmedwelcome` | Schedule continuation job | Admin role + `SCHEDULE_JOB.CREATE` |

Schedule email body:

```json
{ "email": "customer1@local.com", "subject": "Reminder", "content": "Hello", "enqueue": "2026-05-19T09:00:00Z" }
```

## Verification Summary

Docker end-to-end smoke tests passed for:

- Identity discovery, token, account, permissions
- Product CRUD through Ocelot
- Inventory purchase, sale, sale-order, paging, get, delete
- Basket update, get, checkout, email template
- Order create, list, get, update, delete by id, delete by document number
- Customer get
- Hangfire schedule/delete and welcome job endpoints

Known warnings remaining:

- Several .NET 6 projects target an end-of-support framework.
- `dotnet build` reports package vulnerability warnings for dependencies such as `AutoMapper`, `MongoDB.Driver`, `System.Linq.Dynamic.Core`, `Npgsql`, and `System.IdentityModel.Tokens.Jwt`.
