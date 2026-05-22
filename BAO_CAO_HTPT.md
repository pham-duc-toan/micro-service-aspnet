# BÁO CÁO BÀI TẬP LỚN
## Môn: HỆ THỐNG PHÂN TÁN

**Đề tài:** Xây dựng hệ thống thương mại điện tử theo kiến trúc Microservices

---

## MỤC LỤC

- Chương 1. Tổng quan đề tài
- Chương 2. Cơ sở lý thuyết về Hệ thống phân tán
  - 2.1. Kiến trúc Microservices
  - 2.2. Mô hình giao tiếp giữa các dịch vụ
  - 2.3. API Gateway
  - 2.4. Xác thực và phân quyền phân tán: OAuth 2.0, OpenID Connect, JWT
  - 2.5. Giao tiếp đồng bộ: REST và gRPC
  - 2.6. Giao tiếp bất đồng bộ: Message Broker và Event-driven Architecture
  - 2.7. Mẫu Saga và quản lý transaction phân tán
  - 2.8. CQRS, MediatR và Domain-Driven Design
  - 2.9. Resilience: Retry, Circuit Breaker, Timeout, Bulkhead
  - 2.10. Polyglot Persistence
  - 2.11. Observability: Logging, Health Check, Distributed Tracing
  - 2.12. Background Jobs trong hệ thống phân tán
  - 2.13. Containerization và Docker Compose
- Chương 3. Thiết kế hệ thống
  - 3.1. Kiến trúc tổng quan
  - 3.2. Danh sách microservice và trách nhiệm
  - 3.3. API Gateway (Ocelot)
  - 3.4. Identity Provider (Duende IdentityServer)
  - 3.5. Các luồng giao tiếp tiêu biểu
  - 3.6. Bảo mật: xác thực và phân quyền hai lớp
  - 3.7. Mô hình dữ liệu polyglot
- Chương 4. Cài đặt và triển khai
  - 4.1. Cấu trúc dự án
  - 4.2. Công nghệ sử dụng
  - 4.3. Frontend (React SPA)
  - 4.4. Triển khai bằng Docker Compose
- Chương 5. Kết quả minh họa và luồng nghiệp vụ
- Chương 6. Đánh giá và kết luận
- Tài liệu tham khảo

---

## Chương 1. TỔNG QUAN ĐỀ TÀI

### 1.1. Bối cảnh

Các hệ thống thương mại điện tử hiện đại như Tiki, Shopee, Lazada đều có hàng trăm chức năng nghiệp vụ độc lập, lưu lượng truy cập rất lớn và yêu cầu nâng cấp liên tục. Kiến trúc monolith truyền thống nhanh chóng bộc lộ các điểm yếu: triển khai cứng nhắc, một module hỏng kéo theo toàn hệ thống, khó scale theo nghiệp vụ và khó áp dụng nhiều công nghệ lưu trữ khác nhau. Vì vậy, **kiến trúc Microservices** đã trở thành lựa chọn phổ biến, kéo theo nhu cầu hiểu và vận dụng các pattern của **hệ thống phân tán**.

### 1.2. Mục tiêu của đề tài

Xây dựng một hệ thống thương mại điện tử với đầy đủ các thành phần microservices tiêu biểu, bao gồm:

- Tách nghiệp vụ thành nhiều microservice độc lập (Product, Customer, Basket, Order, Inventory, Schedule Job).
- Áp dụng **API Gateway** làm điểm vào duy nhất, định tuyến và bảo vệ các service backend.
- Tích hợp **Identity Provider** chuẩn OAuth 2.0 / OpenID Connect cho xác thực phân tán.
- Sử dụng đồng thời nhiều mô hình giao tiếp: REST (HTTP/JSON), gRPC (HTTP/2 + Protobuf), và Message Broker (RabbitMQ + MassTransit) cho event-driven.
- Áp dụng **Saga pattern** để xử lý transaction phân tán ở luồng đặt hàng (Checkout).
- Vận hành nhiều loại cơ sở dữ liệu (**polyglot persistence**): MySQL, PostgreSQL, Redis, SQL Server, MongoDB.
- Tích hợp các thành phần phụ trợ: Hangfire (background jobs), Polly (resilience), Serilog + Elasticsearch + Kibana (centralized logging), Health Checks UI.
- Triển khai bằng Docker Compose, demo end-to-end qua giao diện web React.

### 1.3. Phạm vi

Đề tài tập trung vào việc **thiết kế và cài đặt một hệ thống phân tán** ở quy mô demo, vận dụng các nguyên lý và pattern phổ biến của kiến trúc microservices. Hệ thống bao gồm đầy đủ các thành phần cốt lõi: các dịch vụ nghiệp vụ độc lập, điểm vào thống nhất qua API Gateway, cơ chế xác thực và phân quyền tập trung, nhiều hình thức giao tiếp giữa các dịch vụ (đồng bộ và bất đồng bộ), quản lý transaction phân tán, cũng như giao diện người dùng kết nối hoàn chỉnh. Toàn bộ hệ thống được đóng gói và chạy trong môi trường container hóa cục bộ phục vụ mục đích học tập và minh họa.

Đề tài **không** đặt mục tiêu triển khai trên hạ tầng production thực tế, chưa giải quyết các yêu cầu về khả năng mở rộng ngang (horizontal scaling), chưa tích hợp các giải pháp giám sát và tracing phân tán ở mức enterprise, và không xây dựng các tính năng nghiệp vụ hoàn chỉnh như thanh toán thực hay quản lý vận chuyển.
- Frontend dùng OAuth 2.0 ROPC để đơn giản hóa demo, không áp dụng Authorization Code + PKCE như khuyến nghị cho SPA ngoài thực tế.

---

## Chương 2. CƠ SỞ LÝ THUYẾT VỀ HỆ THỐNG PHÂN TÁN

### 2.1. Kiến trúc Microservices

**Định nghĩa.** Microservices là một phong cách kiến trúc, trong đó một ứng dụng được chia thành nhiều dịch vụ nhỏ, mỗi dịch vụ:
- Triển khai (deploy) độc lập trong một process riêng.
- Có cơ sở dữ liệu riêng (database-per-service).
- Giao tiếp với các dịch vụ khác qua giao thức nhẹ (HTTP REST, gRPC, message bus).
- Được tổ chức quanh một **bounded context** nghiệp vụ (theo DDD).

