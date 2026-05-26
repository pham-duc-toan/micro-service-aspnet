# Triển khai trên Kubernetes

Thư mục `k8s/` cung cấp toàn bộ manifest để triển khai hệ thống TeDu Microservices trên một cụm Kubernetes đơn-máy. Mục tiêu chính: **Docker Desktop Kubernetes** trên Windows (`Settings → Kubernetes → Enable Kubernetes`). Cũng chạy được trên kind / minikube cùng một tập manifest.

## 1. Cấu trúc

```
k8s/
├── 00-namespace.yaml          # Namespace `tedu`
├── 01-secrets.yaml            # Secret (DB, RabbitMQ, Elastic)
├── 02-configmaps.yaml         # ConfigMap chung + cấu hình HealthChecks UI
├── 10-databases/              # MySQL, Postgres, Redis, MSSQL x2, MongoDB x2
├── 20-infrastructure/         # RabbitMQ, Elasticsearch, Kibana
├── 30-services/               # 11 service (10 backend + frontend)
├── 40-ingress.yaml            # NGINX Ingress (api, idp, kibana, jobs…)
├── 50-hpa.yaml                # HorizontalPodAutoscaler
├── kustomization.yaml         # Gom tất cả resource bằng Kustomize
└── scripts/
    ├── build-images.ps1       # Build tất cả Docker image (tag :k8s)
    ├── deploy.ps1             # Apply manifest + chờ rollout
    └── teardown.ps1           # Gỡ toàn bộ
```

## 2. Yêu cầu hệ thống

- `kubectl` ≥ 1.27
- Docker Desktop trên Windows với Kubernetes bật. Khuyến nghị cấp **≥ 4 CPU + 8 GB RAM** cho VM Docker Desktop (`Settings → Resources`).
- NGINX Ingress Controller đã cài (`kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml`).
- Metrics Server (cho HPA): `kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml`.
- Docker Engine để build image local.

## 3. Build và nạp image vào cluster

Mặc định toàn bộ Deployment dùng image local với tag `:k8s` (`imagePullPolicy: IfNotPresent`).

```powershell
# Docker Desktop / cluster có sẵn registry mặc định
.\k8s\scripts\build-images.ps1

# kind
.\k8s\scripts\build-images.ps1 -KindLoad -KindClusterName kind

# minikube
.\k8s\scripts\build-images.ps1 -MinikubeLoad
```

Script này lần lượt build 11 image: 10 dịch vụ backend + frontend (React + nginx).

## 4. Triển khai

```powershell
.\k8s\scripts\deploy.ps1
```

Script sẽ:

1. `kubectl apply -k k8s/` (gọi Kustomize tổng hợp toàn bộ manifest).
2. Chờ StatefulSet (database, RabbitMQ, Elasticsearch) sẵn sàng.
3. Chờ Deployment (microservice, gateway, IDP, frontend) sẵn sàng.
4. In `kubectl get pods,svc,ingress` để kiểm tra.

## 5. Truy cập

Thêm vào file `hosts` (`C:\Windows\System32\drivers\etc\hosts`):

```
127.0.0.1   tedu.local api.tedu.local idp.tedu.local kibana.tedu.local rabbitmq.tedu.local health.tedu.local jobs.tedu.local
```

> Với Docker Desktop, ingress nghe trực tiếp trên `localhost` (127.0.0.1). Nếu dùng kind/minikube, thay bằng IP của ingress controller (`kubectl get svc -n ingress-nginx`).

| Host | Đích | Mô tả |
|---|---|---|
| `tedu.local` | frontend | SPA React |
| `api.tedu.local` | apigw-ocelot | API Gateway |
| `idp.tedu.local` | tedu-identity-api | Duende IdentityServer |
| `kibana.tedu.local` | kibana | Centralized log UI |
| `rabbitmq.tedu.local` | rabbitmq | Quản trị RabbitMQ |
| `health.tedu.local` | webstatus | HealthChecks UI |
| `jobs.tedu.local` | hangfire-api | Hangfire dashboard |

## 6. Quan sát

```powershell
# Toàn cảnh
kubectl -n tedu get pods,svc,ingress,pvc

# Log của một service
kubectl -n tedu logs deploy/basket-api -f

# Mở rộng/thu nhỏ thủ công
kubectl -n tedu scale deploy/product-api --replicas=4

# Quan sát HPA
kubectl -n tedu get hpa -w
```

## 7. Gỡ cài đặt

```powershell
.\k8s\scripts\teardown.ps1            # xóa luôn dữ liệu
.\k8s\scripts\teardown.ps1 -KeepData  # giữ lại PVC
```

## 8. Ghi chú về thiết kế

- **Database-per-service**: mỗi service sở hữu một DB (StatefulSet + PVC riêng).
- **ConfigMap** giữ các giá trị không nhạy cảm dùng chung; **Secret** giữ mật khẩu/credentials.
- **Probe**: `readinessProbe` trỏ tới `/hc` (HealthChecks), `livenessProbe` cùng endpoint với chu kỳ thưa hơn để tránh restart đột ngột.
- **HPA**: bật cho 7 service nghiệp vụ + gateway (min 2, max 4–6, CPU 60–75 %).
- **Ingress**: định tuyến theo host, bật CORS cho domain SPA, dùng `ingressClassName: nginx`.
- **Polyglot DB**: MySQL, PostgreSQL, MSSQL (x2), MongoDB (x2), Redis — phản ánh đúng kiến trúc gốc.

## 9. Hạn chế đã biết

- IDP đang seed dữ liệu lúc khởi động lần đầu; nếu pod bị restart trong thời gian seed có thể cần `kubectl rollout restart` lại.
- HPA cần Metrics Server hoạt động — nếu chưa cài, `kubectl describe hpa` sẽ báo `unknown` (toàn bộ Deployment vẫn chạy ở `minReplicas`).
- Cluster nội bộ dùng HTTP. Đủ cho demo nội bộ; không phơi ra Internet.
