try {
    $body = @{ username = 'admin'; password = 'password123' } | ConvertTo-Json -Compress
    Write-Output "Signing in as admin..."
    $signin = Invoke-RestMethod -Method Post -Uri 'http://localhost:8080/api/auth/signin' -ContentType 'application/json' -Body $body -ErrorAction Stop
    $token = $signin.accessToken
    if (-not $token) { Write-Output 'No token received'; exit 0 }

    Write-Output 'Fetching ingredients page...'
    $ingredients = Invoke-RestMethod -Method Get -Uri 'http://localhost:8080/api/ingredients?page=0&size=10' -Headers @{ Authorization = "Bearer $token" } -ErrorAction Stop
    $ingredients | ConvertTo-Json -Depth 5 | Write-Output

    $first = $ingredients.content[0]
    if ($null -eq $first) { Write-Output 'No ingredients found'; exit 0 }
    $id = $first.id
    Write-Output "First ingredient id: $id, name: $($first.name), current stock: $($first.stockQuantity)"

    Write-Output "Updating stock for ingredient id $id by +5"
    Invoke-RestMethod -Method Post -Uri "http://localhost:8080/api/ingredients/$id/stock?quantity=5" -Headers @{ Authorization = "Bearer $token" } -ErrorAction Stop
    Write-Output 'Stock updated successfully'

    Write-Output 'Fetching ingredient after update...'
    $after = Invoke-RestMethod -Method Get -Uri "http://localhost:8080/api/ingredients/$id" -Headers @{ Authorization = "Bearer $token" } -ErrorAction Stop
    $after | ConvertTo-Json -Depth 5 | Write-Output

} catch {
    Write-Output "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Output $sr.ReadToEnd()
    }
}