**So sánh với Monolith.** Monolith dễ phát triển ban đầu nhưng khó scale và bảo trì khi hệ thống lớn. Microservices cho phép:
- Scale từng service độc lập theo tải.
- Mỗi team sở hữu một service: phát triển, triển khai, vận hành riêng.
- Sử dụng công nghệ phù hợp cho từng nghiệp vụ (polyglot tech + polyglot persistence).
- Fault isolation: một service hỏng không kéo theo toàn hệ thống.

**Chi phí.** Microservices không miễn phí: kéo theo complexity về vận hành (giám sát, deploy nhiều service), giao tiếp mạng (latency, lỗi mạng), nhất quán dữ liệu phân tán (eventual consistency), bảo mật và tracing.

**Các principle cốt lõi.** Single Responsibility, autonomous, decentralized data management, design for failure, infrastructure automation.

### 2.2. Mô hình giao tiếp giữa các dịch vụ

Hai trục cơ bản:

- **Đồng bộ vs Bất đồng bộ.** Đồng bộ (REST, gRPC) yêu cầu request/response trong thời gian thực; bất đồng bộ (message bus) tách rời tạm thời người gửi và người nhận.
- **Một-một vs Một-nhiều.** Một-một thường là command/request; một-nhiều thường là event publish/subscribe.

Kết hợp lại được bốn dạng:
- Sync 1–1: REST, gRPC unary.
- Sync 1–n: ít gặp.
- Async 1–1: command queue, gRPC streaming.
- Async 1–n: event broadcast (publish/subscribe).

Một hệ thống thực tế thường dùng **hỗn hợp**: REST/gRPC cho luồng cần phản hồi ngay, message bus cho luồng xử lý nền hoặc cần loose coupling.

### 2.3. API Gateway

**Vấn đề.** Khi có nhiều microservice, client (web/mobile) không nên gọi trực tiếp từng service: nó phải biết địa chỉ của mọi service, tự xử lý cross-cutting concern (auth, throttle, CORS), và việc chia/gộp service trong tương lai sẽ phá vỡ client.

**Giải pháp.** Đặt một **API Gateway** ở biên hệ thống:
- Là điểm vào duy nhất (single entry point).
- Định tuyến (routing) request đến service nội bộ.
- Xử lý các cross-cutting concerns: xác thực, phân quyền, rate limiting, caching, circuit breaker, logging, response aggregation, swagger aggregation.
- Cung cấp giao diện API thân thiện với client, ẩn cấu trúc nội bộ.

**Các tính năng nâng cao.** Backend-for-Frontend (BFF), API composition, protocol translation (ví dụ chuyển REST của client sang gRPC nội bộ).

**Sản phẩm phổ biến.** NGINX, Kong, Tyk, AWS API Gateway, Zuul (Spring Cloud Gateway), và **Ocelot** trong hệ sinh thái .NET.

### 2.4. Xác thực và phân quyền phân tán: OAuth 2.0, OpenID Connect, JWT

**Vấn đề.** Trong hệ thống monolith, session lưu ở server và một component duy nhất xử lý đăng nhập. Microservices có hàng chục service: mỗi service không thể giữ session riêng, không thể cùng truy cập một bảng user, và việc gọi sang Identity Service mỗi request là không khả thi.

**OAuth 2.0** (RFC 6749) là chuẩn ủy quyền: cho phép một ứng dụng truy cập tài nguyên thay mặt user bằng cách lấy **Access Token** từ Authorization Server. Các grant type quan trọng:
- **Authorization Code** (web app, SPA dùng kèm PKCE): an toàn nhất.
- **Client Credentials**: giao tiếp giữa service với service.
- **Resource Owner Password (ROPC)**: client trực tiếp xin token bằng username/password — chỉ dùng trong môi trường tin cậy.
- **Refresh Token**: gia hạn access token mà không cần đăng nhập lại.

**OpenID Connect (OIDC)** là lớp identity xây trên OAuth 2.0: bổ sung **ID Token** (chứa thông tin về user) và endpoint `/userinfo`. OAuth chủ yếu để **authorize**, OIDC dùng để **authenticate**.

**JSON Web Token (JWT)** (RFC 7519) là một định dạng token gồm 3 phần: header, payload (chứa claims), signature; được mã hóa Base64URL và nối bằng dấu chấm. JWT thường được Authorization Server cấp dưới dạng access token. Ưu điểm:
- **Stateless**: server không phải lưu session.
- **Self-contained**: chứa toàn bộ claim (user, roles, expiry, scope) nên service nhận chỉ cần xác minh chữ ký.
- **Phân tán**: bất cứ service nào có public key hoặc symmetric key đều xác minh được.

**Scope** và **Claim** là hai khái niệm hay nhầm:
- **Scope** mô tả phạm vi truy cập mà client xin (`api.read`, `api.write`...).
- **Claim** là thông tin nằm trong token (sub, roles, permissions, email...).

**Mô hình phân quyền theo lớp.** Một hệ thống microservices an toàn thường có **defense-in-depth**:
- API Gateway kiểm tra chữ ký token + scope + role (coarse-grained).
- Backend kiểm tra permission cụ thể của user (fine-grained, ví dụ `PRODUCT.UPDATE`).

### 2.5. Giao tiếp đồng bộ: REST và gRPC

**REST (Representational State Transfer)** dùng HTTP/1.1, payload thường là JSON. Ưu điểm:
- Đơn giản, có sẵn ở mọi nền tảng/ngôn ngữ.
- Mềm dẻo về schema, dễ debug bằng browser/Postman.
- Tận dụng caching HTTP.

Nhược điểm: text-based nên chậm hơn binary; không hỗ trợ streaming tốt; thiếu chuẩn định nghĩa schema (OpenAPI là quy ước, không bắt buộc).

**gRPC** là RPC framework của Google chạy trên HTTP/2 + Protocol Buffers (Protobuf):
- **Schema-first**: định nghĩa service và message trong `.proto`, sinh code cho cả server và client.
- **Hiệu năng cao**: nhị phân nhỏ, multiplexed trên HTTP/2.
- **Hỗ trợ 4 kiểu RPC**: Unary, Server streaming, Client streaming, Bidirectional streaming.
- Phù hợp giao tiếp **service-to-service** ở mạng nội bộ với độ trễ thấp.

Khi nào chọn gì:
- REST: client ngoài (web/mobile), public API, dễ test.
- gRPC: liên lạc nội bộ cần latency thấp, streaming, schema chặt.

### 2.6. Giao tiếp bất đồng bộ: Message Broker và Event-driven Architecture

