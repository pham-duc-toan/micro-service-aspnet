# Hướng dẫn test end-to-end theo luồng

Dưới đây là kịch bản test đầy đủ theo thứ tự — vừa gọi API vừa quan sát từng UI thay đổi
(RabbitMQ, Kibana, Hangfire, HealthChecks, container log, DB).

---

## Phase 0 — Chuẩn bị

### 0.1 Khởi động hệ thống

```powershell
# Tạo network (chỉ lần đầu)
docker network create tedu_microservices

# Business services
docker compose -f Business-Services/src/docker-compose.yml `
  -f Business-Services/src/docker-compose.override.yml `
  -f Business-Services/src/docker-compose.local-ports.yml `
  up -d --build
hoặc nếu ko trùng cổng
docker compose -f Business-Services/src/docker-compose.yml `
  -f Business-Services/src/docker-compose.override.yml `
  up -d --build

docker compose -f Business-Services/src/docker-compose.yml `
  -f Business-Services/src/docker-compose.override.yml `
  up -d
# Identity Server
docker compose -f tedu-microserivces.idp/src/docker-compose.yml up -d --build
docker compose -f tedu-microserivces.idp/src/docker-compose.yml up -d

# Đợi tất cả healthy (~30-60s sau khi build xong)
docker ps
```

### 0.2 Mở sẵn 4 tab quan sát

| Tab          | URL                        | Login           |
| ------------ | -------------------------- | --------------- |
| RabbitMQ     | http://localhost:15672     | guest / guest   |
| Kibana       | http://localhost:5601      | elastic / admin |
| Hangfire     | http://localhost:6008/jobs | —               |
| HealthChecks | http://localhost:6010      | —               |

### 0.3 Tail log 2 service chính

Mở thêm 2 terminal:

```powershell
# Terminal 1
docker logs ordering.api -f --tail=50

# Terminal 2
docker logs basket.api -f --tail=50
```

### 0.4 Tạo Postman Environment

| Variable        | Initial value                |
| --------------- | ---------------------------- |
| `gateway`       | `http://localhost:6001`      |
| `idp`           | `http://localhost:6011`      |
| `username`      | `alicesmith@example.com`     |
| `password`      | `alice123`                   |
| `client_id`     | `tedu_microservices_postman` |
| `client_secret` | `SuperStrongSecret`          |
| `access_token`  | (để trống)                   |
| `product_id`    | (để trống)                   |
| `order_id`      | (để trống)                   |
| `job_id`        | (để trống)                   |

### 0.5 Cách dùng cURL trong file này (Postman Import)

Mỗi API dưới đây có 1 block **cURL**. Để paste 1 phát vào Postman:

1. Trong Postman, bấm nút **Import** (góc trên trái).
2. Tab **Raw text** → paste cURL → **Continue** → **Import**.
3. Postman tự tạo request mới với đầy đủ method, URL, headers, body.
4. Bấm **Send**.

> cURL trong file giữ nguyên biến `{{access_token}}`, `http://localhost:6001`, `http://localhost:6011`... Postman
> sẽ resolve khi gửi nếu bạn đã chọn đúng **Environment**.

---

## Phase 1 — HealthCheck (verify hệ thống sống)

### 1.1 Mở http://localhost:6010

Phải thấy **7 service Healthy** (xanh):

- Product, Customer, Basket, Ordering, Inventory, Scheduled Job, Inventory Grpc

Nếu service nào **Unhealthy** → click xem detail → kiểm tra DB hoặc RabbitMQ.

### 1.2 Gọi `/hc` từ Postman

```bash
curl http://localhost:6002/hc
```

```bash
curl http://localhost:6004/hc
```

```bash
curl http://localhost:6005/hc
```

Response phải có `"status": "Healthy"`.

---

## Phase 2 — Lấy access token

### 2.1 Request token

