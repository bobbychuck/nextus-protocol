param (
    [Parameter(Mandatory=$true, Position=0)]
    [string]$Action,

    [Parameter(Mandatory=$false, Position=1, ValueFromRemainingArguments=$true)]
    [string[]]$DataArgs
)

$Server = "http://localhost:3000/next"
$DataStr = if ($DataArgs) { $DataArgs -join " " } else { "" }
$PayloadData = $null

# Try to parse data as JSON, otherwise treat as simple string payload or empty
if ($DataStr -match "^[{].*[}]$") {
    # Looks like JSON
    try {
        $PayloadData = $DataStr | ConvertFrom-Json
    } catch {
        Write-Host "⚠️ Warning: Data looked like JSON but failed to parse. Sending as string." -ForegroundColor Yellow
        $PayloadData = @{ message = $DataStr }
    }
} elseif (-not [string]::IsNullOrWhiteSpace($DataStr)) {
    # Treat as a simple query/message
    $PayloadData = @{ query = $DataStr; message = $DataStr }
} else {
    $PayloadData = @{}
}

$Body = @{
    action = $Action
    data   = $PayloadData
} | ConvertTo-Json -Depth 10

Write-Host "🚀 Sending [$Action] to Nextus..." -ForegroundColor Cyan

try {
    $Response = Invoke-RestMethod -Uri $Server -Method Post -Body $Body -ContentType "application/json" -ErrorAction Stop
    
    if ($Response.success) {
        Write-Host "✅ Queued: $($Response.queued.id)" -ForegroundColor Green
        Write-Host "   Agent matching will happen automatically." -ForegroundColor Gray
    } else {
        Write-Host "❌ Failed: $($Response | ConvertTo-Json)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error: Could not connect to $Server" -ForegroundColor Red
    Write-Host "   Is the server running? (npm start)" -ForegroundColor Gray
    Write-Host "   Error details: $_" -ForegroundColor DarkGray
}
