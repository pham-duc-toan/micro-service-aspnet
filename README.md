# TeduShop — Hệ thống thương mại điện tử Microservices

Dự án bài tập lớn môn **Hệ thống phân tán**. Triển khai một hệ thống thương mại điện tử theo
kiến trúc **microservices** (.NET 6 / 7) + **React frontend**, có thể chạy bằng **Docker
Compose** cho phát triển cục bộ và **Kubernetes** cho triển khai cluster.

---

## 1. Tổng quan kiến trúc

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                              Frontend (React + Vite)                            │
│                              http://localhost:5173                              │
└──────────────────┬───────────────────────────────────┬─────────────────────────┘
                   │                                   │
                   │ /connect/token                    │ REST (Bearer JWT)
                   ▼                                   ▼
       ┌───────────────────────┐         ┌──────────────────────────┐
       │   Identity Server     │         │   API Gateway (Ocelot)   │
       │   :6011 (Duende)      │         │   :6001                  │
       └───────────────────────┘         └────────┬─────────────────┘
                                                  │
        ┌──────────┬──────────┬───────────┬───────┴────────┬───────────┬────────┐
        ▼          ▼          ▼           ▼                ▼           ▼        ▼
   product.api customer  basket.api  ordering.api  inventory.api  hangfire  webstatus
    :6002      :6003      :6004        :6005          :6006        :6008    :6010
        │          │          │           │                │
        ▼          ▼          ▼           ▼                ▼
     MySQL     Postgres     Redis       MSSQL           MongoDB
     :3306      :5433       :6379       :1435           :27017
                                          │                │
                                          ▼                ▼
                                      RabbitMQ       inventory.grpc
                                       :5672            :6007
```

### Các thành phần

| Thành phần | Công nghệ | Cổng host |
|---|---|---|
| Frontend | React 18 + Vite + TypeScript + Tailwind | 5173 |
| Identity Server | .NET + Duende IdentityServer + MSSQL | 6011 (db: 1436) |
| API Gateway | Ocelot | 6001 |
| Product API | .NET + MySQL | 6002 (db: 3306) |
| Customer API | .NET + PostgreSQL | 6003 (db: 5433) |
| Basket API | .NET + Redis + RabbitMQ | 6004 (db: 6379) |
| Ordering API | .NET + MSSQL + RabbitMQ + MassTransit | 6005 (db: 1435) |
| Inventory Product API | .NET + MongoDB | 6006 (db: 27017) |
| Inventory gRPC | .NET + MongoDB | 6007 |
| Hangfire API | .NET + MongoDB | 6008 (db: 27018) |
| Web Health Status | HealthChecks-UI | 6010 |
| RabbitMQ | RabbitMQ + Management UI | 5672 / 15672 |
| Elasticsearch + Kibana | ELK 7.17 | 9200 / 5601 |
| pgAdmin | pgAdmin 4 | 5050 |
| Portainer | Portainer CE | 9000 |

### Database-per-service

| Service | Database |
|---|---|
| product.api | MySQL 8 (`ProductDb`) |
| customer.api | PostgreSQL (`CustomerDb`) |
| basket.api | Redis |
| ordering.api | MSSQL 2019 (`OrderDb`) |
| inventory.*.api | MongoDB (`InventoryDb`) |
| hangfire.api | MongoDB (`hangfire-webapi`) |
| tedu.identity.api | MSSQL 2022 (`TeduIdentity`) |

---

## 2. Yêu cầu môi trường

| Thành phần | Phiên bản tối thiểu | Ghi chú |
|---|---|---|
| Docker Desktop | 4.x | Bật WSL2 trên Windows |
| Docker Compose | v2 | Đi kèm Docker Desktop |
| Node.js | 18+ | Để chạy frontend dev |
| .NET SDK | 6.0 / 7.0 | Chỉ cần khi build/debug code .NET ngoài Docker |
| kubectl | 1.27+ | Triển khai Kubernetes |
| RAM khả dụng | ≥ 8 GB | Khuyến nghị 12 GB nếu chạy cả ELK |
| Ổ đĩa trống | ≥ 15 GB | Cho images + volumes |

---

## 3. Chạy bằng Docker Compose (khuyến nghị cho dev)

### 3.1. Tạo network chung (chỉ lần đầu)

Identity Server và Business Services nằm trên **hai file compose riêng** nhưng dùng chung
network `tedu_microservices`:

```powershell
docker network create tedu_microservices
```

### 3.2. Khởi động Business Services (database + APIs + gateway)

```powershell
docker compose -f Business-Services/src/docker-compose.yml `
  -f Business-Services/src/docker-compose.override.yml `
  -f Business-Services/src/docker-compose.local-ports.yml `
  up -d --build
```