```bash
curl -X POST http://localhost:6011/connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=tedu_microservices_postman&client_secret=SuperStrongSecret&username=alicesmith@example.com&password=alice123&scope=openid profile email roles tedu_microservices_api.read tedu_microservices_api.write"
```

**Tab Tests** (paste để auto-save token vào environment):

```js
const json = pm.response.json();
pm.environment.set("access_token", json.access_token);
console.log("Token saved");
```

### 2.2 Verify token (lấy thông tin user)

```bash
curl http://localhost:6011/api/account \
  -H "Authorization: Bearer {{access_token}}"
```

Phải trả về thông tin Alice + role Administrator.

**Quan sát Kibana**: search `Application: "TeduMicroservices.IDP"` → có log `Token request validation success`, `Successful login`.

---

## Phase 3 — Tạo sản phẩm (Admin)

### 3.1 Tạo product `Dell XPS 13`

```bash
curl -X POST http://localhost:6001/products \
  -H "Authorization: Bearer {{access_token}}" \
  -H "Content-Type: application/json" \
  -d '{
    "no": "SKU-LAPTOP-01",
    "name": "Dell XPS 13",
    "summary": "Laptop cao cấp",
    "description": "Laptop Dell XPS 13 9320, i7-1260P, 16GB, 512GB",
    "price": 1299.99
  }'
```

**Tests** (auto-save id):

```js
pm.environment.set("product_id", pm.response.json().id);
```

### 3.2 Tạo product `Logitech MX Master 3`

```bash
curl -X POST http://localhost:6001/products \
  -H "Authorization: Bearer {{access_token}}" \
  -H "Content-Type: application/json" \
  -d '{
    "no": "SKU-MOUSE-01",
    "name": "Logitech MX Master 3",
    "summary": "Chuột không dây",
    "description": "Chuột công thái học, kết nối Bluetooth + USB receiver",
    "price": 99.99
  }'
```

### 3.3 Tạo product `Keychron K2`

```bash
curl -X POST http://localhost:6001/products \
  -H "Authorization: Bearer {{access_token}}" \
  -H "Content-Type: application/json" \
  -d '{
    "no": "SKU-KB-01",
    "name": "Keychron K2",
    "summary": "Bàn phím cơ",
    "description": "Bàn phím cơ 75% layout, hot-swap, RGB",
    "price": 89.99
  }'
```

### 3.4 List products

```bash
curl http://localhost:6001/products \
  -H "Authorization: Bearer {{access_token}}"
```

### 3.5 Get product by id

```bash
curl http://localhost:6001/products/{{product_id}} \
  -H "Authorization: Bearer {{access_token}}"
```

### 3.6 Get product by SKU (productNo)

```bash
curl http://localhost:6001/products/get-product-by-no/SKU-LAPTOP-01 \
  -H "Authorization: Bearer {{access_token}}"
```

### Quan sát Phase 3

**Container log** (`docker logs product.api -f --tail=50`):

```
info: Begin: CreateProductCommand ...
info: Product SKU-LAPTOP-01 created
```

**Kibana** (Discover): `Application: "Product.API" and message: *created*`

**RabbitMQ**: chưa có gì — Product service không publish event.

**MySQL** (kiểm tra DB ngoài):

```powershell
docker exec -it productdb mysql -uroot -pPassw0rd! -e "SELECT id, no, name, price FROM ProductDb.Products"
```

---

## Phase 4 — Nhập kho (Inventory)

### 4.1 Nhập kho `SKU-LAPTOP-01` (10 cái)

```bash
curl -X POST http://localhost:6001/inventory/purchase/SKU-LAPTOP-01 \
  -H "Authorization: Bearer {{access_token}}" \
  -H "Content-Type: application/json" \
  -d '{ "externalDocNo": "PO-2026-001", "quantity": 10 }'
```

### 4.2 Nhập kho `SKU-MOUSE-01` (50 cái)

