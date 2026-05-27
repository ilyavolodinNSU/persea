# scripts/setup-wsl.ps1
Write-Host "Checking vm.max_map_count for SonarQube..." -ForegroundColor Cyan
$current = wsl sysctl vm.max_map_count | ForEach-Object { $_ -replace '\D+(\d+)', '$1' }
if ($current -lt 262144) {
    Write-Host "Setting vm.max_map_count to 262144..."
    wsl -d Ubuntu -e bash -c "echo 'vm.max_map_count=262144' | sudo tee /etc/sysctl.d/99-sonarqube.conf && sudo sysctl -p /etc/sysctl.d/99-sonarqube.conf"
    Write-Host "Done. Please restart Docker Desktop or restart your machine if this is the first time." -ForegroundColor Yellow
} else {
    Write-Host "vm.max_map_count is already sufficient: $current" -ForegroundColor Green
}