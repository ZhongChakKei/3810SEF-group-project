# REST API Test Script for PowerShell
# Usage: .\test-api.ps1

$baseUrl = "http://localhost:3000/api"
$testPlayerId = ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Liverpool FC API Test Suite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Get all players
Write-Host "Test 1: GET /api/players" -ForegroundColor Yellow
Write-Host "Getting all players..." -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/players" -Method Get
    Write-Host "✓ Success! Found $($response.Count) players" -ForegroundColor Green
    if ($response.Count -gt 0) {
        $testPlayerId = $response[0]._id
        Write-Host "  Sample: $($response[0].name) - $($response[0].position)" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Search players
Write-Host "Test 2: GET /api/players?search=Salah" -ForegroundColor Yellow
Write-Host "Searching for 'Salah'..." -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/players?search=Salah" -Method Get
    Write-Host "✓ Success! Found $($response.Count) players matching 'Salah'" -ForegroundColor Green
    foreach ($player in $response) {
        Write-Host "  - $($player.name)" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Get player by ID
if ($testPlayerId) {
    Write-Host "Test 3: GET /api/players/:id" -ForegroundColor Yellow
    Write-Host "Getting player with ID: $testPlayerId..." -ForegroundColor Gray
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/players/$testPlayerId" -Method Get
        Write-Host "✓ Success! Retrieved: $($response.name)" -ForegroundColor Green
        Write-Host "  Position: $($response.position)" -ForegroundColor Gray
        Write-Host "  Squad #: $($response.squadNumber)" -ForegroundColor Gray
        Write-Host "  Stats: $($response.stats.appearances) apps, $($response.stats.goals) goals" -ForegroundColor Gray
    } catch {
        Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# Test 4: Create player
Write-Host "Test 4: POST /api/players" -ForegroundColor Yellow
Write-Host "Creating new test player..." -ForegroundColor Gray
try {
    $boundary = [System.Guid]::NewGuid().ToString()
    $bodyLines = @(
        "--$boundary",
        "Content-Disposition: form-data; name=`"name`"",
        "",
        "Test Player $(Get-Date -Format 'HHmmss')",
        "--$boundary",
        "Content-Disposition: form-data; name=`"position`"",
        "",
        "Midfielder",
        "--$boundary",
        "Content-Disposition: form-data; name=`"squadNumber`"",
        "",
        "99",
        "--$boundary",
        "Content-Disposition: form-data; name=`"nationality`"",
        "",
        "England",
        "--$boundary",
        "Content-Disposition: form-data; name=`"stats[appearances]`"",
        "",
        "1",
        "--$boundary",
        "Content-Disposition: form-data; name=`"stats[goals]`"",
        "",
        "0",
        "--$boundary--"
    )
    $body = $bodyLines -join "`r`n"
    
    $response = Invoke-RestMethod -Uri "$baseUrl/players" -Method Post `
        -ContentType "multipart/form-data; boundary=$boundary" `
        -Body $body
    
    $newPlayerId = $response._id
    Write-Host "✓ Success! Created player: $($response.name)" -ForegroundColor Green
    Write-Host "  ID: $newPlayerId" -ForegroundColor Gray
} catch {
    Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 5: Update player
if ($newPlayerId) {
    Write-Host "Test 5: PUT /api/players/:id" -ForegroundColor Yellow
    Write-Host "Updating test player..." -ForegroundColor Gray
    try {
        $boundary = [System.Guid]::NewGuid().ToString()
        $bodyLines = @(
            "--$boundary",
            "Content-Disposition: form-data; name=`"stats[goals]`"",
            "",
            "1",
            "--$boundary",
            "Content-Disposition: form-data; name=`"stats[assists]`"",
            "",
            "1",
            "--$boundary--"
        )
        $body = $bodyLines -join "`r`n"
        
        $response = Invoke-RestMethod -Uri "$baseUrl/players/$newPlayerId" -Method Put `
            -ContentType "multipart/form-data; boundary=$boundary" `
            -Body $body
        
        Write-Host "✓ Success! Updated player stats" -ForegroundColor Green
        Write-Host "  Goals: $($response.stats.goals)" -ForegroundColor Gray
        Write-Host "  Assists: $($response.stats.assists)" -ForegroundColor Gray
    } catch {
        Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# Test 6: Delete player
if ($newPlayerId) {
    Write-Host "Test 6: DELETE /api/players/:id" -ForegroundColor Yellow
    Write-Host "Deleting test player..." -ForegroundColor Gray
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/players/$newPlayerId" -Method Delete
        Write-Host "✓ Success! $($response.message)" -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# Test 7: Filter by position
Write-Host "Test 7: GET /api/players?position=Forward" -ForegroundColor Yellow
Write-Host "Filtering forwards..." -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/players?position=Forward" -Method Get
    Write-Host "✓ Success! Found $($response.Count) forwards" -ForegroundColor Green
    foreach ($player in $response) {
        Write-Host "  - $($player.name) (#$($player.squadNumber))" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 8: Invalid ID (error handling)
Write-Host "Test 8: GET /api/players/invalid-id (Error Handling)" -ForegroundColor Yellow
Write-Host "Testing with invalid ID..." -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/players/invalid-id" -Method Get -ErrorAction Stop
    Write-Host "✗ Should have failed but didn't" -ForegroundColor Red
} catch {
    $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
    if ($errorResponse.error -like "*Invalid*") {
        Write-Host "✓ Success! Correctly returned error: $($errorResponse.error)" -ForegroundColor Green
    } else {
        Write-Host "✗ Unexpected error: $($errorResponse.error)" -ForegroundColor Red
    }
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Suite Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "All REST API endpoints tested:" -ForegroundColor White
Write-Host "  - GET    /api/players" -ForegroundColor Gray
Write-Host "  - GET    /api/players?search=" -ForegroundColor Gray
Write-Host "  - GET    /api/players?position=" -ForegroundColor Gray
Write-Host "  - GET    /api/players/:id" -ForegroundColor Gray
Write-Host "  - POST   /api/players" -ForegroundColor Gray
Write-Host "  - PUT    /api/players/:id" -ForegroundColor Gray
Write-Host "  - DELETE /api/players/:id" -ForegroundColor Gray
Write-Host ""
Write-Host "For detailed API documentation, see API_DOCS.md" -ForegroundColor Cyan