**Lý do dùng async.** Khi service A "thông báo" cho service B mà không cần phản hồi tức thì, hoặc khi cần loose coupling, hoặc khi muốn nhiều service cùng phản ứng với một sự kiện. Lúc đó, REST đồng bộ làm tăng cặp đôi (coupling) và lan truyền lỗi: nếu B chết, A cũng chết theo.

**Message Broker** là trung gian lưu giữ và chuyển tiếp message. Hai mô hình chính:
- **Queue (Point-to-Point)**: 1 message đi vào, đúng 1 consumer xử lý.
- **Topic / Exchange (Publish-Subscribe)**: 1 message broadcast cho nhiều subscriber.

**RabbitMQ** là broker phổ biến (giao thức AMQP 0.9.1). Khái niệm:
- **Producer** publish message vào **Exchange**.
- Exchange route message vào **Queue** theo binding (fanout, direct, topic, headers).
- **Consumer** đọc từ queue.

**Event-driven Architecture.** Là kiểu kiến trúc lấy "event" làm trung tâm: thay vì gọi nhau bằng command, các service phát sự kiện ("Order.Created"), service khác lắng nghe và phản ứng. Hệ quả:
- Loose coupling rất mạnh: producer không biết ai sẽ tiêu thụ event.
- Khả năng mở rộng: thêm subscriber mới không cần sửa producer.
- Eventual consistency thay vì strong consistency.

**Tích hợp với .NET: MassTransit.** Là framework abstraction trên RabbitMQ (và Azure Service Bus, Amazon SQS...). Đặc điểm:
- Định nghĩa message bằng C# interface/class.
- Consumer cài đặt `IConsumer<T>`.
- Tự động tạo exchange/queue, đặt tên theo convention (KebabCase, etc.).
- Tích hợp DI, Polly retry, scheduling.

### 2.7. Mẫu Saga và quản lý transaction phân tán

**Vấn đề.** Trong monolith, một transaction nghiệp vụ (đặt hàng) gói trong một database transaction ACID. Trong microservices, mỗi service có DB riêng → không thể dùng một transaction xuyên service. Hai phương án:

- **2PC (Two-Phase Commit)**: chuẩn XA, đòi hỏi coordinator, blocking, hiệu năng tệ, phụ thuộc DB hỗ trợ.
- **Saga**: chuỗi các transaction cục bộ; nếu một bước fail thì chạy **compensating transaction** ở các bước trước để hoàn nguyên.

Hai biến thể Saga:

- **Choreography (vũ đạo)**: các service tự lắng nghe event của nhau. Không có central coordinator. Ưu: đơn giản, loose coupling. Nhược: khó debug khi luồng phức tạp; rủi ro "spaghetti event".
- **Orchestration (chỉ huy)**: có một orchestrator gọi tuần tự từng service và quyết định luồng. Ưu: dễ nhìn flow, dễ kiểm soát rollback. Nhược: orchestrator có thể trở thành điểm trung tâm.

Saga giả định **eventual consistency**: dữ liệu các service tạm thời không nhất quán cho đến khi Saga hoàn tất; nếu fail thì rollback cũng eventual.

### 2.8. CQRS, MediatR và Domain-Driven Design

**CQRS (Command Query Responsibility Segregation).** Tách model **ghi** (Command) khỏi model **đọc** (Query). Ở mức nhẹ là tách handler; ở mức nặng là tách hẳn hai DB (write DB / read DB) đồng bộ qua event.

Lợi ích:
- Tối ưu riêng cho đọc (denormalize, caching) và ghi (validation, business logic).
- Scale đọc/ghi độc lập.
- Phối hợp tốt với Event Sourcing.

**MediatR** là thư viện implement mediator pattern trong .NET: gửi `Command/Query` đến đúng `Handler` qua một bus nội bộ, có thể chèn các **pipeline behaviour** (validation, logging, performance). Giúp controller mỏng, code nghiệp vụ tổ chức theo feature/use-case.

**Domain-Driven Design (DDD).** Tập trung vào mô hình hóa domain nghiệp vụ:
- **Entity, Value Object, Aggregate, Aggregate Root**: chia tổ chức dữ liệu trong domain.
- **Repository**: trừu tượng hóa lưu trữ.
- **Domain Event**: sự kiện phát sinh từ chính domain (`OrderCreated`, `OrderShipped`).
- **Bounded Context**: ranh giới của một domain con — chính là cơ sở để cắt microservice.

DDD đặc biệt phù hợp với những service có nghiệp vụ phức tạp (Order, Billing); service đơn giản (Customer profile) có thể dùng kiến trúc anemic / repository thuần.

### 2.9. Resilience: Retry, Circuit Breaker, Timeout, Bulkhead

Mạng không tin cậy. Service phân tán phải đối mặt với **partial failure**: gọi sang service khác có thể chậm, mất gói, lỗi tạm thời. Có một bộ pattern chuẩn:

- **Timeout**: không chờ quá lâu. Bảo vệ luồng gọi khỏi bị "treo".
- **Retry**: thử lại khi gặp lỗi tạm thời (5xx, network). Cần kèm **exponential backoff** + **jitter** để không "đánh sập" downstream.
- **Circuit Breaker**: khi downstream lỗi liên tục, "ngắt cầu chì" — fail nhanh thay vì tốn tài nguyên. Có 3 trạng thái: Closed (bình thường), Open (đang ngắt), Half-Open (thử lại). Lấy ý tưởng từ ổ điện gia đình.
- **Bulkhead**: chia thread pool / connection pool theo nhóm để một downstream chậm không hút cạn tài nguyên cả app.
- **Fallback**: trả về giá trị mặc định / cached khi downstream lỗi.

Trong .NET, **Polly** là thư viện cung cấp các policy này dưới dạng builder, có thể kết hợp (`Policy.WrapAsync(...)`) và gắn vào `HttpClientFactory`.

### 2.10. Polyglot Persistence

Mỗi nghiệp vụ có đặc tính dữ liệu khác nhau:
- Catalog sản phẩm: đọc nhiều, search/filter → SQL truyền thống (MySQL, PostgreSQL).
- Giỏ hàng: ephemeral, key-value → Redis.
- Đơn hàng: transaction phức tạp → SQL Server / PostgreSQL.
- Inventory log: write-heavy, schema linh hoạt → MongoDB.
- Background jobs: persistent queue → Mongo/Postgres.

Polyglot persistence là việc **mỗi service chọn DB tối ưu cho domain của mình**, thay vì ép một DB duy nhất cho toàn hệ thống. Đây là hệ quả tự nhiên của microservices: vì các service đã độc lập database, không có lý do bắt chúng dùng cùng một loại.