Thời gian lần đầu: 5-10 phút (build 9 .NET image + pull database image).

### 3.3. Khởi động Identity Server

```powershell
docker compose -f tedu-microserivces.idp/src/docker-compose.yml up -d --build
```

Compose này còn có container `tedu_identity_db_init` tự chạy script seed (file
`db-init/init-permissions.sh` + `DatabaseScripts/Store Procedures`) ngay sau khi MSSQL sẵn
sàng.

### 3.4. Khởi động Frontend

```powershell
cd frontend
copy .env.example .env       # chỉnh nếu cần
npm install                  # chỉ lần đầu
npm run dev
```

Mặc định mở tại http://localhost:5173.

> **Build production frontend**:
> ```powershell
> npm run typecheck
> npm run build       # tạo dist/
> npm run preview     # serve dist/ ở cổng 4173
> ```

### 3.5. Kiểm tra hệ thống đã chạy

```powershell
# Liệt kê container
docker ps

# Xem log một service
docker compose -f Business-Services/src/docker-compose.yml `
  -f Business-Services/src/docker-compose.override.yml `
  -f Business-Services/src/docker-compose.local-ports.yml `
  logs product.api --tail=200 -f

# Health check tổng quan
start http://localhost:6010
```

### 3.6. Dừng / dọn dẹp

```powershell
# Dừng (giữ volume = giữ dữ liệu DB)
docker compose -f Business-Services/src/docker-compose.yml `
  -f Business-Services/src/docker-compose.override.yml `
  -f Business-Services/src/docker-compose.local-ports.yml down

docker compose -f tedu-microserivces.idp/src/docker-compose.yml down

# Xoá luôn dữ liệu (thêm -v)
docker compose ... down -v
```

---

## 4. URL truy cập

### Ứng dụng

| URL | Mô tả |
|---|---|
| http://localhost:5173 | Frontend (storefront + `/admin`) |
| http://localhost:6001 | API Gateway (Ocelot) |
| http://localhost:6011 | Identity Server (`/connect/token`) |
| http://localhost:6011/.well-known/openid-configuration | OIDC discovery |

### Quản trị / công cụ

| URL | User / Pass |
|---|---|
| http://localhost:15672 (RabbitMQ) | `guest` / `guest` |
| http://localhost:5601 (Kibana) | `elastic` / `admin` |
| http://localhost:5050 (pgAdmin) | `admin@tedu.com.vn` / `admin1234` |
| http://localhost:9000 (Portainer) | tự đặt lần đầu |
| http://localhost:6008/jobs | (Hangfire dashboard) |
| http://localhost:6010 | HealthChecks UI |

### Tài khoản demo

| User | Pass | Vai trò |
|---|---|---|
| `alicesmith@example.com` | `alice123` | Administrator |

---

## 5. Biến môi trường

### Frontend (`frontend/.env`)

```env
VITE_GATEWAY_URL=http://localhost:6001
VITE_IDENTITY_URL=http://localhost:6011
VITE_CLIENT_ID=tedu_microservices_postman
VITE_CLIENT_SECRET=SuperStrongSecret
```

### Backend

Các biến chính được khai báo trực tiếp trong `docker-compose.override.yml`
(connection string, RabbitMQ, Elasticsearch, Identity issuer). Khi đổi password DB → đồng
bộ cả `environment` của DB và connection string của service tương ứng.

---

## 6. Triển khai Kubernetes

Toàn bộ manifest nằm trong [`k8s/`](k8s/). Mục tiêu: **Docker Desktop Kubernetes** trên
Windows. Cũng chạy được trên `kind` / `minikube`.

### 6.1. Chuẩn bị cluster

1. Bật Kubernetes trong Docker Desktop: `Settings → Kubernetes → Enable Kubernetes`.
   Cấp **≥ 4 CPU + 8 GB RAM** ở `Settings → Resources`.
2. Cài Ingress Controller:
   ```powershell
   kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml
   ```
3. Cài Metrics Server (cho HPA):
   ```powershell
   kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
   ```

### 6.2. Build image local

Mặc định toàn bộ Deployment dùng image local tag `:k8s` (`imagePullPolicy: IfNotPresent`):

```powershell
# Docker Desktop Kubernetes (image local hiển thị luôn trong cluster)
.\k8s\scripts\build-images.ps1

