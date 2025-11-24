try {
    $body = @{ username = 'admin'; password = 'password123' } | ConvertTo-Json -Compress
    Write-Output "Signing in as admin..."
    $signin = Invoke-RestMethod -Method Post -Uri 'http://localhost:8080/api/auth/signin' -ContentType 'application/json' -Body $body -ErrorAction Stop
    $token = $signin.accessToken
    if (-not $token) { Write-Output 'No token received'; exit 0 }

    Write-Output 'Creating new ingredient Test Salt...'
    $ing = @{ name='Test Salt'; unit='g'; stockQuantity=0; costPerUnit=0.1; minStockLevel=0 } | ConvertTo-Json -Compress
    $created = Invoke-RestMethod -Method Post -Uri 'http://localhost:8080/api/ingredients' -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body $ing -ErrorAction Stop
    Write-Output 'Created ingredient:'; $created | ConvertTo-Json -Depth 5 | Write-Output

    $id = $created.id
    Write-Output "Replenishing ingredient id $id by +500g..."
    Invoke-RestMethod -Method Post -Uri "http://localhost:8080/api/ingredients/$id/stock?quantity=500" -Headers @{ Authorization = "Bearer $token" } -ErrorAction Stop
    Write-Output 'Stock replenished'

    $after = Invoke-RestMethod -Method Get -Uri "http://localhost:8080/api/ingredients/$id" -Headers @{ Authorization = "Bearer $token" } -ErrorAction Stop
    $after | ConvertTo-Json -Depth 5 | Write-Output

} catch {
    Write-Output "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Output $sr.ReadToEnd()
    }
}