### 2.11. Observability: Logging, Health Check, Distributed Tracing

Trong monolith, log nằm một file; debug bằng stack trace. Trong microservices, một request có thể đi qua 5–10 service: cần ba trụ cột để quan sát hệ thống:

- **Centralized Logging.** Tập trung log từ mọi service vào một nơi (Elasticsearch / Loki / Splunk), tìm kiếm bằng UI (Kibana / Grafana). Thường thêm **correlation ID** vào mỗi request để xâu chuỗi log xuyên service.

- **Health Check.** Mỗi service expose endpoint `/health` báo cáo trạng thái (DB connected, queue connected...). Hệ thống vận hành (Kubernetes, load balancer) poll endpoint này để quyết định service "sống/chết". Có thể tổng hợp ra **HealthChecks UI**.

- **Distributed Tracing.** Mỗi request gắn `traceId`, mỗi đoạn xử lý là một `span`. Khi gọi sang service khác, traceId được truyền theo. Hệ thống tracing (Jaeger, Zipkin, OpenTelemetry collector) hiển thị toàn bộ chuỗi call dạng waterfall. Cực kỳ quan trọng khi debug độ trễ.

- **Metrics.** Số liệu định lượng (request/s, latency p95, error rate), thường dùng Prometheus + Grafana.

### 2.12. Background Jobs trong hệ thống phân tán

Có những tác vụ không cần (và không nên) thực thi đồng bộ với request HTTP: gửi email, tính toán nặng, đồng bộ dữ liệu định kỳ. Cần một cơ chế **scheduler/queue**:

- **Hangfire** (.NET): persistent job queue lưu vào DB (SQL, Mongo, PostgreSQL). Hỗ trợ Fire-and-forget, Delayed, Recurring (cron-like), Continuations. Có dashboard UI tích hợp.
- **Quartz.NET**: scheduler hướng cron.
- **Sidekiq / Celery**: tương đương trong Ruby / Python.

Background job có thể chạy trong cùng process service hoặc trong service riêng (Hangfire.API). Tách riêng giúp scale worker độc lập.

### 2.13. Containerization và Docker Compose

**Container** đóng gói cả ứng dụng và môi trường chạy của nó vào một image bất biến, chạy được trên mọi máy có Docker. So với máy ảo, container nhẹ hơn rất nhiều vì chia sẻ kernel host.

**Docker Compose** mô tả nhiều container và quan hệ giữa chúng trong một file YAML, tạo ra một mạng nội bộ (bridge network) để các container gọi nhau qua DNS theo tên service. Phù hợp môi trường dev và demo.

Ở mức production, **Kubernetes** quản lý container ở quy mô cluster: tự động scale, rolling update, service discovery, health monitoring. Docker Compose có thể coi là phiên bản đơn giản hóa của Kubernetes ở mức một máy chủ.

---

## Chương 3. THIẾT KẾ HỆ THỐNG

### 3.1. Kiến trúc tổng quan

Hệ thống chia làm 4 tầng:

1. **Client tier** — Frontend React SPA, chạy ở trình duyệt; chỉ gọi vào Gateway và IDP.
2. **Edge tier** — Ocelot API Gateway + Identity Provider (Duende IdentityServer).
3. **Service tier** — 7 microservice nghiệp vụ (Product, Customer, Basket, Ordering, Inventory.Product, Inventory.Grpc, Hangfire), 1 saga orchestrator (Saga.Orc).
4. **Infrastructure tier** — 6 database (mỗi loại một service), RabbitMQ, Elasticsearch + Kibana, Hangfire dashboard, Portainer, pgAdmin, WebHealthStatus.

Sơ đồ giao tiếp:

```
                +-------------------+
                |  React SPA (5173) |
                +---------+---------+
                          |
                  HTTP / OAuth2 ROPC
                          |
       +------------------v--------------------+        +-----------------------+
       | Duende IdentityServer  (6011)         |        |  Ocelot API Gateway   |
       | - Issue JWT + Refresh Token            |<------|  (6001)               |
       | - Permission claims                    |        |  - Routing            |
       +----------------------------------------+        |  - Authen (JWT)       |
                                                         |  - Author (scope/role)|
                                                         |  - QoS / Swagger Agg  |
                                                         +----------+------------+
                                                                    |
   +----------------+-----------+-----------+------------+----------+---------+--------------+
   |                |           |           |            |                    |              |
+--v--+         +---v--+    +---v---+   +---v---+    +---v----+         +-----v-----+   +----v----+
|Prod |         |Cust  |    |Basket |   |Order  |    |Inv.Prod|         | Inv.Grpc  |   |Hangfire |
|API  |         |API   |    |API    |   |API    |    |API     |         | (gRPC)    |   |API      |
|6002 |         |6003  |    |6004   |   |6005   |    |6006    |         | 6007      |   |6008     |
+--+--+         +--+---+    +---+---+   +---+---+    +---+----+         +-----+-----+   +----+----+
   |               |            |           |            |                     |              |
+--v---+        +--v----+    +--v---+   +---v---+    +---v-------+              |          +---v---+
|MySQL |        |PostgreS|   |Redis |   |MSSQL  |    |MongoDB    |              |          |MongoDB|
|3306  |        |5433    |   |6379  |   |1435   |    |27017      |<-------------+          |27018  |
+------+        +--------+   +------+   +-------+    +-----------+   gRPC stock  +----------+
                                            ^                       lookup
                                            |
                                  +---------+----------+
                                  |   RabbitMQ (5672)   |
                                  |   MassTransit Bus   |
                                  +---------------------+
                                             ^
                              BasketCheckoutEvent (publish)
                                             |
                                       Basket → Order

   Saga.Orc (HTTP orchestration) gọi trực tiếp Basket/Order/Inventory để rollback.

   Tất cả service Serilog → Elasticsearch (9200) → Kibana (5601).
   WebHealthStatus (6010) aggregate /hc của tất cả service + gRPC health.
```

### 3.2. Danh sách microservice và trách nhiệm

