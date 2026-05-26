[CmdletBinding()]
param(
    [string]$Context = ""
)

$ErrorActionPreference = "Stop"
$K8sDir = Resolve-Path (Join-Path $PSScriptRoot "..")
$ContextArg = if ($Context) { "--context=$Context" } else { "" }

Write-Host "==> kubectl apply -k $K8sDir" -ForegroundColor Cyan
if ($ContextArg) {
    kubectl $ContextArg apply -k $K8sDir
} else {
    kubectl apply -k $K8sDir
}

Write-Host "==> Waiting for databases to become Ready" -ForegroundColor Cyan
$Statefuls = @("productdb", "customerdb", "orderdb", "identitydb", "inventorydb", "hangfiredb", "rabbitmq", "elasticsearch")
foreach ($s in $Statefuls) {
    Write-Host "  - $s" -ForegroundColor DarkGray
    kubectl -n tedu rollout status statefulset/$s --timeout=300s
}

Write-Host "==> Waiting for deployments to become Ready" -ForegroundColor Cyan
$Deploys = @(
    "basketdb", "kibana",
    "tedu-identity-api", "product-api", "customer-api", "basket-api",
    "ordering-api", "inventory-product-api", "inventory-grpc",
    "hangfire-api", "apigw-ocelot", "webstatus", "frontend"
)
foreach ($d in $Deploys) {
    Write-Host "  - $d" -ForegroundColor DarkGray
    kubectl -n tedu rollout status deployment/$d --timeout=300s
}

Write-Host "==> Cluster overview" -ForegroundColor Cyan
kubectl -n tedu get pods,svc,ingress

Write-Host "`nOK - deployment finished." -ForegroundColor Green
Write-Host "Add these hosts to your hosts file (Windows: C:\Windows\System32\drivers\etc\hosts):" -ForegroundColor Yellow
Write-Host "  <ingress-ip>  tedu.local api.tedu.local idp.tedu.local kibana.tedu.local rabbitmq.tedu.local health.tedu.local jobs.tedu.local"
