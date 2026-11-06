$dex = Get-Content -Path "C:\Users\rudra\OneDrive\Desktop\CINEMORA\apk_extract\classes.dex" -Encoding Byte -Raw
$text = [System.Text.Encoding]::ASCII.GetString($dex)

# Find all http/https URLs
$urls = [regex]::Matches($text, 'https?://[^\s""<>]+', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
$uniqueUrls = $urls | ForEach-Object { $_.Value } | Sort-Object -Unique
"Found $($uniqueUrls.Count) URLs in DEX:"
$uniqueUrls | ForEach-Object { Write-Host "  $_" }

# Also search for domain-like patterns in DEX
$domains = [regex]::Matches($text, '[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
$uniqueDomains = $domains | ForEach-Object { $_.Value } | Sort-Object -Unique | Where-Object { $_ -notmatch 'android|google|facebook|react|apple|companion' }
"Domains in DEX: $($uniqueDomains.Count)"
$uniqueDomains | ForEach-Object { Write-Host "  $_" }

# Also search for API-like path patterns in DEX
$apiPaths = [regex]::Matches($text, '/[a-zA-Z0-9_/.-]*(?:api|stream|video|movie|series|watch|content|media|vod|playback|auth|login)[a-zA-Z0-9_/.-]*', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
$uniqueAPIPaths = $apiPaths | ForEach-Object { $_.Value } | Sort-Object -Unique | Where-Object { $_.Length -gt 5 }
"API-like paths: $($uniqueAPIPaths.Count)"
$uniqueAPIPaths | Select-Object -First 30 | ForEach-Object { Write-Host "  $_" }