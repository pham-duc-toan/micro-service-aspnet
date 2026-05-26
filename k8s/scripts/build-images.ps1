[CmdletBinding()]
param(
    [string]$Tag = "k8s",
    [switch]$KindLoad,
    [string]$KindClusterName = "kind",
    [switch]$MinikubeLoad
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$Business = Join-Path $Root "Business-Services\src"
$Idp = Join-Path $Root "tedu-microserivces.idp\src"
$Frontend = Join-Path $Root "frontend"

$Images = @(
    @{ Name = "product-api";            Context = $Business; Dockerfile = "Services/Product.API/Dockerfile" },
    @{ Name = "customer-api";           Context = $Business; Dockerfile = "Services/Customer.API/Dockerfile" },
    @{ Name = "basket-api";             Context = $Business; Dockerfile = "Services/Basket.API/Dockerfile" },
    @{ Name = "ordering-api";           Context = $Business; Dockerfile = "Services/Ordering/Ordering.API/Dockerfile" },
    @{ Name = "inventory-product-api";  Context = $Business; Dockerfile = "Services/Inventory/Inventory.Product.API/Dockerfile" },
    @{ Name = "inventory-grpc";         Context = $Business; Dockerfile = "Services/Inventory/Inventory.Grpc/Dockerfile" },
    @{ Name = "apigw-ocelot";           Context = $Business; Dockerfile = "ApiGateways/OcelotApiGw/Dockerfile" },
    @{ Name = "hangfire-api";           Context = $Business; Dockerfile = "Services/Hangfire.API/Dockerfile" },
    @{ Name = "webstatus";              Context = $Business; Dockerfile = "WebApps/WebHealthStatus/Dockerfile" },
    @{ Name = "tedu-identity-api";      Context = $Idp;      Dockerfile = "TeduMicroservices.IDP/Dockerfile" },
    @{ Name = "tedu-frontend";          Context = $Frontend; Dockerfile = "Dockerfile" }
)

foreach ($img in $Images) {
    $fullTag = "$($img.Name):$Tag"
    Write-Host "==> Building $fullTag" -ForegroundColor Cyan
    Push-Location $img.Context
    try {
        docker build -t $fullTag -f $img.Dockerfile .
        if ($LASTEXITCODE -ne 0) { throw "docker build failed for $($img.Name)" }
    } finally {
        Pop-Location
    }

    if ($KindLoad) {
        Write-Host "==> kind load $fullTag" -ForegroundColor Yellow
        kind load docker-image $fullTag --name $KindClusterName
    } elseif ($MinikubeLoad) {
        Write-Host "==> minikube image load $fullTag" -ForegroundColor Yellow
        minikube image load $fullTag
    }
}

Write-Host "OK - all images built." -ForegroundColor Green
