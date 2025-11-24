try {
    $body = @{ username = 'admin'; password = 'password123' } | ConvertTo-Json -Compress
    Write-Output "Signing in as admin..."
    $signin = Invoke-RestMethod -Method Post -Uri 'http://localhost:8080/api/auth/signin' -ContentType 'application/json' -Body $body -ErrorAction Stop
    Write-Output "Signin response:" 
    $signin | ConvertTo-Json -Depth 5 | Write-Output

    $token = $signin.accessToken
    if (-not $token) { Write-Output 'No token received'; exit 0 }

    Write-Output "Creating reservation 1 day ahead..."
    $time = (Get-Date).ToUniversalTime().AddDays(1).ToString('o')
    $payload = @{ reservationTime = $time; durationMinutes = 90; partySize = 2; clientId = 1; tableId = 1 } | ConvertTo-Json -Compress

    $res = Invoke-RestMethod -Method Post -Uri 'http://localhost:8080/api/reservations' -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body $payload -ErrorAction Stop
    Write-Output "Reservation created:"
    $res | ConvertTo-Json -Depth 5 | Write-Output
} catch {
    Write-Output "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Output $sr.ReadToEnd()
    }
}
