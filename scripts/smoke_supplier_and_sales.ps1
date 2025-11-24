try {
    $body = @{ username = 'admin'; password = 'password123' } | ConvertTo-Json -Compress
    Write-Output "Signing in as admin..."
    $signin = Invoke-RestMethod -Method Post -Uri 'http://localhost:8080/api/auth/signin' -ContentType 'application/json' -Body $body -ErrorAction Stop
    $token = $signin.accessToken
    if (-not $token) { Write-Output 'No token received'; exit 0 }

    Write-Output "Listing suppliers (page 0)..."
    $suppliers = Invoke-RestMethod -Method Get -Uri 'http://localhost:8080/api/suppliers?page=0&size=10' -Headers @{ Authorization = "Bearer $token" } -ErrorAction Stop
    $suppliers | ConvertTo-Json -Depth 5 | Write-Output

    Write-Output "Creating test supplier 'SMOKE-SUPPLIER-TEMP'..."
    $new = @{ name='SMOKE-SUPPLIER-TEMP'; inn='0000000000'; phone='+70000000000'; email='smoke@example.com'; address='Test address'; contactPerson='QA' } | ConvertTo-Json -Compress
    $created = Invoke-RestMethod -Method Post -Uri 'http://localhost:8080/api/suppliers' -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body $new -ErrorAction Stop
    Write-Output 'Created supplier:'; $created | ConvertTo-Json -Depth 5 | Write-Output

    $id = $created.id
    Write-Output "Deleting supplier id $id..."
    Invoke-RestMethod -Method Delete -Uri "http://localhost:8080/api/suppliers/$id" -Headers @{ Authorization = "Bearer $token" } -ErrorAction Stop
    Write-Output 'Supplier deleted successfully'

    Write-Output 'Querying sales between last 7 days and tomorrow (to include today)...'
    $start = (Get-Date).ToUniversalTime().AddDays(-7).ToString('o')
    $end = (Get-Date).ToUniversalTime().AddDays(1).ToString('o')
    $url = "http://localhost:8080/api/sales/between?start=$([uri]::EscapeDataString($start))&end=$([uri]::EscapeDataString($end))&page=0&size=20"
    Write-Output "GET $url"
    $sales = Invoke-RestMethod -Method Get -Uri $url -Headers @{ Authorization = "Bearer $token" } -ErrorAction Stop
    Write-Output 'Sales page result:'
    $sales | ConvertTo-Json -Depth 6 | Write-Output

} catch {
    Write-Output "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Output $sr.ReadToEnd()
    }
}