```bash
curl -X POST http://localhost:6001/inventory/purchase/SKU-MOUSE-01 \
  -H "Authorization: Bearer {{access_token}}" \
  -H "Content-Type: application/json" \
  -d '{ "externalDocNo": "PO-2026-002", "quantity": 50 }'
```

### 4.3 Nhập kho `SKU-KB-01` (20 cái)

```bash
curl -X POST http://localhost:6001/inventory/purchase/SKU-KB-01 \
  -H "Authorization: Bearer {{access_token}}" \
  -H "Content-Type: application/json" \
  -d '{ "externalDocNo": "PO-2026-003", "quantity": 20 }'
```

### 4.4 Xem tồn kho

```bash
curl http://localhost:6001/inventory/items/SKU-LAPTOP-01 \
  -H "Authorization: Bearer {{access_token}}"
```

### 4.5 Xem tồn kho (phân trang)

```bash
curl "http://localhost:6001/inventory/items/SKU-LAPTOP-01/paging?pageIndex=1&pageSize=10" \
  -H "Authorization: Bearer {{access_token}}"
```

### Quan sát Phase 4

**MongoDB**:

```powershell
docker exec -it inventorydb mongosh
> use InventoryDb
> db.SalesItems.find().pretty()
```

Phải thấy 3 document với `ItemNo`, `Quantity`, `ExternalDocumentNo`.

**Container log** `docker logs inventory.product.api -f`:

```
info: Begin: PurchaseProductCommand SKU-LAPTOP-01
info: Purchase 10 units for SKU-LAPTOP-01
```

**Kibana**: filter `Application: "Inventory.Product.API"`.

---

## Phase 5 — Upsert giỏ hàng (gọi sang gRPC Inventory)

### 5.1 Upsert basket

```bash
curl -X POST http://localhost:6001/baskets \
  -H "Authorization: Bearer {{access_token}}" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alicesmith@example.com",
    "emailAddress": "alicesmith@example.com",
    "items": [
      { "quantity": 1, "itemPrice": 1299.99, "itemNo": "SKU-LAPTOP-01", "itemName": "Dell XPS 13" },
      { "quantity": 2, "itemPrice": 99.99,   "itemNo": "SKU-MOUSE-01", "itemName": "Logitech MX Master 3" }
    ]
  }'
```

### 5.2 Get basket

```bash
curl http://localhost:6001/baskets/alicesmith@example.com \
  -H "Authorization: Bearer {{access_token}}"
```

Response sẽ có thêm field `totalStock` của mỗi item (do basket.api gọi sang **inventory.grpc**).

### Quan sát Phase 5

**Container log basket.api**:

```
info: Begin: UpdateBasketCommand
info: Calling inventory.grpc to get stock for SKU-LAPTOP-01
info: Stock retrieved: 10
```

**Container log inventory.grpc**:

```
info: GetStock for itemNo=SKU-LAPTOP-01
```

**Redis** (kiểm tra basket đã lưu):

```powershell
docker exec -it basketdb redis-cli
> KEYS *
> GET "alicesmith@example.com"
```

**RabbitMQ**: vẫn chưa có event nào — basket chỉ publish khi checkout.

---

## Phase 6 — Checkout (RabbitMQ phát huy tác dụng)

### 6.1 Vào RabbitMQ UI TRƯỚC khi gọi

http://localhost:15672 → tab **Queues** → ghi nhớ số queue hiện tại.

### 6.2 Checkout

```bash
curl -X POST http://localhost:6001/baskets/checkout \
  -H "Authorization: Bearer {{access_token}}" \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "alicesmith@example.com",
    "firstName": "Alice",
    "lastName": "Smith",
    "emailAddress": "alicesmith@example.com",
    "shippingAddress": "Hà Nội, Việt Nam",
    "invoiceAddress": "123 Nguyễn Trãi"
  }'
```

### Quan sát ngay sau khi checkout

**RabbitMQ UI** (refresh):