| Service | Port | DB | Pattern | Vai trò |
|---|---|---|---|---|
| Product.API | 6002 | MySQL 8 (EF Core, Pomelo) | Repository | Catalog sản phẩm (No, Name, Price, Description) |
| Customer.API | 6003 | PostgreSQL (EF Core, Npgsql) | Repository + Service | Thông tin user (UserName, Email, Address) |
| Basket.API | 6004 | Redis (IDistributedCache) | Cache as DB | Giỏ hàng tạm theo user |
| Ordering.API | 6005 | SQL Server 2019 | **DDD + CQRS + MediatR** | Đơn hàng (Order Aggregate, OrderCreated domain event) |
| Inventory.Product.API | 6006 | MongoDB | Repository | Sổ kho (purchase / sale entries) |
| Inventory.Grpc | 6007 | MongoDB | gRPC service | Cung cấp stock quantity qua gRPC |
| Hangfire.API | 6008 | MongoDB | Hangfire | Background jobs (email reminder, welcome jobs) |
| Saga.Orc | — | (không DB) | State machine (Stateless lib) | Saga Orchestration cho luồng Checkout |
| WebHealthStatus | 6010 | InMemory | HealthChecks.UI | Dashboard tổng hợp health |

### 3.3. API Gateway (Ocelot)

**Tổng quan.** Ocelot là API Gateway viết bằng .NET, cấu hình routing bằng file JSON (`ocelot.json`). Trong dự án dùng 2 file: `ocelot.Local.json` (dùng trong Docker, downstream qua `host.docker.internal`) và `ocelot.Development.json` (chạy trực tiếp localhost).

**Tính năng được sử dụng:**

- **Routing**: 26+ route map `UpstreamPathTemplate` → `DownstreamPathTemplate` + host/port.
- **Authentication**: tích hợp Duende IdentityServer qua `AddIdentityServerAuthentication` (provider key `"Bearer"`). Mọi request gửi token JWT trong header `Authorization: Bearer ...`.
- **Authorization 2 chiều:**
  - `AllowedScopes` — bắt buộc token có scope `tedu_microservices_api.read` (cho GET) hoặc `tedu_microservices_api.write` (cho POST/PUT/DELETE).
  - `RouteClaimsRequirement` — bắt buộc claim `roles=Administrator` cho các thao tác quản trị.
- **Polly QoS**: cấu hình `QoSOptions` cho route `/products` (TimeoutValue 5000ms, ExceptionsAllowedBeforeBreaking 2, DurationOfBreak 1000ms) — đây là circuit breaker + timeout của Polly.
- **Cache**: `Ocelot.Cache.CacheManager` (dictionary handle) — sẵn sàng để cache response per-route.
- **Swagger aggregation**: `MMLib.SwaggerForOcelot` đọc Swagger từ 6 service xuôi (`product-service`, `customer-service`, `basket-service`, `order-service`, `inventory-service`, `hangfire-service`) và gộp thành một UI duy nhất tại `/swagger`.
- **Token helper**: Gateway có thêm `TokenController` (`GET /api/token`) hỗ trợ ROPC từ trong gateway nếu cần.

**Phân tầng auth (defense-in-depth):**

- Gateway xác minh chữ ký JWT (lớp ngoài) + check scope + check role → block sớm.
- Backend dùng `[Authorize]` (cho public reads của customer) hoặc `[ClaimRequirement(FunctionCode, CommandCode)]` (cho admin operations) — fine-grained permission cụ thể (`PRODUCT.CREATE`, `ORDER.UPDATE`...).

### 3.4. Identity Provider (Duende IdentityServer)

Duende IdentityServer là phiên bản thương mại tiếp nối của IdentityServer4, chạy trên .NET 8. Cài đặt:

- **Identity Resources**: OpenID, Profile, Email, custom `roles`.
- **API Resources**: `tedu_microservices_api` (audience), gắn 2 scope `.read` và `.write`.
- **Clients:**
  - `tedu_microservices_swagger` — Implicit grant, dùng cho UI Swagger của Gateway/Product API.
  - `tedu_microservices_postman` — Client Credentials + ROPC; chính là client mà frontend dùng.
- **User store**: ASP.NET Identity trên SQL Server (`TeduIdentityContext`), seed admin `alicesmith@example.com / alice123` role `Administrator`.
- **Permission system**: ngoài role, có entity `Permission(Function, Command, RoleId)` với khóa kết hợp; lúc cấp token, permission của user được serialize JSON và gắn vào claim `permissions`. Phía service consume claim này qua `ClaimRequirementFilter` (lập trình lại từ `IAuthorizationFilter`).

**Luồng đăng nhập.** Frontend POST `connect/token` với `grant_type=password`, `username`, `password`, `scope=openid profile email roles offline_access tedu_microservices_api.read tedu_microservices_api.write`. IDP trả về `access_token`, `refresh_token`, `expires_in`. Frontend lưu vào Zustand store (persist localStorage).

### 3.5. Các luồng giao tiếp tiêu biểu

**(a) Sync REST: Frontend → Gateway → Service**

Tất cả thao tác CRUD đều đi qua flow này. Ví dụ tạo đơn:
1. SPA gọi `POST http://localhost:6001/v1/orders` với header `Authorization: Bearer <jwt>`.
2. Gateway match route, check scope `.write`, không yêu cầu role (đơn hàng do customer tự tạo) → forward sang `http://ordering.api/api/v1/orders`.
3. `OrdersController` (Ordering.API) `[Authorize]` → MediatR `CreateOrderCommand` → handler → EF Core insert SQL Server.

**(b) Sync gRPC: Basket → Inventory.Grpc**

Khi user cập nhật giỏ hàng (`POST /baskets`), Basket cần kiểm tra số lượng có sẵn của từng sản phẩm:
1. `BasketsController.UpdateBasket` lặp qua từng `item.ItemNo`, gọi `StockItemGrpcService.GetStock(itemNo)`.
2. Service này gói client gRPC `StockProtoServiceClient` (đã được DI với địa chỉ `http://inventory.grpc`).
3. Inventory.Grpc nhận RPC, đọc Mongo, trả về `StockModel { quantity }`.
4. Client gRPC được bọc bằng Polly `AsyncRetryPolicy<StockModel>(3)` để retry khi mạng lỗi.

gRPC ở đây dùng đúng theo lý thuyết: latency thấp, schema chặt, gọi nội bộ (không expose ra ngoài).

**(c) Async event: Basket → RabbitMQ → Ordering**

Luồng checkout giỏ hàng:
1. SPA POST `/baskets/checkout`.
2. `BasketsController.Checkout` lấy basket từ Redis, map sang `BasketCheckoutEvent` (gồm UserName, TotalPrice, FirstName, LastName, Email, Shipping, Invoice).
3. Gọi `_publishEndpoint.Publish(event)` — MassTransit publish vào exchange (RabbitMQ).
4. Basket xóa cache giỏ hàng (Redis) và trả `Accepted`.
5. Ordering.API có `BasketCheckoutEventHandler : IConsumer<BasketCheckoutEvent>` lắng nghe queue tương ứng (tên auto theo KebabCase).
6. Handler map event sang `CreateOrderCommand`, gọi `_mediator.Send` → tạo Order trong SQL Server → raise domain event `OrderCreatedEvent`.
7. `OrdersDomainHandler : INotificationHandler<OrderCreatedEvent>` gửi email xác nhận đơn hàng.

