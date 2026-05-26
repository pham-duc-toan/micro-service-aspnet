[CmdletBinding()]
param(
    [switch]$KeepData
)

$ErrorActionPreference = "Stop"
$K8sDir = Resolve-Path (Join-Path $PSScriptRoot "..")

Write-Host "==> kubectl delete -k $K8sDir" -ForegroundColor Yellow
kubectl delete -k $K8sDir --ignore-not-found

if (-not $KeepData) {
    Write-Host "==> Deleting PVCs (data will be lost)" -ForegroundColor Red
    kubectl -n tedu delete pvc --all --ignore-not-found
}

Write-Host "==> Deleting namespace tedu" -ForegroundColor Yellow
kubectl delete namespace tedu --ignore-not-found

Write-Host "OK - teardown finished." -ForegroundColor Green