- Tab **Exchanges** → có exchange tên `BasketCheckoutEvent` (do MassTransit tạo).
- Tab **Queues** → có queue tên dạng `ordering.api_xxx` hoặc `BasketCheckoutEvent_...`
- Tab **Overview** → biểu đồ `Message rates` có spike Publish + Deliver.

**Container log basket.api**:

```
info: Publishing BasketCheckoutEvent to RabbitMQ
info: Basket deleted for alicesmith@example.com
```

**Container log ordering.api** (đây là điểm hay nhất):

```
info: BasketCheckoutEventConsumer received message
info: Creating order from checkout event
info: Order saved: OrderId=xxx, DocumentNo=DOC-yyy
```

**Redis**: giỏ đã bị xoá:

```
> GET "alicesmith@example.com"
(nil)
```

**MSSQL OrderDb**:

```powershell
docker exec -it orderdb /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P 'Passw0rd!' -Q "SELECT Id, DocumentNo, UserName, TotalPrice, Status FROM OrderDb.dbo.Orders"
```

**Kibana**:

- Search `Application: "Basket.API" and message: *BasketCheckoutEvent*`
- Search `Application: "Ordering.API" and message: *Order saved*`
- Compare timestamp → thấy gap ~1-2s giữa publish và consume.

---

## Phase 7 — Xem & quản lý đơn hàng

### 7.1 List orders theo username

```bash
curl http://localhost:6001/v1/orders/alicesmith@example.com \
  -H "Authorization: Bearer {{access_token}}"
```

**Tests** (auto-save order_id từ order đầu tiên):

```js
pm.environment.set("order_id", pm.response.json()[0].id);
```

### 7.2 Get order by id

```bash
curl http://localhost:6001/v1/orders/by-id/{{order_id}} \
  -H "Authorization: Bearer {{access_token}}"
```

### 7.3 Tạo order trực tiếp (không qua basket)

```bash
curl -X POST http://localhost:6001/v1/orders \
  -H "Authorization: Bearer {{access_token}}" \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "alicesmith@example.com",
    "totalPrice": 99.99,
    "firstName": "Alice",
    "lastName": "Smith",
    "emailAddress": "alicesmith@example.com",
    "shippingAddress": "Hà Nội",
    "invoiceAddress": "Hà Nội"
  }'
```

### 7.4 Update order

```bash
curl -X PUT http://localhost:6001/v1/orders/{{order_id}} \
  -H "Authorization: Bearer {{access_token}}" \
  -H "Content-Type: application/json" \
  -d '{
    "totalPrice": 1499.97,
    "firstName": "Alice",
    "lastName": "Smith",
    "emailAddress": "alicesmith@example.com",
    "shippingAddress": "TP. HCM",
    "invoiceAddress": "Quận 1"
  }'
```

### Quan sát Phase 7

**Kibana**: `Application: "Ordering.API"` → thấy SQL command chạy, mediator pipeline.

---

## Phase 8 — Xuất kho theo đơn hàng

> Thay `DOC-yyy` bằng `documentNo` thật của order bạn vừa tạo (xem ở response Phase 7.2).

### 8.1 Trừ kho cho 1 item

```bash
curl -X POST http://localhost:6001/inventory/sales/SKU-LAPTOP-01 \
  -H "Authorization: Bearer {{access_token}}" \
  -H "Content-Type: application/json" \
  -d '{ "externalDocNo": "DOC-yyy", "quantity": 1 }'
```

### 8.2 Trừ kho nhiều item theo order

```bash
curl -X POST http://localhost:6001/inventory/sales/order-no/DOC-yyy \
  -H "Authorization: Bearer {{access_token}}" \
  -H "Content-Type: application/json" \
  -d '{
    "saleItems": [
      { "itemNo": "SKU-LAPTOP-01", "quantity": 1 },
      { "itemNo": "SKU-MOUSE-01", "quantity": 2 }
    ]
  }'
```

### 8.3 Verify tồn kho giảm