Đây là **choreography saga một bước** (Basket publish, Ordering subscribe), phối hợp loose coupling tự nhiên qua MassTransit.

**(d) Saga Orchestration: Saga.Orc**

Dự án có thêm một orchestrator riêng (Saga.Orc) demo cách dùng state machine cho saga phức tạp:
- Triển khai bằng thư viện `Stateless` 5.17.0 — một state machine framework rất nhẹ.
- Các state (`EOrderTransactionState`): `Idle → GetBasket → BasketGot → CreateOrder → OrderCreated → GetOrder → OrderGot → UpdateInventory → InventoryUpdated → DeleteBasket → BasketDeleted`.
- Trigger (`EOrderAction`): `GetBasket, CreateOrder, GetOrder, UpdateInventory, DeleteBasket, RollbackOrder`.
- Các HttpRepository (`BasketHttpRepository`, `OrderHttpRepository`, `InventoryHttpRepository`) gọi REST sang từng service nội bộ.
- Khi một bước fail (vd UpdateInventory exception), state machine fire `RollbackOrder` → DeleteInventory entries + DeleteOrder by DocumentNo.

Đây là phương án **dự phòng** cho luồng checkout, áp dụng được khi không muốn dùng event bus, hoặc khi nghiệp vụ cần phải compensate rõ ràng theo từng bước.

**(e) Background Job: Email reminder qua Hangfire**

- Basket.API có service `BackgroundJobHttpService` gọi `POST /api/schedule-job/send-email` lên Hangfire.API với `enqueueAt` (UTC).
- Hangfire.API serialize job vào MongoDB; khi đến giờ, worker chạy `SendEmailContent(email, subject, content)` qua SMTP (Gmail SmtpClient).
- HttpClient của Basket có pipeline Polly: `UseImmediateHttpRetryPolicy().UseCircuitHttpRetryPolicy().ConfigureTimeoutPolicy()` + `LoggingDelegatingHandler`.

### 3.6. Bảo mật: xác thực và phân quyền hai lớp

Mô hình áp dụng:

| Lớp | Kiểm tra | Cấu trúc |
|---|---|---|
| Identity Provider | Cấp token | OAuth2 ROPC + OIDC, scope + roles + permissions vào JWT |
| API Gateway | Token chữ ký + scope + role | `AddIdentityServerAuthentication`, `AllowedScopes`, `RouteClaimsRequirement` |
| Backend Service | Permission cụ thể | `[Authorize]` cho user thường, `[ClaimRequirement(FunctionCode, CommandCode)]` cho admin |

Lý do dùng cả 3 lớp: bảo đảm **defense-in-depth**. Một sai sót cấu hình ở gateway không kéo theo lộ dữ liệu vì backend vẫn tự kiểm tra. Lớp gateway giúp **fail fast** — token không hợp lệ bị chặn ngay biên hệ thống, tiết kiệm tài nguyên backend.

### 3.7. Mô hình dữ liệu polyglot

Project minh họa rõ polyglot persistence:

- **MySQL** (Product) — quan hệ truyền thống, đọc nhiều, hỗ trợ index tốt cho search.
- **PostgreSQL** (Customer) — quan hệ với ràng buộc unique theo username/email.
- **Redis** (Basket) — ephemeral, key-value, TTL tự nhiên cho giỏ hàng tạm.
- **SQL Server** (Ordering) — transaction phức tạp, hỗ trợ EF Core tốt nhất cho .NET.
- **MongoDB** (Inventory + Hangfire) — schema linh hoạt cho sổ kho nhiều cột phụ và lưu state job dạng tài liệu.

Mỗi service chỉ truy cập DB của chính nó. Khi cần dữ liệu của service khác → gọi qua API (REST/gRPC) hoặc lắng nghe event, không bao giờ query trực tiếp DB khác.

---

## Chương 4. CÀI ĐẶT VÀ TRIỂN KHAI

### 4.1. Cấu trúc dự án

```
btl_http/
├── Business-Services/src/
│   ├── ApiGateways/OcelotApiGw/        # Ocelot Gateway
│   ├── BuildingBlocks/                  # Library dùng chung
│   │   ├── Common.Logging/              # Serilog -> Elasticsearch
│   │   ├── Contracts/                   # Interface contract (DateTracking, ApiResult...)
│   │   ├── EventBus.Messages/           # MassTransit message contracts
│   │   ├── Infrastructure/              # Repository, UoW, Polly policy, Auth filter
│   │   └── Shared/                      # Constants, DTOs, Configurations
│   ├── Services/
│   │   ├── Product.API/
│   │   ├── Customer.API/
│   │   ├── Basket.API/
│   │   ├── Ordering/
│   │   │   ├── Ordering.Domain/         # DDD layer
│   │   │   ├── Ordering.Application/    # CQRS + MediatR
│   │   │   ├── Ordering.Infrastructure/
│   │   │   └── Ordering.API/
│   │   ├── Inventory/Inventory.Product.API/
│   │   ├── Inventory/Inventory.Grpc/
│   │   └── Hangfire.API/
│   ├── Saga.Orc/                        # Orchestration saga
│   ├── WebApps/WebHealthStatus/         # Health UI dashboard
│   ├── docker-compose.yml
│   ├── docker-compose.override.yml
│   └── docker-compose.local-ports.yml
├── tedu-microserivces.idp/src/
│   ├── TeduMicroservices.IDP/           # Duende IdentityServer
│   ├── TeduMicroservices.IDP.Infrastructure/
│   └── TeduMicroservices.IDP.Presentation/
└── frontend/                            # React SPA
    └── src/
        ├── api/                         # axios + module gọi gateway
        ├── components/                  # UI components + layouts
        ├── pages/                       # Pages (storefront + admin)
        ├── stores/                      # Zustand stores
        └── lib/                         # JWT decode, format helpers
```

### 4.2. Công nghệ sử dụng

**Backend (.NET 6 + .NET 8):**