# kind
.\k8s\scripts\build-images.ps1 -KindLoad -KindClusterName kind

# minikube
.\k8s\scripts\build-images.ps1 -MinikubeLoad
```

Script build 11 image: 9 microservice backend + Identity API + Frontend (React + nginx).

### 6.3. Triển khai

```powershell
.\k8s\scripts\deploy.ps1
```

Script `deploy.ps1` sẽ:

1. `kubectl apply -k k8s/` — gom toàn bộ manifest qua Kustomize.
2. Chờ StatefulSet (database, RabbitMQ, Elasticsearch) sẵn sàng.
3. Chờ Deployment (microservice, gateway, IDP, frontend) sẵn sàng.
4. In `kubectl get pods,svc,ingress` để xác nhận.

### 6.4. Cấu hình host file

Thêm vào `C:\Windows\System32\drivers\etc\hosts` (mở Notepad bằng quyền Admin):

```
127.0.0.1   tedu.local api.tedu.local idp.tedu.local kibana.tedu.local rabbitmq.tedu.local health.tedu.local jobs.tedu.local
```

> kind/minikube: thay `127.0.0.1` bằng IP của ingress controller
> (`kubectl get svc -n ingress-nginx`).

### 6.5. URL Kubernetes

| Host | Đích | Mô tả |
|---|---|---|
| http://tedu.local | frontend | SPA React |
| http://api.tedu.local | apigw-ocelot | API Gateway |
| http://idp.tedu.local | tedu-identity-api | Identity Server |
| http://kibana.tedu.local | kibana | Centralized log UI |
| http://rabbitmq.tedu.local | rabbitmq | Quản trị RabbitMQ |
| http://health.tedu.local | webstatus | HealthChecks UI |
| http://jobs.tedu.local | hangfire-api | Hangfire dashboard |

### 6.6. Quan sát & scale

```powershell
# Toàn cảnh
kubectl -n tedu get pods,svc,ingress,pvc

# Log một service
kubectl -n tedu logs deploy/basket-api -f

# Scale thủ công
kubectl -n tedu scale deploy/product-api --replicas=4

# Theo dõi HPA
kubectl -n tedu get hpa -w
```

### 6.7. Gỡ cài đặt

```powershell
.\k8s\scripts\teardown.ps1            # xoá luôn dữ liệu (PVC)
.\k8s\scripts\teardown.ps1 -KeepData  # giữ PVC để rollback
```

### 6.8. Cấu trúc thư mục `k8s/`

```
k8s/
├── 00-namespace.yaml         # Namespace `tedu`
├── 01-secrets.yaml           # Secret (DB, RabbitMQ, Elastic)
├── 02-configmaps.yaml        # ConfigMap chung
├── 10-databases/             # MySQL, Postgres, Redis, MSSQL x2, MongoDB x2
├── 20-infrastructure/        # RabbitMQ, Elasticsearch, Kibana
├── 30-services/              # 11 Deployment (10 backend + frontend)
├── 40-ingress.yaml           # NGINX Ingress (api, idp, kibana, jobs...)
├── 50-hpa.yaml               # HorizontalPodAutoscaler
├── kustomization.yaml        # Tổng hợp resource bằng Kustomize
└── scripts/
    ├── build-images.ps1
    ├── deploy.ps1
    └── teardown.ps1