```bash
curl "http://localhost:6001/inventory/items/SKU-LAPTOP-01/paging?pageIndex=1&pageSize=10" \
  -H "Authorization: Bearer {{access_token}}"
```

Sẽ thấy row mới có `Quantity` âm (xuất kho).

---

## Phase 9 — Hangfire (background jobs)

### 9.1 Mở Hangfire dashboard

http://localhost:6008/jobs → ghi nhớ số **Succeeded** hiện tại.

### 9.2 Enqueue welcome job (chạy ngay)

```bash
curl -X POST http://localhost:6001/welcome/welcome \
  -H "Authorization: Bearer {{access_token}}"
```

→ Hangfire UI tab **Jobs → Succeeded** sẽ tăng +1 sau ~2 giây.

### 9.3 Delayed welcome (chạy sau X giây)

```bash
curl -X POST http://localhost:6001/welcome/delayedwelcome \
  -H "Authorization: Bearer {{access_token}}"
```

→ Tab **Jobs → Scheduled** → thấy job, sau khi đến hạn → chuyển sang **Succeeded**.

### 9.4 Welcome at time

```bash
curl -X POST http://localhost:6001/welcome/welcomeat \
  -H "Authorization: Bearer {{access_token}}"
```

### 9.5 Continuation job

```bash
curl -X POST http://localhost:6001/welcome/confirmedwelcome \
  -H "Authorization: Bearer {{access_token}}"
```

→ Tab **Jobs → Awaiting** rồi **Succeeded** (job sau chạy khi job trước xong).

### 9.6 Schedule email job

```bash
curl -X POST http://localhost:6001/schedule-job/send-email \
  -H "Authorization: Bearer {{access_token}}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@local.com",
    "subject": "Test from Postman",
    "content": "Hello Alice",
    "enqueue": "2026-05-25T15:30:00Z"
  }'
```

Response trả về `jobId` (số).

**Tests** (auto-save jobId):

```js
pm.environment.set("job_id", pm.response.text());
```

→ Hangfire UI **Scheduled** sẽ có job mới với thời gian khớp.

### 9.7 Xoá job đã đặt

```bash
curl -X DELETE http://localhost:6001/schedule-job/delete/jobId/{{job_id}} \
  -H "Authorization: Bearer {{access_token}}"
```

→ Hangfire UI: job chuyển sang **Deleted**.

### Quan sát Phase 9

**Container log hangfire.api**:

```
info: Job xx enqueued
info: Performing job WelcomeService.SendWelcome
info: Job xx succeeded
```

**MongoDB hangfiredb**:

```powershell
docker exec -it hangfiredb mongosh -u admin -p admin --authenticationDatabase admin
> use hangfire-webapi
> db.getCollectionNames()
> db.hangfire.jobGraph.find().limit(5)
```

---

## Phase 10 — Customer & Permission

### 10.1 Get customer `customer1`

```bash
curl http://localhost:6001/customers/customer1 \
  -H "Authorization: Bearer {{access_token}}"
```

### 10.2 Get customer `customer2`

```bash
curl http://localhost:6001/customers/customer2 \
  -H "Authorization: Bearer {{access_token}}"
```

### 10.3 Lấy roleId (chạy SQL trong MSSQL Identity)

```powershell
docker exec -it tedu_identity_db /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P 'Passw0rd!' -d TeduIdentity -Q "SELECT Id, Name FROM AspNetRoles"
```

> Sao lại `Id` của role `Administrator`, thay vào `{roleId}` ở các request sau.

### 10.4 Xem permissions của role Admin

```bash
curl http://localhost:6011/api/permissions/roles/{roleId} \
  -H "Authorization: Bearer {{access_token}}"
```

### 10.5 Thêm permission

```bash
curl -X POST http://localhost:6011/api/permissions/roles/{roleId} \
  -H "Authorization: Bearer {{access_token}}" \
  -H "Content-Type: application/json" \
  -d '{ "function": "PRODUCT", "command": "EXPORT" }'
```

### 10.6 Xoá permission