| Phạm vi | Công nghệ |
|---|---|
| Web API | ASP.NET Core 6/8 |
| ORM | EF Core 6 (Pomelo MySQL, Npgsql PostgreSQL, SqlServer) |
| NoSQL | MongoDB.Driver |
| Cache | Microsoft.Extensions.Caching.StackExchangeRedis |
| API Gateway | Ocelot 18.0 + Polly + CacheManager + SwaggerForOcelot |
| Identity | Duende IdentityServer 7 + ASP.NET Identity |
| Mediator | MediatR 10 |
| Validation | FluentValidation |
| Mapping | AutoMapper |
| Message bus | MassTransit 8.0.5 + RabbitMQ |
| RPC | Grpc.AspNetCore (server) + Grpc.Net.Client (client) |
| Background job | Hangfire.NetCore + Hangfire.Mongo |
| Resilience | Polly 7 (Retry, CircuitBreaker, Timeout) |
| Logging | Serilog + Serilog.Sinks.Elasticsearch |
| Health Checks | AspNetCore.HealthChecks (MySql, Redis, Mongo, SqlServer, Npgsql) + UI |
| Saga | Stateless 5.17 (state machine) |

**Frontend:**

| Phạm vi | Công nghệ |
|---|---|
| UI framework | React 18.3 + Vite 5 |
| Type | TypeScript 5.6 |
| Style | TailwindCSS 3.4 |
| State (client) | Zustand 4.5 (+ persist localStorage) |
| State (server) | TanStack React Query 5 |
| HTTP | axios 1.7 |
| Routing | react-router-dom 6.27 |
| Form | react-hook-form |
| Notification | react-hot-toast |

### 4.3. Frontend (React SPA)

**Tổ chức routing.** Hai layout chính:

- `StorefrontLayout` — Header + Footer cho khách hàng:
  - `/` — trang chủ giới thiệu + sản phẩm nổi bật.
  - `/products`, `/products/:id` — danh sách và chi tiết sản phẩm.
  - `/cart` — giỏ hàng (Zustand persist).
  - `/checkout` — thanh toán (yêu cầu đăng nhập, hỗ trợ Basket checkout qua RabbitMQ hoặc Direct order qua REST).
  - `/orders`, `/orders/:id` — lịch sử đơn hàng và chi tiết.

- `AdminLayout` — Sidebar dark, route `/admin/*`, bảo vệ bằng `ProtectedRoute requireAdmin`:
  - Dashboard, ProductsManage, OrdersManage, InventoryManage, CustomersManage, JobsManage.

**Auth flow.** `api/auth.ts` gọi trực tiếp IDP (`/connect/token`) bằng ROPC. Token được Zustand store persist trong localStorage (`tedu-auth`). 2 axios instance:
- `gatewayClient` (baseURL `http://localhost:6001`) cho mọi API nghiệp vụ.
- `identityClient` (baseURL `http://localhost:6011`) cho các tác vụ liên quan IDP.

Interceptor đính `Authorization: Bearer ...` từ store; response error 401 → logout + redirect.

**Defensive UI.** Mọi page đều có 3 trạng thái UI: loading (Spinner), error (toast đỏ), empty (EmptyState component). Có `ErrorBoundary` bao quanh `App` để bắt lỗi runtime.

### 4.4. Triển khai bằng Docker Compose

Toàn hệ thống gồm **22 container** trong network `tedu_microservices` (bridge):

**Database (6):** `productdb` (MySQL), `customerdb` (Postgres), `basketdb` (Redis), `orderdb` (MSSQL), `inventorydb` (Mongo), `hangfiredb` (Mongo).

**Infrastructure (5):** `rabbitmq` (5672/15672), `elasticsearch` (9200), `kibana` (5601), `pgadmin` (5050), `portainer` (8080/9000).

**Microservices (9):** `product.api`, `customer.api`, `basket.api`, `ordering.api`, `inventory.product.api`, `inventory.grpc`, `apigw.ocelot`, `hangfire.api`, `webstatus`.

**Identity (2):** `tedu.identity.api`, `tedu_identity_db` (MSSQL riêng).

Service-to-service gọi nhau qua DNS container (vd `http://inventory.grpc`, `amqp://guest:guest@rabbitmq:5672`, `http://tedu.identity.api`). `apigw.ocelot` map sang `host.docker.internal:600X` ở môi trường Local để demo dễ hơn.

**Khởi động:**

```powershell
# Backend
cd Business-Services\src
docker compose -p src -f docker-compose.yml -f docker-compose.override.yml -f docker-compose.local-ports.yml up -d --build

# Identity
cd ..\..\tedu-microserivces.idp\src
docker compose up -d --build

# Frontend
cd ..\..\frontend
npm install
npm run dev
```

---

## Chương 5. KẾT QUẢ MINH HỌA VÀ LUỒNG NGHIỆP VỤ

### 5.1. Đăng nhập

User mở `http://localhost:5173/login`, nhập `alicesmith@example.com / alice123` → SPA POST `/connect/token` → IDP trả JWT chứa `roles=Administrator` + claim `permissions=[...]` + scope read/write → SPA persist token → redirect home.

### 5.2. Duyệt sản phẩm (REST sync)

`GET /products` qua gateway → Ocelot check scope `.read` → forward `product.api` → MySQL trả danh sách → SPA hiển thị grid.

### 5.3. Cập nhật giỏ hàng (gRPC sync)

User add to cart → SPA POST `/baskets` → Basket.API gọi gRPC `Inventory.Grpc.GetStock` để biết số lượng có sẵn → set vào CartItem → lưu Redis.

### 5.4. Đặt hàng qua event (async)

User checkout → SPA POST `/baskets/checkout` → Basket map `BasketCheckoutEvent` → publish RabbitMQ → trả 202 Accepted → Ordering consume → tạo Order trong MSSQL → raise `OrderCreatedEvent` (in-process) → send email confirm.

### 5.5. Background job

Khi giỏ hàng có sản phẩm và user chưa thanh toán, hệ thống dùng Basket → Hangfire (REST) → schedule một job gửi email reminder sau X phút. Job lưu vào MongoDB; worker Hangfire chạy đúng giờ gửi qua SMTP.

### 5.6. Saga orchestration (alt flow)

Ngoài luồng event-based, có thể test `POST /api/checkout/saga` qua Saga.Orc:
- State machine fire sequence `GetBasket → CreateOrder → GetOrder → UpdateInventory → DeleteBasket`.
- Nếu UpdateInventory throw exception → `RollbackOrder` → DeleteInventory + DeleteOrder by DocumentNo.

### 5.7. Quan sát hệ thống