```

### 6.9. Ghi chú thiết kế K8s

- **Database-per-service**: mỗi DB là `StatefulSet` + `PVC` riêng.
- **ConfigMap** giữ giá trị không nhạy cảm; **Secret** giữ mật khẩu/credentials.
- **Probe**: `readinessProbe`/`livenessProbe` trỏ `/hc` (HealthChecks).
- **HPA**: 7 service nghiệp vụ + gateway (min 2, max 4–6, CPU 60–75 %).
- **Ingress**: định tuyến theo host, bật CORS cho SPA, `ingressClassName: nginx`.

---

## 7. Phát triển local (không Docker)

Cần thiết khi muốn debug từng service trong IDE.

### Backend (.NET)

```powershell
# Vẫn cần DB & RabbitMQ chạy bằng Docker:
docker compose -f Business-Services/src/docker-compose.yml `
  -f Business-Services/src/docker-compose.override.yml `
  -f Business-Services/src/docker-compose.local-ports.yml `
  up -d productdb customerdb orderdb basketdb inventorydb hangfiredb rabbitmq elasticsearch kibana

# Identity Server
docker compose -f tedu-microserivces.idp/src/docker-compose.yml up -d teduidentitydb

# Chạy service từ Visual Studio / dotnet CLI:
dotnet run --project Business-Services/src/Services/Product.API/Product.API.csproj
```

### EF Core migrations (Identity Server)

```powershell
cd tedu-microserivces.idp/src/TeduMicroservices.IDP

# Tạo migration
dotnet ef migrations add "Initial_PersistedGrantDb" -c PersistedGrantDbContext -s TeduMicroservices.IDP.csproj -o Persistence/Migrations/PersistedGrantDb

# Update DB
dotnet ef database update -c PersistedGrantDbContext
dotnet ef database update -c ConfigurationDbContext
dotnet ef database update -c TeduIdentityContext -p ../TeduMicroservices.IDP.Infrastructure/TeduMicroservices.IDP.Infrastructure.csproj
```

### HTTPS certificate (Docker Compose mode HTTPS)

```powershell
dotnet dev-certs https -ep $env:USERPROFILE\.aspnet\https\tedu-idp.pfx -p "password!"
dotnet dev-certs https --trust
```

---

## 8. Troubleshooting

| Triệu chứng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| Identity API restart liên tục lần đầu | DB chưa init xong | Đợi `tedu_identity_db_init` chạy xong rồi `docker compose restart tedu.identity.api` |
| Frontend `401` sau khi login | Token hết hạn / chưa có `roles` scope | Kiểm tra `src/api/auth.ts` và thử login lại |
| Frontend `403` Forbidden | User chưa có quyền | Login bằng `alicesmith@example.com` hoặc cấp quyền qua trang Permissions của IDP |
| CORS lỗi từ `localhost:5173` | Origin chưa có trong `AllowedCorsOrigins` | Chỉnh `Config.cs` của `tedu-microserivces.idp` rồi rebuild |
| `port already in use` | Cổng đã có service khác (vd: 1433, 6379) | Sửa cổng host trong `docker-compose.override.yml` |
| MSSQL bị OOM trên máy ít RAM | Container MSSQL cần ≥ 2GB | Tăng RAM Docker hoặc dùng `mcr.microsoft.com/azure-sql-edge` |
| K8s pod `CrashLoopBackOff` ở IDP | Seed bị ngắt giữa chừng | `kubectl rollout restart deploy/tedu-identity-api -n tedu` |
| `HPA: unknown` | Chưa cài Metrics Server | `kubectl apply -f` URL ở mục 6.1 |

### Lệnh chẩn đoán nhanh

```powershell
# Compose
docker compose ps
docker compose logs <service> --tail=200 -f

# Kubernetes
kubectl -n tedu describe pod <pod-name>
kubectl -n tedu logs <pod-name> --previous
kubectl -n tedu get events --sort-by=.lastTimestamp
```

---

## 9. Tham khảo nội bộ

- [`API_REFERENCE.md`](API_REFERENCE.md) — danh sách endpoint từng service.
- [`BAO_CAO_HTPT.md`](BAO_CAO_HTPT.md) — báo cáo môn học.
- [`frontend/README.md`](frontend/README.md) — chi tiết frontend (route, auth flow, env).
- [`tedu-microserivces.idp/README.md`](tedu-microserivces.idp/README.md) — IDP, migrations, HTTPS cert.
- [`k8s/README.md`](k8s/README.md) — tài liệu chi tiết về manifest Kubernetes.