```bash
curl -X DELETE http://localhost:6011/api/permissions/roles/{roleId}/function/PRODUCT/command/EXPORT \
  -H "Authorization: Bearer {{access_token}}"
```

---

## Phase 11 — Test lỗi (xem log error trong Kibana)

### 11.1 Gọi không có token → 401

```bash
curl http://localhost:6001/products
```

**Kibana**: `Application: "ApiGateway.Ocelot" and Level: "Warning"`.

### 11.2 Gọi với token sai → 401

```bash
curl http://localhost:6001/products \
  -H "Authorization: Bearer invalid_token"
```

### 11.3 Tạo product trùng `no` → force exception

```bash
curl -X POST http://localhost:6001/products \
  -H "Authorization: Bearer {{access_token}}" \
  -H "Content-Type: application/json" \
  -d '{
    "no": "SKU-LAPTOP-01",
    "name": "Duplicate",
    "summary": "Will fail",
    "description": "Will fail",
    "price": 1.0
  }'
```

→ Container log product.api có **stack trace**.  
→ Kibana filter `Application: "Product.API" and Level: "Error"` → click vào document → field `exception` chứa stack.

### 11.4 Xem queue tồn message khi consumer chết

Stop service consumer:

```powershell
docker stop ordering.api
```

Gọi checkout lại (xem Phase 6.2) → message sẽ tồn trong queue. RabbitMQ UI: queue có `Ready: 1`.

Start lại:

```powershell
docker start ordering.api
```

→ Message được consume, queue về `Ready: 0`.

---

## Phase 12 — Dọn dẹp (Delete)

### 12.1 Xoá order theo id

```bash
curl -X DELETE http://localhost:6001/v1/orders/{{order_id}} \
  -H "Authorization: Bearer {{access_token}}"
```

### 12.2 Xoá order theo documentNo

```bash
curl -X DELETE http://localhost:6001/v1/orders/document-no/DOC-yyy \
  -H "Authorization: Bearer {{access_token}}"
```

### 12.3 Xoá basket

```bash
curl -X DELETE http://localhost:6001/baskets/alicesmith@example.com \
  -H "Authorization: Bearer {{access_token}}"
```

### 12.4 Xoá product

```bash
curl -X DELETE http://localhost:6001/products/{{product_id}} \
  -H "Authorization: Bearer {{access_token}}"
```

### 12.5 Xoá inventory entry

> Thay `{inventoryId}` bằng `id` của 1 row trong response Phase 4.4.

```bash
curl -X DELETE http://localhost:6001/inventory/{inventoryId} \
  -H "Authorization: Bearer {{access_token}}"
```

---

## Checklist cuối cùng

Sau khi chạy hết các phase, bạn nên thấy:

| Hệ thống            | Thay đổi quan sát được                                                                                      |
| ------------------- | ----------------------------------------------------------------------------------------------------------- |
| **HealthChecks UI** | 7 service xanh suốt quá trình                                                                               |
| **RabbitMQ**        | Có exchange `BasketCheckoutEvent`, message rate spike khi checkout                                          |
| **Kibana**          | ~vài trăm log với đủ Application: Product, Customer, Basket, Ordering, Inventory, Hangfire, IDP, ApiGateway |
| **Hangfire**        | Succeeded ≥ 3, Scheduled ≥ 1, Deleted ≥ 1                                                                   |
| **Postman**         | Token request → CRUD product → inventory → basket → checkout → order tạo tự động → jobs schedule/delete     |
| **DB**              | Product (MySQL), Order (MSSQL), Inventory (Mongo), Basket (Redis xoá sau checkout) đều có dữ liệu           |

## Tip: Postman Collection Runner

Đóng gói các request thành collection rồi **Runner** chạy 1 lần để test toàn flow tự động.
Đặt `pm.test()` ở tab Tests để verify status code + assert field response. Như vậy mỗi lần
rebuild có thể chạy lại smoke test trong 30s.