- **Kibana** (`http://localhost:5601`): xem log Serilog theo index `app-logs-*`, filter theo service.
- **WebHealthStatus** (`http://localhost:6010`): dashboard health của tất cả service, bao gồm gRPC health của Inventory.Grpc qua `GrpcHealthCheckBackgroundService`.
- **RabbitMQ Management** (`http://localhost:15672`): xem queue, exchange, consumer.
- **Hangfire Dashboard** (`http://localhost:6008/jobs`): xem các job đang chạy.
- **pgAdmin / Portainer**: quản lý DB và container.

---

## Chương 6. ĐÁNH GIÁ VÀ KẾT LUẬN

### 6.1. Những gì đã đạt được

- Triển khai đầy đủ một hệ thống microservices có 9+ service nghiệp vụ, đầy đủ database polyglot.
- Thiết kế và cài đặt **3 mô hình giao tiếp** đặc trưng của hệ thống phân tán: REST đồng bộ (Gateway), gRPC nội bộ (Basket → Inventory.Grpc), Event async (Basket → Order qua RabbitMQ/MassTransit).
- Áp dụng **API Gateway pattern** với routing, authen/author scope-based + role-based, swagger aggregation, QoS qua Polly.
- Tích hợp **OAuth2 + OIDC** đầy đủ qua Duende IdentityServer, hỗ trợ ROPC + Refresh Token; thiết kế **two-layer authorization** giữa gateway và service.
- Cài đặt **Saga** ở cả hai mô hình: choreography (Basket → Order qua event) và orchestration (Saga.Orc qua state machine + HTTP).
- Áp dụng **DDD + CQRS + MediatR** ở service Ordering (có nghiệp vụ phức tạp nhất).
- Áp dụng **Resilience pattern** Polly (Retry, CircuitBreaker, Timeout) cho HttpClient và gRPC client.
- Tích hợp **observability**: Serilog → Elasticsearch + Kibana cho centralized log, AspNetCore HealthChecks + WebHealthStatus UI cho monitoring sống/chết.
- Build SPA React đầy đủ tính năng customer + admin, demo end-to-end mọi luồng nghiệp vụ.
- Đóng gói toàn bộ hệ thống bằng Docker Compose, có thể chạy bằng vài lệnh.

### 6.2. Hạn chế

- **Chưa có distributed tracing**: dự án không tích hợp Jaeger/OpenTelemetry, khó debug độ trễ giữa nhiều service.
- **Chưa có rate limiting** ở gateway (cấu hình Ocelot RateLimit không bật, dễ bị tấn công).
- **Chỉ có 1 instance mỗi service**: chưa demo scale-out (cần Kubernetes hoặc Docker Swarm).
- **Saga.Orc bypass gateway**: gọi trực tiếp `localhost:6004/6005/6006` thay vì qua gateway, kém realistic về bảo mật.
- **Frontend dùng ROPC**: không phải best practice cho production (nên dùng Authorization Code + PKCE), nhưng đủ cho demo.
- **Eventual consistency** chưa được trình bày rõ ở phía UI: vì checkout trả 202, user có thể nhìn thấy "không có đơn nào" trong vài giây trước khi Order consumer tạo xong.

### 6.3. Hướng phát triển

- Tích hợp **OpenTelemetry + Jaeger** để có distributed tracing end-to-end.
- Bật **rate limiting** + **API key** ở Ocelot, hardening security.
- Triển khai trên **Kubernetes**: dùng Helm chart, Horizontal Pod Autoscaler theo CPU và queue depth.
- Cấu hình thêm **Outbox pattern** cho Basket → đảm bảo publish event RabbitMQ là transactional với write Redis.
- Bổ sung **Read Model** riêng cho query đơn hàng (CQRS đầy đủ): denormalize sang Elasticsearch để search nhanh.
- Frontend chuyển sang **OAuth2 Authorization Code + PKCE** cho an toàn hơn.
- Tích hợp **Prometheus + Grafana** để có metrics định lượng (latency p95, error rate, queue size).

### 6.4. Kết luận

Đề tài đã hoàn thành mục tiêu xây dựng một hệ thống thương mại điện tử **đầy đủ các thành phần đặc trưng của hệ thống phân tán**: tách microservice theo bounded context, API Gateway, IDP với OAuth/OIDC, ba mô hình giao tiếp REST + gRPC + Event, Saga ở cả hai biến thể, polyglot persistence, resilience pattern, centralized logging, và đóng gói bằng container. Quá trình thực hiện giúp hiểu sâu lý do tồn tại của từng pattern, đánh đổi giữa các mô hình và các vấn đề thực tế (eventual consistency, partial failure, complexity vận hành) mà sách giáo trình mô tả.

Hệ thống có thể được mở rộng tự nhiên sang Kubernetes và thêm các thành phần observability/security ở mức production. Mã nguồn được tổ chức theo BuildingBlocks (thư viện dùng chung) + Services (mỗi service một thư mục) thuận tiện cho việc cộng tác và bảo trì.

---

## TÀI LIỆU THAM KHẢO

1. Sam Newman, *Building Microservices: Designing Fine-Grained Systems*, O'Reilly, 2nd ed., 2021.
2. Chris Richardson, *Microservices Patterns: With examples in Java*, Manning, 2018.
3. Eric Evans, *Domain-Driven Design: Tackling Complexity in the Heart of Software*, Addison-Wesley, 2003.
4. Microsoft, *.NET Microservices: Architecture for Containerized .NET Applications*, eBook 2023. https://learn.microsoft.com/en-us/dotnet/architecture/microservices/
5. Dick Hardt, *The OAuth 2.0 Authorization Framework*, IETF RFC 6749, 2012.
6. Michael Jones et al., *JSON Web Token (JWT)*, IETF RFC 7519, 2015.
7. OpenID Foundation, *OpenID Connect Core 1.0*, 2014.
8. Microsoft, *gRPC for .NET*. https://learn.microsoft.com/en-us/aspnet/core/grpc/
9. MassTransit Documentation. https://masstransit.io/
10. Duende Software, *Duende IdentityServer Documentation*. https://docs.duendesoftware.com/identityserver/v7
11. Ocelot Documentation. https://ocelot.readthedocs.io/
12. Polly: Resilience and transient-fault-handling library. https://github.com/App-vNext/Polly
13. Martin Fowler, *Polyglot Persistence*, 2011. https://martinfowler.com/bliki/PolyglotPersistence.html
14. Hangfire Documentation. https://docs.hangfire.io/

---

*Hết báo cáo.*
